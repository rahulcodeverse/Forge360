import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  requestId: string;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId =
      (request.headers['x-request-id'] as string | undefined) ?? crypto.randomUUID();

    return next.handle().pipe(
      map((responseData: T) => {
        // If the response already has { data, meta } shape, don't double-wrap
        if (
          responseData !== null &&
          typeof responseData === 'object' &&
          'data' in (responseData as object) &&
          'meta' in (responseData as object)
        ) {
          return {
            ...(responseData as object),
            requestId,
            timestamp: new Date().toISOString(),
          } as ApiResponse<T>;
        }

        return {
          data: responseData,
          requestId,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
