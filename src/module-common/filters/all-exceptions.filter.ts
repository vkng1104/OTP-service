/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

import { ErrorResponse } from "../model/response/error-response.dto";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
    }

    // Construct error response
    const errorResponse: ErrorResponse = {
      code: status,
      message,
      details: exception instanceof Error ? exception.stack : String(exception),
    };

    response.status(status).json(errorResponse);
  }
}
