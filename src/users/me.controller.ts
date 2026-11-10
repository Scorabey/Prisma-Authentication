import {Controller, Get} from "@nestjs/common";
import {CurrentUser} from "@nestjs/authentication";
import type {User} from "./interfaces/users.interface.ts";

@Controller("me")
export class MeController {
    @Get()
    me(@CurrentUser() user: User) {
        return user;
    }
}