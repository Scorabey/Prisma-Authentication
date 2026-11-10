import {Public, TokenService} from "@nestjs/authentication";
import {Body, Controller, HttpCode, HttpStatus, Inject, Post, UnauthorizedException} from "@nestjs/common";
import {CredentialsService} from "./credentials.service.ts";
import {type SignInDto, signInSchema} from "./dto/auth.schemas.ts";

@Public()
@Controller("auth/token")
export class TokensController {
    constructor(
        @Inject(CredentialsService) private readonly credentialsService: CredentialsService,
        @Inject(TokenService) private readonly tokenService: TokenService
    ) {}

    @Post()
    @HttpCode(HttpStatus.OK)
    async issue(@Body({ schema: signInSchema }) body: SignInDto) {
        const user = await this.credentialsService.verify(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }
        return this.tokenService.issue(user.id, {
            method: 'password',
            claims: { amr: ['pwd'] }
        })
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refresh(@Body('refreshToken') refreshToken: string) {
        return this.tokenService.refresh(refreshToken);
    }
}