import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { aUser } from '../../testing/users';
import { AuthService } from '../auth/auth.service';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProfileService);
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    auth.currentUser.set(aUser());
  });

  afterEach(() => http.verify());

  it('updates the name and the signed in user', () => {
    service.update({ firstName: 'Ana Clara', lastName: 'Souza' }).subscribe();

    const request = http.expectOne('/api/account/profile');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ firstName: 'Ana Clara', lastName: 'Souza' });
    request.flush(aUser({ firstName: 'Ana Clara', lastName: 'Souza' }));

    expect(auth.currentUser()?.firstName).toBe('Ana Clara');
  });

  it('uploads the avatar as a file field', () => {
    service.uploadAvatar(new Blob(['x'], { type: 'image/webp' })).subscribe();

    const request = http.expectOne('/api/account/avatar');
    expect(request.request.method).toBe('PUT');
    expect((request.request.body as FormData).get('file')).toBeInstanceOf(Blob);
    request.flush(aUser({ avatarUrl: '/api/users/1/avatar?v=1' }));

    expect(auth.currentUser()?.avatarUrl).toBe('/api/users/1/avatar?v=1');
  });

  it('removes the avatar', () => {
    auth.currentUser.set(aUser({ avatarUrl: '/api/users/1/avatar?v=1' }));
    service.removeAvatar().subscribe();

    const request = http.expectOne('/api/account/avatar');
    expect(request.request.method).toBe('DELETE');
    request.flush(aUser());

    expect(auth.currentUser()?.avatarUrl).toBeNull();
  });
});