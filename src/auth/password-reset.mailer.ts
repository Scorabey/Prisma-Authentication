import {Inject, Injectable} from "@nestjs/common";
import { type Mailable, Mailer} from "@nestjs/mail";
import {AuthenticationRegistry, PasswordResetHandler, type PasswordResetLink} from "@nestjs/authentication";
import {UsersRepository} from "../users/users.repository.ts";

@Injectable()
export class PasswordResetMail implements Mailable<PasswordResetLink> {
    render({ url }: PasswordResetLink) {
        return {
            subject: "Reset your password",
            template: "password-reset",
            context: { url },
        };
    }
}

@Injectable()
export class PasswordResetMailer extends PasswordResetHandler {
    constructor(
        @Inject(UsersRepository) private readonly usersRepository: UsersRepository,
        @Inject(Mailer) private readonly mailer: Mailer,
        @Inject(AuthenticationRegistry) registry: AuthenticationRegistry
    ) {
        super();
        registry.registerHandler('passwordReset', this)
    }

    async findUser(email: string): Promise<{ id: string, email: string, passwordHash: string } | null> {
        const found = await this.usersRepository.findCredentials(email);
        return found && { id: found.user.id, email: found.user.email, passwordHash: found.passwordHash };
    }

    async send(link: PasswordResetLink): Promise<void> {
        await this.mailer.send(PasswordResetMail, { to: link.email, data: link })
    }

    updatePassword(userId: string, passwordHash: string): Promise<void> {
        return this.usersRepository.updatePasswordHash(userId, passwordHash);
    }
}