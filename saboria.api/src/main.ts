import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

/** Orígenes permitidos: el cliente configurado y, en local, el de Vite. */
function allowedOrigins(): string[] {
  const list = new Set<string>();
  const configured = process.env.CLIENT_URL;
  if (configured) {
    for (const o of configured.split(',')) {
      const trimmed = o.trim();
      if (trimmed) list.add(trimmed);
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    list.add('http://localhost:5173');
    list.add('http://127.0.0.1:5173');
  }
  return [...list];
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  app.enableCors({ origin: allowedOrigins(), credentials: true });

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  logger.log(`Saboria API listening on port ${port}`);
}
void bootstrap();
