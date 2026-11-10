import {Inject, Injectable} from "@nestjs/common";
import {AuthenticationRegistry, JwtBearerProvider, type JwtClaims} from "@nestjs/authentication";
import type {User} from "../users/interfaces/users.interface.ts";
import {UsersRepository} from "../users/users.repository.ts";

@Injectable()
export class JwtAuth extends JwtBearerProvider<User> {
    constructor(
        @Inject(UsersRepository) private readonly usersRepository: UsersRepository,
        @Inject(AuthenticationRegistry) registry: AuthenticationRegistry,
    ) {
        super({ realm: 'store' });
        registry.registerProvider(this, { order: 1 })
    }

    validate({ sub }: JwtClaims) {
        return sub ? this.usersRepository.findById(sub) : null;
    }
}