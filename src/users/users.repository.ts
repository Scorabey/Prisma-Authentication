import {Inject, Injectable} from "@nestjs/common";
import {PrismaService} from "../prisma/prisma.service.ts";
import type {User} from "./interfaces/users.interface.ts";
import {id} from "zod/locales";

interface UserRow extends User {
    passwordHash: string;
}

@Injectable()
export class UsersRepository {
    constructor(
        @Inject(PrismaService) private readonly prismaService: PrismaService
    ) {}

    async findAll(): Promise<User[]> {
        return await this.prismaService.db.orm.public.User.select(...USER_FIELDS).all().toArray();
    }

    async create(
        email: string,
        passwordHash: string | null,
        { emailVerified = false }: { emailVerified?: boolean } = {},
    ): Promise<User> {
        return await this.prismaService.db.orm.public.User
            .select(...USER_FIELDS)
            .create({
                id: crypto.randomUUID(),
                email: normalize(email),
                emailVerified,
                passwordHash,
            })
    }

    async findById(id: string): Promise<User | null> {
        return await this.prismaService.db.orm.public.User
            .select(...USER_FIELDS)
            .where({ id })
            .first();
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.prismaService.db.orm.public.User
            .select(...USER_FIELDS)
            .where({ email })
            .first();
    }

    async findCredentials(email: string): Promise<{ user: User, passwordHash: string | null } | null> {
        const result = await this.prismaService.db.orm.public.User
            .select(...USER_FIELDS, "passwordHash")
            .where({ email: normalize(email) })
            .first();

        if (!result) {
            return null;
        }

        const { passwordHash, ...user } = result;

        return { user, passwordHash }
    }

    async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
        await this.prismaService.db.orm.public.User
            .where({ id })
            .update({ passwordHash })
    }

    async updateEmail(email: string, id: string): Promise<User | null> {
        return await this.prismaService.db.orm.public.User
            .select(...USER_FIELDS)
            .where({ id })
            .update({ email: normalize(email) })
    }

    async markEmailVerified(id: string, email: string): Promise<boolean> {
        const updated = await this.prismaService.db.orm.public.User
            .where({ id, email: normalize(email) })
            .update({ emailVerified: true })

        return updated !== null;
    }

    async findByIdentity(provider: string, subject: string): Promise<User | null> {
        const found = await this.prismaService.db.orm.public.UserIdentity
            .select("user_id")
            .where({ provider, subject })
            .first();

        return found ? this.findById(found.user_id) : null;
    }

    async linkIdentity(userId: string, provider: string, subject: string): Promise<User | null> {
         await this.prismaService.db.orm.public.UserIdentity.select(
            "id",
            "user_id",
            "provider",
            "subject",
            "createdAt"
        )
            .create({
                id: crypto.randomUUID(),
                user_id: userId,
                provider,
                subject,
            })
        return this.findById(userId);
    }

    private async findRow(email: string): Promise<User | null> {
        return await this.prismaService.db.orm.public.User
            .select(...USER_FIELDS)
            .where({ email: normalize(email) })
            .first();
    }
}

const USER_FIELDS = ["id", "email", "emailVerified", "role", "createdAt", "updatedAt"] as const;
const normalize = (email: string) => email.trim().normalize("NFC").toLowerCase();