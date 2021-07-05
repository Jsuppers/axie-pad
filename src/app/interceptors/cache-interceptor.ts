import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpResponse, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheMapService } from '../services/cache-map.service';

const CACHABLE_URLS = ['lunacia.skymavis.com', 'api.coingecko.com'];

@Injectable()
export class CachingInterceptor implements HttpInterceptor {
  constructor(private cache: CacheMapService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRequestCachable(req)) {
      return next.handle(req);
    }
    const cachedResponse = this.cache.get(req);
    if (cachedResponse !== null) {
      return of(cachedResponse);
    }
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cache.put(req, event);
        }
      })
    );
  }

  private isRequestCachable(req: HttpRequest<any>): boolean {
    for (const url of CACHABLE_URLS) {
      if (req.url.includes(url)) {
        return true;
      }
    }
    return false;
  }
}
