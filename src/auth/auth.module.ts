import { Module } from '@nestjs/common';
import {UsersModule} from "../users/users.module.ts";
import {SessionAuth} from "./session-auth.provider.ts";
import {CredentialsService} from "./credentials.service.ts";
import {AuthController} from "./auth.controller.ts";
import {EmailVerificationMailer} from "./email-verification.mailer.ts";
import {EmailVerificationController} from "./email-verification.controller.ts";
import {PasswordResetMailer} from "./password-reset.mailer.ts";
import {ResetPasswordController} from "./password-reset.controller.ts";
import {JwtAuth} from "./jwt-auth.provider.ts";
import {TokensController} from "./tokens.controller.ts";
import {MfaController} from "./mfa.controller.ts";
import {OidcController} from "./oidc.controller.ts";
import {AccountLinker} from "./account-linker.ts";
import {MagicLinkMailer} from "./magic-link.mailer.ts";
import {MagicLinkController} from "./magic-link.controller.ts";

@Module({
    imports: [UsersModule],
    controllers: [
        AuthController,
        EmailVerificationController,
        ResetPasswordController,
        TokensController,
        MfaController,
        OidcController,
        MagicLinkController
    ],
    providers: [
        SessionAuth,
        CredentialsService,
        EmailVerificationMailer,
        PasswordResetMailer,
        JwtAuth,
        AccountLinker,
        MagicLinkMailer
    ]
})
export class AuthModule {}
