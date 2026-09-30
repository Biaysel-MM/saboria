import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protege todos los endpoints de administración. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
