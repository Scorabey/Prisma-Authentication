import {CurrentUser, EmailVerificationService, Public} from "@nestjs/authentication";
import {
    BadRequestException,
    Body,
    ConflictException,
    Controller,
    HttpCode,
    HttpStatus, Inject,
    Post,
    Req
} from "@nestjs/common";
import type {User} from "../users/interfaces/users.interface.ts";

@Controller('auth/email')
export class EmailVerificationController {
    constructor(@Inject(EmailVerificationService) private readonly emailVerificationService: EmailVerificationService) {}

    @Public()
    @Post('verify')
    @HttpCode(HttpStatus.OK)
    async verify(@Body('token') token: string) {
        const verified = await this.emailVerificationService.verify(token);
        if(!verified) {
            throw new BadRequestException("Invalid or expired link");
        }
        return { email: verified.email, emailVerified: true };
    }

    @Post('verification')
    @HttpCode(HttpStatus.ACCEPTED)
    async resend(@CurrentUser() user: User) {
        if(user.emailVerified) {
            throw new ConflictException("Email address already verified");
        }
        await this.emailVerificationService.send(user);
    }
}