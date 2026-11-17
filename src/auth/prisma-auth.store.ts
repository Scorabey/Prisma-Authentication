import {Inject, Injectable} from "@nestjs/common";
import {
    AuthenticationStorage,
    type EmailTokenStore,
    type MagicLinkStore,
    type MfaStore,
    type OidcStateStore,
    type RefreshTokenStore,
    type SessionStore,
    type SessionRecord, type RefreshTokenRecord, type TotpRecord, type MagicLinkRecord,
    type OidcTransaction,
    type EmailTokenRecord,
    type EmailTokenPurpose,
} from "@nestjs/authentication";
import {PrismaService} from "../prisma/prisma.service.ts";
import {and, or} from "@prisma/orm-postgres/orm-client";

@Injectable()
export class PrismaAuthStore
    implements SessionStore, RefreshTokenStore, MfaStore, MagicLinkStore, OidcStateStore, EmailTokenStore
{
    protected readonly maxPending: number = 100_000

    constructor(
        @Inject(PrismaService) private readonly prismaService: PrismaService,
        @Inject(AuthenticationStorage) storage: AuthenticationStorage
    ) {
        storage.registerSource({
            sessions: this,
            refreshTokens: this,
            mfa: this,
            magicLinks: this,
            oidcStates: this,
            emailTokens: this,
        })
    }

    // Sessions

    async getSession(id: string): Promise<SessionRecord | undefined> {
        const data = await this.prismaService.db.orm.public.Sessions
            .select(...SESSION_FIELDS)
            .where({ id })
            .first()

        if(!data) return undefined;

        return {
            ...data,
            mfa: data.mfa ?? undefined,
            metadata: (data.metadata ?? undefined) as Record<string, unknown> | undefined,
        }
    }

    async listUserSessions(userId: string): Promise<SessionRecord[]> {
        const data = await this.prismaService.db.orm.public.Sessions
            .select(...SESSION_FIELDS)
            .where({ userId })
            .all()

        if(!data) return [];

        return data.map((data) => {
            return {
                ...data,
                metadata: (data.metadata ?? undefined) as Record<string, unknown> | undefined,
                mfa: data.mfa ?? undefined,
            }
        });
    }

    async createSession(record: SessionRecord): Promise<void> {
        const { id, userId, createdAt, lastActiveAt, expiresAt } = record;

        await this.prismaService.db.orm.public.Sessions
            .where((s) => s.expiresAt.lte(createdAt))
            .deleteAll()

        await this.prismaService.db.orm.public.Sessions.create({
            id,
            userId,
            createdAt,
            lastActiveAt,
            expiresAt,
            mfa: record.mfa ?? undefined,
            metadata: (record.metadata ?? undefined) as SessionCreate["metadata"] | undefined,
        })
    }

    async touchSession(id: string, lastActiveAt: Date): Promise<void> {
        await this.prismaService.db.orm.public.Sessions
            .where({ id })
            .update({ lastActiveAt })
    }

    async deleteSession(id: string): Promise<boolean> {
        const deleted = await this.prismaService.db.orm.public.Sessions
            .where({ id })
            .delete()

        return deleted !== null;
    }

    async deleteUserSessions(userId: string): Promise<void> {
        await this.prismaService.db.orm.public.Sessions
            .where({ userId })
            .deleteAll()
    }

    // Refresh Tokens

    async getRefreshToken(id: string): Promise<RefreshTokenRecord | undefined> {
        const data = await this.prismaService.db.orm.public.RefreshTokens
            .select(...REFRESH_FIELDS)
            .where({ id })
            .first()

        if(!data) return undefined;

        return {
            ...data,
           usedAt: data.usedAt ?? undefined,
           claims: (data.claims ?? undefined) as Record<string, unknown> | undefined,
        };
    }

    async saveRefreshToken(record: RefreshTokenRecord): Promise<void> {
        await this.prismaService.db.orm.public.RefreshTokens.create({
            id: record.id,
            userId: record.userId,
            expiresAt: record.expiresAt,
            createdAt: record.createdAt,
            familyExpiresAt: record.familyExpiresAt,
            familyId: record.familyId,
            claims: record.claims as RefreshCreate["claims"],
            usedAt: record.usedAt as RefreshCreate["usedAt"],
        })
    }

    async markRefreshTokenUsed(id: string, at: Date): Promise<boolean> {
        const updated = await this.prismaService.db.orm.public.RefreshTokens
            .where({ id, usedAt: null })
            .update({ usedAt: at })

        return updated !== null;
    }

    async revokeRefreshTokenFamily(familyId: string): Promise<void> {
        await this.prismaService.db.orm.public.RefreshTokens.where({ familyId }).update({ revoked: true });
    }

    async isRefreshTokenFamilyRevoked(familyId: string): Promise<boolean> {
        const revoked = await this.prismaService.db.orm.public.RefreshTokens
            .select("id")
            .where({ familyId, revoked: true })
            .first();

        return revoked !== null && revoked !== undefined;
    }

    async revokeUserRefreshTokens(userId: string): Promise<void> {
        await this.prismaService.db.orm.public.RefreshTokens
            .where({ userId })
            .update({ revoked: true });
    }

    // Mfa

    async getTotp(userId: string): Promise<TotpRecord | undefined> {
        const data = await this.prismaService.db.orm.public.MfaAuthenticators
            .select(...MFA_FIELDS)
            .where({ userId })
            .first()

        if(!data) return undefined;

        const { userId: _, ...totp } = data

        return {
            ...totp,
            pendingSecret: totp.pendingSecret ?? undefined,
            lastUsedStep: totp.lastUsedStep ?? undefined
        };
    }

    async saveTotp(userId: string, record: TotpRecord | null): Promise<void> {
        const table = this.prismaService.db.orm.public.MfaAuthenticators

        if(!record) {
            await table.where({ userId }).delete()
            return;
        }

        const values = {
            secret: record.secret,
            confirmed: record.confirmed,
            pendingSecret: record.pendingSecret ?? null,
        }

        await table
            .upsert({
                create: {
                    userId,
                    ...values,
                    lastUsedStep: record.lastUsedStep ?? undefined
                },
                update: values,
            })

        if(record.lastUsedStep !== null) {
            const step = record.lastUsedStep
            if(step === null) {
                await table
                    .where({ userId })
                    .where((m) => m.lastUsedStep.lt(step))
                    .update({ lastUsedStep: step })
            }
        }
    }

    async claimTotpStep(userId: string, step: number): Promise<boolean> {
        const updated = await this.prismaService.db.orm.public.MfaAuthenticators
            .where((m) => and(
                m.userId.eq(userId),
                or(m.lastUsedStep.isNull(), m.lastUsedStep.lt(step))
            ))
            .updateAll({ lastUsedStep: step })

        return updated.length === 1
    }

    async saveRecoveryCodes(userId: string, hashes: string[]): Promise<void> {
        const uniqueHashed = [...new Set(hashes)]

        await this.prismaService.db.transaction(async tx => {
            await tx.orm.public.MfaRecoveryCodes
                .where({ userId })
                .delete()
            if(uniqueHashed.length > 0) {
                await this.prismaService.db.orm.public.MfaRecoveryCodes.createAll(
                    uniqueHashed.map((codeHash) => ({ userId, codeHash })),
                )
            }
        })
    }

    async consumeRecoveryCode(userId: string, hash: string): Promise<boolean> {
        const consumed = await this.prismaService.db.orm.public.MfaRecoveryCodes
            .select("userId")
            .where({ userId, codeHash: hash })
            .deleteAll()

        return consumed.length === 1
    }

    async countRecoveryCodes(userId: string): Promise<number> {
        const array = await this.prismaService.db.orm.public.MfaRecoveryCodes
            .select("userId")
            .where({ userId })
            .all()

        return array.length
    }

    async recordMfaFailure(userId: string, windowMs: number, now: number): Promise<number> {
        await this.prismaService.db.orm.public.MfaFailures.create({
            userId,
            failedAt: new Date(now)
        })

        const { total: failures } = await this.prismaService.db.orm.public.MfaFailures
            .where({ userId })
            .where((f) => f.failedAt.gt(new Date(now - windowMs)))
            .aggregate((a) => ({ total: a.count() }))

        await this.prismaService.db.orm.public.MfaFailures
            .where((f) => f.failedAt.lte(new Date(now - windowMs)))
            .deleteAndCount()

        return failures
    }

    async countMfaFailures(userId: string, windowMs: number, now: number): Promise<number> {
        const { total } = await this.prismaService.db.orm.public.MfaFailures
            .where({ userId })
            .where((f) => f.failedAt.gt(new Date(now - windowMs)))
            .aggregate((a) => ({ total: a.count() }))

        return total
    }

    async clearMfaFailures(userId: string): Promise<void> {
        await this.prismaService.db.orm.public.MfaFailures.where({ userId }).deleteAll()
    }

    // Magic links

    async saveMagicLink(record: MagicLinkRecord): Promise<void> {
        await this.prismaService.db.orm.public.MagicLinks.create(record)
        await this.trim("MagicLinks", record.createdAt)
    }

    async consumeMagicLink(id: string): Promise<MagicLinkRecord | undefined> {
        const res = await this.prismaService.db.orm.public.MagicLinks
            .select(...MAGIC_FIELDS)
            .where({ id })
            .delete()

        if(!res) return undefined

        return {
            ...res,
            redirectTo: res.redirectTo ?? undefined
        }
    }

    // Oidc States

    async saveOidcState({ link, ...login }: OidcTransaction): Promise<void> {
        await this.prismaService.db.orm.public.OidcLogins.create({
            ...login,
            linkUserId: link?.userId,
            linkSessionId: link?.sessionId
        })
        await this.trim("OidcLogins", login.createdAt)
    }

    async consumeOidcState(state: string): Promise<OidcTransaction | undefined> {
        const res = await this.prismaService.db.orm.public.OidcLogins
            .select(...OIDC_FIELDS)
            .where({ state })
            .delete()

        if(!res) return undefined

        const { linkUserId, linkSessionId, ...login } = res
        return linkUserId && linkSessionId 
        ? { 
            ...login,
            nonce: login.nonce ?? undefined,
            redirectTo: login.redirectTo ?? undefined,
            link: { 
                userId: linkUserId, 
                sessionId: linkSessionId 

            } 
        } 
        : {
            ...login,
            nonce: login.nonce ?? undefined,
            redirectTo: login.redirectTo ?? undefined,
        }
    }

    // Email Tokens

    async saveEmailToken(record: EmailTokenRecord): Promise<void> {
        await this.prismaService.db.orm.public.EmailTokens.create(record)
        await this.trim("EmailTokens", record.createdAt)
    }

    async consumeEmailToken(id: string, purpose: EmailTokenPurpose): Promise<EmailTokenRecord | undefined> {
        const res = await this.prismaService.db.orm.public.EmailTokens
            .select(...EMAIL_FIELDS)
            .where({ id, purpose })
            .delete()

        if(!res) return undefined

        return {
            ...res,
            fingerprint: res.fingerprint ?? undefined
        }
    }

    async deleteUserEmailTokens(userId: string, purpose: EmailTokenPurpose): Promise<void> {
        await this.prismaService.db.orm.public.EmailTokens
            .where({ userId, purpose })
            .delete()
    }

    // Private methods

    private async trim(table: TrimTable, now: Date) {
        const model = this.prismaService.db.orm.public[table] as typeof this.prismaService.db.orm.public.MagicLinks

        await model
            .where((t) => t.expiresAt.lte(now))
            .deleteAll()

        const [cutoff] = await model
            .select("expiresAt")
            .orderBy((t) => t.expiresAt.desc())
            .offset(this.maxPending)
            .limit(1)
            .all()

        if(cutoff) {
            await model.where((t) => t.expiresAt.lte(cutoff.expiresAt)).deleteAll()
        }
    }
}

