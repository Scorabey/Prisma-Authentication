import {Module, ValidationPipe} from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaService } from "./prisma/prisma.service.ts";
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import {AuthenticationModule, google} from "@nestjs/authentication";
import {FileTemplateEngine, LogMailTransport, MailModule, SmtpTransport} from "@nestjs/mail";
import "dotenv/config"
import {join} from "node:path";
import {APP_FILTER, APP_GUARD, APP_PIPE, Reflector} from "@nestjs/core";
import {
    minutes,
    normalizeIp,
    ThrottlerGuard,
    ThrottlerModule,
    type ThrottlerModuleOptions,
    ThrottlerStorage
} from "@nestjs/throttler";
import {accountMail} from "./auth/account-mail.ts";
import {ThrottlerExceptionFilter} from "./common/filters/TthrottleException.filter.ts";

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
                  metadata: (request) => ({ userAgent: request.headers['user-agent'] }),
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
              oidc: {
                  callbackUrl: `${process.env.APP_URL}/auth/oidc/:provider/callback`,
                  providers: {
                      google: google({
                          clientId: process.env.GOOGLE_CLIENT_ID!,
                          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                      }),
                  },
              },
              refreshToken: false,
              emailVerification: { url: `${process.env.APP_URL}/verify-email` },
              passwordReset: { url: `${process.env.APP_URL}/reset-password` },
              magicLink: { url: `${process.env.APP_URL}/sign-in/magic` },
          })
      }),
      ThrottlerModule.forRoot([
          { name: "default", ttl: minutes(1), limit: 100 },
          {
              name: 'account',
              ttl: minutes(15),
              limit: 5,
              skipIf: (context) => !accountMail(context.switchToHttp().getRequest()),
              getTracker: (req) => `${accountMail(req)}|${normalizeIp(req.ip)}`,
          },
      ]),
      UsersModule,
      AuthModule
  ],
  controllers: [
    AppController
  ],
  providers: [
    PrismaService,
      { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true }) },
      { provide: APP_FILTER, useClass: ThrottlerExceptionFilter },
      {
          provide: APP_GUARD,
          useFactory: (options: ThrottlerModuleOptions, storage: ThrottlerStorage, reflector: Reflector) =>
              new ThrottlerGuard(options, storage, reflector),
          inject: ["THROTTLER:MODULE_OPTIONS", ThrottlerStorage, Reflector],
      },
  ],
})
export class AppModule {}
