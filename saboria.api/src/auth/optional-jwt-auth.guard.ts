import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Autenticación OPCIONAL: si llega un JWT válido se popula `request.user`;
 * si no llega (o es inválido) la petición continúa igualmente como anónima.
 * Sirve para endpoints públicos que personalizan la respuesta según sesión.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: unknown, user: TUser): TUser | null {
    return user ?? null;
  }
}
