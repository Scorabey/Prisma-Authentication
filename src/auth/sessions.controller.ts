import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    NotFoundException,
    Param,
    Post,
    UnauthorizedException
} from "@nestjs/common";
import {
    CurrentSession,
    CurrentUser,
    Public,
    type SessionRecord,
    SessionService,
    SignInService
} from "@nestjs/authentication";

@Controller('auth')
export class SessionsController {
    constructor(
        @Inject(SessionService) private readonly sessionService: SessionService,
        @Inject(SignInService) private readonly signInService: SignInService,
    ) {}

    @Get('sessions')
    async list(@CurrentUser('id') userId: string, @CurrentSession() current: SessionRecord) {
        const sessions = await this.sessionService.list(userId);
        return sessions.map(({ id, createdAt, lastActiveAt, metadata }) => ({
            id,
            createdAt,
            lastActiveAt,
            userAgent: metadata?.userAgent ?? null,
            current: id === current.id,
        }));
    }

    @Delete('sessions/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async revoke(@Param('id') id: string, @CurrentUser('id') userId: string) {
        if(!(await this.sessionService.revoke(id, { userId }))) {
            throw new NotFoundException()
        }
    }

    @Public()
    @Post('sign-out')
    @HttpCode(HttpStatus.NO_CONTENT)
    async signOut() {
        if(!(await this.signInService.signOut())) {
            throw new UnauthorizedException()
        }
    }

    @Post('sign-out-everywhere')
    @HttpCode(HttpStatus.NO_CONTENT)
    async signOutEveryWhere(@CurrentUser('id') userId: string) {
        await this.signInService.signOutEverywhere(userId);
    }
}