import {Public, TokenService} from "@nestjs/authentication";
import {Body, Controller, HttpCode, HttpStatus, Inject, Post, UnauthorizedException} from "@nestjs/common";
import {CredentialsService} from "./credentials.service.ts";
import { type TokenRequestDto, tokenRequestSchema} from "./dto/auth.schemas.ts";

@Public()
@Controller("auth/token")
export class TokensController {
    constructor(
        @Inject(CredentialsService) private readonly credentialsService: CredentialsService,
        @Inject(TokenService) private readonly tokenService: TokenService
    ) {}

    @Post()
    @HttpCode(HttpStatus.OK)
    async issue(@Body({ schema: tokenRequestSchema }) body: TokenRequestDto) {
        const user = await this.credentialsService.verify(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }
        const { code, recoveryCode } = body;
        return this.tokenService.issue(user.id, {
            method: 'password',
            claims: { amr: ['pwd'] },
            secondFactor: { code, recoveryCode }
        })
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refresh(@Body('refreshToken') refreshToken: string) {
        return this.tokenService.refresh(refreshToken);
    }

    @Post('revoke')
    @HttpCode(HttpStatus.NO_CONTENT)
    async revoke(@Body('refreshToken') refreshToken: string) {
        await this.tokenService.revoke(refreshToken);
    }
}