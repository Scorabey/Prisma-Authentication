import { Module } from '@nestjs/common';
import {UsersRepository} from "./users.repository.ts";
import {PrismaModule} from "../prisma/prisma.module.ts";
import {UsersController} from "./users.controller.ts";

@Module({
    imports: [PrismaModule],
    providers: [UsersRepository],
    controllers: [UsersController],
    exports: [UsersRepository]
})
export class UsersModule {}
