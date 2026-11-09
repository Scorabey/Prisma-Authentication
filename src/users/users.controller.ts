import {Controller, Get, Inject} from "@nestjs/common";
import {Public} from "@nestjs/authentication";
import {UsersRepository} from "./users.repository.ts";
import type {User} from "./interfaces/users.interface.ts";

@Public()
@Controller('users')
export class UsersController {
    constructor(
        @Inject(UsersRepository) private readonly usersRepository: UsersRepository,
    ) {}

    @Get()
    async getAll(): Promise<User[]> {
        return await this.usersRepository.findAll()
    }
}