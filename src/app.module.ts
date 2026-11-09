import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaService } from "./prisma/prisma.service.ts";
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import {AuthenticationModule} from "@nestjs/authentication";

@Module({
  imports: [
      AuthenticationModule.forRoot({
        session: {
          absoluteTtl: '14d',
          idleTtl: '3d',
        }
      }),
      UsersModule,
      AuthModule
  ],
  controllers: [
    AppController
  ],
  providers: [
    PrismaService
  ],
})
export class AppModule {}
