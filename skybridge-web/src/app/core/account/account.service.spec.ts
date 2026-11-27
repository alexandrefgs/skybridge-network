import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { activeAccount } from '../../testing/account';
import { signInAs } from '../../testing/jwt';
import { AuthService } from '../auth/auth.service';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    signInAs(['Pilot']);
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AccountService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('keeps the latest account state', () => {
    service.load().subscribe();
    http.expectOne('/api/account/status').flush(activeAccount);
    expect(service.state()?.status).toBe('Active');

    service.reactivate().subscribe();
    http.expectOne({ method: 'POST', url: '/api/account/reactivate' }).flush({ ...activeAccount, status: 'Reactivating' });
    expect(service.state()?.status).toBe('Reactivating');

    service.acceptRegulations(2).subscribe();
    const accept = http.expectOne('/api/account/regulations/accept');
    expect(accept.request.body).toEqual({ version: 2 });
    accept.flush(activeAccount);
  });

  it('deletes the account with the password and signs out', () => {
    service.deleteAccount('secret').subscribe();

    const request = http.expectOne({ method: 'DELETE', url: '/api/account' });
    expect(request.request.body).toEqual({ password: 'secret' });
    request.flush(null);

    expect(TestBed.inject(AuthService).isSignedIn()).toBe(false);
    expect(service.state()).toBeNull();
  });

  it('reads the public regulations', () => {
    service.regulations().subscribe();
    http.expectOne('/api/public/regulations').flush({ currentVersion: 1, history: [] });
  });
});