import {ConflictException, ForbiddenException, Inject, Injectable} from "@nestjs/common";
import {
    AuthenticationRegistry,
    OidcAccountResolver,
    type OidcProfile,
    type OidcResolveContext
} from "@nestjs/authentication";
import {UsersRepository} from "../users/users.repository.ts";
import type {OAuthToken} from "alchemy/GCP/CloudScheduler";
import type {User} from "../users/interfaces/users.interface.ts";

@Injectable()
export class AccountLinker extends OidcAccountResolver {
    constructor(
        @Inject(UsersRepository) private usersRepository: UsersRepository,
        @Inject(AuthenticationRegistry) registry: AuthenticationRegistry,
    ) {
        super();
        registry.registerHandler('oidc', this)
    }

    async resolveUser(profile: OidcProfile, _tokens: OAuthToken, { linkTo }: OidcResolveContext): Promise<User | null> {
        const linked = await this.usersRepository.findByIdentity(profile.provider, profile.subject)
        if (linkTo) {
            if(linked && linked.id !== linkTo.id) {
                throw new ConflictException('This Google account belongs to another customer')
            }
            return this.usersRepository.linkIdentity(linkTo.id, profile.provider, profile.subject)
        }
        if(linked) {
            return linked
        }
        if(!profile.email || !profile.emailVerified) {
            return null;
        }
        const existing = await this.usersRepository.findByEmail(profile.email)
        if(!existing) {
            const user = await this.usersRepository.create(profile.email, null, { emailVerified: profile.emailVerified })
            return this.usersRepository.linkIdentity(user.id, profile.provider, profile.subject)
        }
        if(!existing.emailVerified) {
            throw new ForbiddenException('Sign in with your password, then connect Google from your account')
        }
        return this.usersRepository.linkIdentity(existing.id, profile.provider, profile.subject)
    }
}