import {Inject, Injectable} from "@nestjs/common";
import {AuthenticationRegistry, SessionCookieProvider, type SessionRecord} from "@nestjs/authentication";
import type {User} from "../users/interfaces/users.interface.ts";
import {UsersRepository} from "../users/users.repository.ts";

@Injectable()
export class SessionAuth extends SessionCookieProvider<User> {
    constructor(
        @Inject(UsersRepository) private readonly userRepository: UsersRepository,
        @Inject(AuthenticationRegistry) registry: AuthenticationRegistry,
    ) {
        super();
        registry.registerProvider(this)
    }

    protected validate(session: SessionRecord): Promise<User | null | undefined> | null | undefined | User {
        return this.userRepository.findById(session.userId);
    }
}