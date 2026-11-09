import {ConflictException, Inject, Injectable} from "@nestjs/common";
import {UsersRepository} from "../users/users.repository.ts";
import {PasswordHasher} from "@nestjs/authentication";
import type {User} from "../users/interfaces/users.interface.ts";

@Injectable()
export class CredentialsService {
    constructor(
        @Inject(UsersRepository) private readonly userRepository: UsersRepository,
        @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher,
    ) {}

    async register(email: string, password: string): Promise<User> {
        if(await this.userRepository.findByEmail(email)) {
            throw new ConflictException("Email already registered");
        }
        return this.userRepository.create(email, await this.passwordHasher.hash(password));
    }

    async verify(email: string, password: string): Promise<User | null> {
        const found = await this.userRepository.findCredentials(email);
        const valid = await this.passwordHasher.verify(email, found?.passwordHash);
        if (!valid || !found?.passwordHash) {
            return null;
        }
        if(this.passwordHasher.needsRehash(found.passwordHash)) {
            await this.userRepository.updatePasswordHash(found.user.id, await this.passwordHasher.hash(password));
        }
        return found.user;
    }
}