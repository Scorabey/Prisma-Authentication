import {BadRequestException, Body, Controller, HttpCode, HttpStatus, Inject, Post} from "@nestjs/common";
import {PasswordResetService, Public} from "@nestjs/authentication";
import {type EmailDto, emailSchema, type ResetPasswordDto, resetPasswordSchema} from "./dto/auth.schemas.ts";

@Public()
@Controller('auth/password')
export class ResetPasswordController {
    constructor(@Inject(PasswordResetService) private readonly passwordResetService: PasswordResetService) {}

    @Post('forgot')
    @HttpCode(HttpStatus.ACCEPTED)
    forgot(@Body({ schema: emailSchema }) data: EmailDto) {
        this.passwordResetService.request(data.email)
    }

    @Post('reset')
    @HttpCode(HttpStatus.OK)
    async reset(@Body({ schema: resetPasswordSchema }) data: ResetPasswordDto) {
        const result = await this.passwordResetService.reset(data.token, data.password);
        if(!result) {
            throw new BadRequestException("Invalid or expired link");
        }
        return { mfaRequired: result.signedIn?.session.mfa === 'pending' }
    }
}