import {Body, Controller, HttpCode, HttpStatus, Inject, Post, UnauthorizedException} from "@nestjs/common";
import {EmailVerificationService, Public, SignInService} from "@nestjs/authentication";
import {CredentialsService} from "./credentials.service.ts";
import {signInSchema, type SignUpDto, signUpSchema} from "./dto/auth.schemas.ts";
import type {SignInDto} from "./dto/auth.dto.ts";
import {hours, minutes, SkipThrottle, Throttle} from "@nestjs/throttler";

@Public()
@Controller("auth")
export class AuthController {
    constructor(
        @Inject(CredentialsService) private readonly credentialsService: CredentialsService,
        @Inject(SignInService) private readonly signInService: SignInService,
        @Inject(EmailVerificationService) private readonly emailVerificationService: EmailVerificationService
    ) {}

    @SkipThrottle({ account: true })
    @Throttle({ default: { limit: 10, ttl: hours(1) } })
    @Post('sign-up')
    @HttpCode(HttpStatus.CREATED)
    async signUp(@Body({ schema: signUpSchema }) body: SignUpDto) {
        const user = await this.credentialsService.register(body.email, body.password);
        await this.signInService.signIn(user.id, { method: "password" });
        await this.emailVerificationService.send(user)
        return user;
    }

    @Throttle({
        default: { limit: 30, ttl: minutes(15) },
        account: { limit: 5, ttl: minutes(15) },
    })
    @Post('sign-in')
    @HttpCode(HttpStatus.OK)
    async signIn(@Body({ schema: signInSchema }) body: SignInDto) {
        const user = await this.credentialsService.verify(body.email, body.password);
        if(!user) {
            throw new UnauthorizedException("Invalid email or password");
        }
        const { session } = await this.signInService.signIn(user.id, { method: "password" });
        return { mfaRequired: session.mfa === "pending" };
    }
}