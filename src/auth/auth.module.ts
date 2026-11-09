import { Module } from '@nestjs/common';
import {UsersModule} from "../users/users.module.ts";
import {SessionAuth} from "./session-auth.provider.ts";
import {CredentialsService} from "./credentials.service.ts";
import {AuthController} from "./auth.controller.ts";

@Module({
    imports: [UsersModule],
    controllers: [AuthController],
    providers: [SessionAuth, CredentialsService]
})
export class AuthModule {}
