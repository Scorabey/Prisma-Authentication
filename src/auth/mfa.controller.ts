import {Body, Controller, HttpCode, HttpStatus, Inject, Post, UnauthorizedException} from "@nestjs/common";
import {
    Authenticate,
    CurrentSession,
    CurrentUser,
    MfaService,
    Public,
    type SessionRecord, SessionService,
    SignInService, TokenService
} from "@nestjs/authentication";
import type {User} from "../users/interfaces/users.interface.ts";

@Controller("auth/mfa")
export class MfaController {
    constructor(
        @Inject(MfaService) private readonly mfaService: MfaService,
        @Inject(SignInService) private readonly signInService: SignInService,
        @Inject(SessionService) private readonly sessionService: SessionService,
        @Inject(TokenService) private readonly tokenService: TokenService
    ) {}

    @Post("enroll")
    enroll(@CurrentUser() user: User) {
        return this.mfaService.enroll(user.id, user.email)
    }

    @Authenticate({ mfa: true })
    @Post('replace')
    replace(@CurrentUser() user: User) {
        return this.mfaService.enroll(user.id, user.email, { replace: true });
    }

    @Post('confirm')
    @HttpCode(HttpStatus.OK)
    async confirm(@CurrentUser('id') userId: string, @Body('code') code: string) {
        if(!(await this.signInService.confirmMfa(userId, code))) {
            throw new UnauthorizedException('Invalid code')
        }
        return { recoveryCodes: await this.mfaService.generateRecoveryCodes(userId) }
    }

    @Public()
    @Post('verify')
    @HttpCode(HttpStatus.OK)
    async verify(
        @Body('code') code: string | undefined,
        @Body('recoveryCode') recoveryCode: string | undefined
    ) {
        const issued = await this.signInService.completeMfa({ code, recoveryCode });
        if(!issued) {
            throw new UnauthorizedException('Invalid code')
        }
        return { mfa: issued.session.mfa }
    }

    @Authenticate({ mfa: true })
    @Post('disable')
    @HttpCode(HttpStatus.NO_CONTENT)
    async disable(
        @CurrentUser('id') userId: string,
        @CurrentSession() current: SessionRecord,
        @Body('code') code: string,
    ) {
        if(!(await this.mfaService.verifyTotp(userId, code))) {
            throw new UnauthorizedException('Invalid code')
        }
        await this.mfaService.disable(userId)
        await this.sessionService.revokeAll(userId, { except: current.id })
        await this.tokenService.revokeAll(userId)
    }
}