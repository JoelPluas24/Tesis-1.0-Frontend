import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const responseInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  return next(req).pipe(
    map((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse) {
        // If the backend returns the ApiResponse wrapper, extract the data property automatically
        if (event.body && typeof event.body === 'object' && 'success' in event.body && 'data' in event.body) {
          const body: any = event.body;
          return event.clone({ body: body.data });
        }
      }
      return event;
    })
  );
};