type TrimTable = 'MagicLinks' | 'OidcLogins' | 'EmailTokens';
const REFRESH_FIELDS = ["id", "userId", "expiresAt", "createdAt", "usedAt", "createdAt", "expiresAt", "claims", "familyId", "familyExpiresAt", "revoked"] as const
const SESSION_FIELDS = ["id", "userId", "lastActiveAt", "createdAt", "expiresAt", "metadata", "mfa"] as const
const MFA_FIELDS = ["userId", "confirmed", "lastUsedStep", "pendingSecret", "secret"] as const
const MAGIC_FIELDS = ["id", "email", "redirectTo", "createdAt", "expiresAt"] as const
const OIDC_FIELDS = ["codeVerifier", "createdAt", "expiresAt", "linkSessionId", "linkUserId", "nonce", "provider", "redirectTo", "state"] as const
const EMAIL_FIELDS = ["createdAt", "email", "expiresAt", "fingerprint", "id", "purpose", "userId"] as const
type SessionCreate = Parameters<PrismaService["db"]["orm"]["public"]["Sessions"]["create"]>[0]
type RefreshCreate = Parameters<PrismaService["db"]["orm"]["public"]["RefreshTokens"]["create"]>[0]

type a="Next"|"Nest";const b=`${["Nest"] as a[]}.js`;