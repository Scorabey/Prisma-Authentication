import {Injectable, NotFoundException, UnauthorizedException} from "@nestjs/common";
import type {PrismaService} from "../prisma.service.ts";
import type {User} from "./interfaces/users.interface.ts";
import {email} from "alchemy/Cloudflare";

interface UserRow extends User {
    passwordHash: string;
}

@Injectable()
export class UsersRepository {
    constructor(
        private readonly prismaService: PrismaService
    ) {}

    async create(
        email: string,
        passwordHash: string,
        { emailVerified = false }: { emailVerified?: boolean } = {},
    ): Promise<User> {
        return await this.prismaService.db.orm.public.User.create({
            id: crypto.randomUUID(),
            email: normalize(email),
            emailVerified,
            passwordHash,
        })
    }

    async findById(id: string): Promise<User | null> {
        return await this.prismaService.db.orm.public.User
            .select(
                "id",
                "email",
                "emailVerified",
                "role",
                "updatedAt",
                "createdAt"
            )
            .where({ id })
            .first();
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.prismaService.db.orm.public.User
            .select(
                "id",
                "email",
                "emailVerified",
                "role",
                "updatedAt",
                "createdAt"
            )
            .where({ email })
            .first();
    }

    async findCredentials(email: string): Promise<{ user: User, passwordHash: string } | null> {
        const result = await this.prismaService.db.orm.public.User
            .select(
                "id",
                "email",
                "emailVerified",
                "role",
                "passwordHash",
                "updatedAt",
                "createdAt"
            )
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
            .select(
                "id",
                "email",
                "emailVerified",
                "role",
                "updatedAt",
                "createdAt"
            )
            .where({ id })
            .update({ email: normalize(email) })
    }

    private async findRow(email: string): Promise<User | null> {
        return await this.prismaService.db.orm.public.User
            .select(
                "id",
                "email",
                "emailVerified",
                "role",
                "updatedAt",
                "createdAt"
            )
            .where({ email: normalize(email) })
            .first();
    }
}

const normalize = (email: string) => email.trim().normalize("NFC").toLowerCase();