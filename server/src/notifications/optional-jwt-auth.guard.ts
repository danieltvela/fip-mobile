import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT guard that authenticates when a valid bearer token is present but
 * lets the request through anonymously otherwise. The notification center
 * uses it while the mobile app has no login flow yet: anonymous requests
 * are served the seeded demo journalist (see NotificationsService).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser>(_err: unknown, user: TUser | false | null | undefined): TUser | null {
    return user || null;
  }
}
