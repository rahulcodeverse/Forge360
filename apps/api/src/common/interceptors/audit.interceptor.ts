import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (!mutatingMethods.includes(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        // Audit logging is handled per-service via AuditService.
        // This interceptor is a placeholder for cross-cutting audit metadata
        // (e.g. attaching request context to AsyncLocalStorage).
      }),
    );
  }
}
