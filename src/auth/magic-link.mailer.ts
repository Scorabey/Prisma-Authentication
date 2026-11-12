import {ForbiddenException, Inject, Injectable, UnauthorizedException} from "@nestjs/common";
import {type Mailable, Mailer} from "@nestjs/mail";
import {AuthenticationRegistry, type MagicLink, MagicLinkHandler} from "@nestjs/authentication";
import {UsersRepository} from "../users/users.repository.ts";
import type {User} from "../users/interfaces/users.interface.ts";

@Injectable()
export class MagicLinkMail implements Mailable<MagicLink> {
    render({ url }: MagicLink) {
        return {
            subject: "Your sign-in link",
            template: "magic-link",
            context: { url }
        }
    }
}

@Injectable()
export class MagicLinkMailer extends MagicLinkHandler {
    constructor(
        @Inject(UsersRepository) private readonly usersRepository: UsersRepository,
        @Inject(Mailer) private readonly mailer: Mailer,
        @Inject(AuthenticationRegistry) registry: AuthenticationRegistry,
    ) {
        super();
        registry.registerHandler("magicLink", this)
    }

    async send(link: MagicLink): Promise<void> {
        await this.mailer.send(MagicLinkMail, { to: link.email, data: link })
    }

    async resolveUser(email: string) {
        const user = await this.usersRepository.findByEmail(email);
        if (!user) {
            return this.usersRepository.create(email, null, { emailVerified: true })
        }
        if (!user.emailVerified) {
            throw new ForbiddenException("Sign in with your password, or reset it")
        }
        return user;
    }
}