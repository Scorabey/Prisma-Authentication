import {type ArgumentsHost, Catch, type ExceptionFilter} from "@nestjs/common";
import {ThrottlerException} from "@nestjs/throttler";

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
    catch(exception: ThrottlerException, host: ArgumentsHost) {
        const res = host.switchToHttp().getResponse();
        res.status(429).json({
            statusCode: 429,
            message: exception.message,
        })
    }
}