import {Body, Controller, HttpCode, HttpStatus, Inject, Post, UnauthorizedException} from "@nestjs/common";
import {MagicLinkService, Public} from "@nestjs/authentication";
import {type EmailDto, emailSchema} from "./dto/auth.schemas.ts";
import {minutes, Throttle} from "@nestjs/throttler";

@Public()
@Controller('auth/magic-link')
export class MagicLinkController {
    constructor(
        @Inject(MagicLinkService) private readonly magicLinkService: MagicLinkService,
    ) {}

    @Throttle({
        default: { limit: 10, ttl: minutes(15) },
        account: { limit: 3, ttl: minutes(15) },
    })
    @Post()
    @HttpCode(HttpStatus.ACCEPTED)
    async request(@Body({ schema: emailSchema }) body: EmailDto, @Body('redirectTo') redirectTo?: string) {
        await this.magicLinkService.create(body.email, { redirectTo })
    }

    @Post('consume')
    @HttpCode(HttpStatus.OK)
    async consume(@Body('token') token: string) {
        const result = await this.magicLinkService.consume(token);
        if(!result) {
            throw new UnauthorizedException('Invalid or expired link')
        }
        return { redirectTo: result.redirectTo ?? '/', mfaRequired: result.session.mfa === 'pending' }
    }
}