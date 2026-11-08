import { Module } from '@nestjs/common';
import {UsersModule} from "../users/users.module.ts";
import {SessionAuth} from "./session-auth.provider.ts";

@Module({
    imports: [UsersModule],
    providers: [SessionAuth]
})
export class AuthModule {}
