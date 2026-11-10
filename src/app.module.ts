import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaService } from "./prisma/prisma.service.ts";
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import {AuthenticationModule} from "@nestjs/authentication";
import {FileTemplateEngine, LogMailTransport, MailModule, SmtpTransport} from "@nestjs/mail";
import "dotenv/config"
import {join} from "node:path";

@Module({
  imports: [
      MailModule.forRootAsync({
          useFactory: () => ({
              transport: process.env.SMTP_URL ? new SmtpTransport({ url: process.env.SMTP_URL }) : new LogMailTransport(),
              templates: new FileTemplateEngine({ dir: join(import.meta.dirname, 'mail/templates') }),
              from: 'Scorabey <scorabey1@gmail.com>'
          })
      }),
      AuthenticationModule.forRootAsync({
          useFactory: () => ({
              session: {
                  absoluteTtl: '14d',
                  idleTtl: '3d',
              },
              accessToken: {
                  key: process.env.JWT_SECRET!,
                  issuer: "http://localhost:3000",
                  audience: "mobile-app",
                  ttl: "15m",
              },
              mfa: {
                issuer: "example.com",
                encryption: { keys: [process.env.TOTP_ENCRYPTION_KEY!] },
              },
              refreshToken: false,
              emailVerification: { url: `${process.env.APP_URL}/verify-email` },
              passwordReset: { url: `${process.env.APP_URL}/reset-password` },
          })
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
