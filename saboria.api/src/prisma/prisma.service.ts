import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const poolConfig = buildPoolConfig(process.env.DATABASE_URL ?? '');
    super({
      adapter: new PrismaMariaDb(poolConfig),
    });
  }

  async onModuleInit(): Promise<void> {
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        await this.$queryRaw`SELECT 1`;
        this.logger.log('Base de datos conectada correctamente');
        return;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Intento ${attempt}/${maxRetries} de conexión a BD falló: ${msg}`,
        );
        if (attempt < maxRetries) {
          const delay = attempt * 3000;
          this.logger.warn(`Reintentando en ${delay / 1000}s...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    this.logger.error(
      'No se pudo conectar a la base de datos después de ' +
        maxRetries +
        ' intentos. Verifica DATABASE_URL y que XAMPP (MySQL) esté activo.',
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

function buildPoolConfig(rawUrl: string): Record<string, unknown> {
  const url = new URL(rawUrl);

  const charset = url.searchParams.get('charset') ?? 'utf8mb4';
  url.searchParams.delete('connectionLimit');
  url.searchParams.delete('connectTimeout');
  url.searchParams.delete('acquireTimeout');
  url.searchParams.delete('charset');

  return {
    host: url.hostname || '127.0.0.1',
    port: parseInt(url.port || '3306', 10),
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.replace(/^\//, ''),
    charset,
    connectionLimit: 10,
    connectTimeout: 30000,
    acquireTimeout: 30000,
    idleTimeout: 60000,
    minimumIdle: 2,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  };
}
