import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./module-common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation with custom error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip out unknown fields
      forbidNonWhitelisted: true, // Reject unknown fields
      transform: true, // Automatically transform payloads to DTOs
      exceptionFactory: (errors) => {
        const messages = errors.map(
          (err) =>
            `${err.property}: ${Object.values(err.constraints || {}).join(", ")}`,
        );
        return new BadRequestException(messages);
      },
    }),
  );

  // Use the global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
