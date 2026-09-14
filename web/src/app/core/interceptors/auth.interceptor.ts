import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, from, filter, take } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../services/auth.service';

let renovandoToken = false;
const tokenRenovado$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.obterToken();

  const requisicaoComToken = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  const ehRotaDeAuth = req.url.includes('/Auth/login') || req.url.includes('/Auth/registrar') || req.url.includes('/Auth/refresh');

  return next(requisicaoComToken).pipe(
    catchError((erro: HttpErrorResponse) => {
      if (erro.status !== 401 || ehRotaDeAuth || !token) {
        return throwError(() => erro);
      }

      if (renovandoToken) {
        return tokenRenovado$.pipe(
          filter(novoToken => novoToken !== null),
          take(1),
          switchMap(novoToken => {
            const requisicaoRepetida = req.clone({ setHeaders: { Authorization: `Bearer ${novoToken}` } });
            return next(requisicaoRepetida);
          })
        );
      }

      renovandoToken = true;
      tokenRenovado$.next(null);

      return from(auth.refresh()).pipe(
        switchMap(resposta => {
          renovandoToken = false;
          if (!resposta) {
            return throwError(() => erro);
          }
          tokenRenovado$.next(resposta.token);
          const requisicaoRepetida = req.clone({ setHeaders: { Authorization: `Bearer ${resposta.token}` } });
          return next(requisicaoRepetida);
        }),
        catchError(erroRefresh => {
          renovandoToken = false;
          return throwError(() => erroRefresh);
        })
      );
    })
  );
};