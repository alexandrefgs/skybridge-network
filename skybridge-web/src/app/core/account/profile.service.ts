import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { CurrentUser, ProfileInput } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  update(input: ProfileInput): Observable<CurrentUser> {
    return this.http.put<CurrentUser>('/api/account/profile', input).pipe(tap(user => this.auth.currentUser.set(user)));
  }

  uploadAvatar(image: Blob): Observable<CurrentUser> {
    const form = new FormData();
    form.append('file', image, 'avatar');
    return this.http.put<CurrentUser>('/api/account/avatar', form).pipe(tap(user => this.auth.currentUser.set(user)));
  }

  removeAvatar(): Observable<CurrentUser> {
    return this.http.delete<CurrentUser>('/api/account/avatar').pipe(tap(user => this.auth.currentUser.set(user)));
  }
}