import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protege los endpoints de administración: requiere un JWT válido con
 * role === 'admin' (los clientes no entran al panel).
 */
@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: unknown, user: TUser): TUser {
    if (err || !user || (user as { role?: string }).role !== 'admin') {
      throw new ForbiddenException('Se requiere acceso de administrador');
    }
    return user;
  }
}
