import {OidcService, Public} from "@nestjs/authentication";
import {Controller, Get, Inject, Param, Query, Redirect} from "@nestjs/common";

@Public()
@Controller('auth/oidc')
export class OidcController {
    constructor(@Inject(OidcService) private readonly oidcService: OidcService) {}

    @Get(':provider/login')
    @Redirect()
    login(
        @Param('provider') provider: string,
        @Query('redirectTo') redirectTo?: string,
        @Query('link') link?: string
    ) {
        return this.oidcService.start(provider, { redirectTo, link: link === "true" });
    }

    @Get(':provider/callback')
    @Redirect()
    callback(
        @Param('provider') provider: string,
        @Query() query: Record<string, string>
    ) {
        return this.oidcService.finish(provider, query);
    }
}