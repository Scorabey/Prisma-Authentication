import { Module } from '@nestjs/common';
import {UsersModule} from "../users/users.module.ts";
import {SessionAuth} from "./session-auth.provider.ts";
import {CredentialsService} from "./credentials.service.ts";
import {AuthController} from "./auth.controller.ts";
import {EmailVerificationMailer} from "./email-verification.mailer.ts";
import {EmailVerificationController} from "./email-verification.controller.ts";
import {PasswordResetMailer} from "./password-reset.mailer.ts";
import {ResetPasswordController} from "./password-reset.controller.ts";

@Module({
    imports: [UsersModule],
    controllers: [AuthController, EmailVerificationController, ResetPasswordController],
    providers: [SessionAuth, CredentialsService, EmailVerificationMailer, PasswordResetMailer]
})
export class AuthModule {}
