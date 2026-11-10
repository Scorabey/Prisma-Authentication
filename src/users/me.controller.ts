import {Body, ConflictException, Controller, Get, Inject, Patch} from "@nestjs/common";
import {Authenticate, CurrentUser, EmailVerificationService} from "@nestjs/authentication";
import type {User} from "./interfaces/users.interface.ts";
import {UsersRepository} from "./users.repository.ts";
import {type EmailDto, emailSchema} from "../auth/dto/auth.schemas.ts";

@Controller("me")
export class MeController {
    constructor(
        @Inject(UsersRepository) private readonly usersRepository: UsersRepository,
        @Inject(EmailVerificationService) private readonly emailVerificationService: EmailVerificationService,
    ) {}

    @Get()
    me(@CurrentUser() user: User) {
        return user;
    }

    @Authenticate({ mfa: true })
    @Patch('email')
    async changeEmail(@CurrentUser('id') userId: string, @Body({ schema: emailSchema }) body: EmailDto) {
        if(await this.usersRepository.findByEmail(body.email)) {
            throw new ConflictException('Email already registered')
        }
        const user = await this.usersRepository.updateEmail(body.email, userId)
        if(user) {
            await this.emailVerificationService.send(user)
        }
        return user;
    }
}