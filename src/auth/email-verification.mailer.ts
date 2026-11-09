import {Inject, Injectable} from "@nestjs/common";
import {type Mailable, Mailer} from "@nestjs/mail";
import {AuthenticationRegistry, EmailVerificationHandler, type EmailVerificationLink} from "@nestjs/authentication";
import { UsersRepository } from "../users/users.repository.ts";

@Injectable()
export class VerifyEmailMail  implements Mailable<EmailVerificationLink> {
    render({ url }: EmailVerificationLink) {
        return {
            subject: 'Confirm your email address',
            template: 'verify-email',
            context: { url }
        };
    };
}

@Injectable()
export class EmailVerificationMailer extends EmailVerificationHandler {
    constructor(
        @Inject(UsersRepository) private readonly userRepository: UsersRepository,
        @Inject(Mailer) private readonly mailer: Mailer,
        @Inject(AuthenticationRegistry) registry: AuthenticationRegistry
    ) {
        super();
        registry.registerHandler('emailVerification', this)
    }

    async send(link: EmailVerificationLink): Promise<void> {
        await this.mailer.send(VerifyEmailMail, { to: link.email, data: link })
    }

    async markVerified(userId: string, email: string): Promise<boolean> {
        return this.userRepository.markEmailVerified(userId, email)
    }
}