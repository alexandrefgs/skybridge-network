import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let http: HttpTestingController;

  const fillAndSubmit = async (element: HTMLElement, email: string, password: string) => {
    const emailInput = element.querySelector<HTMLInputElement>('#email')!;
    const passwordInput = element.querySelector<HTMLInputElement>('#password')!;
    emailInput.value = email;
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = password;
    passwordInput.dispatchEvent(new Event('input'));
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  it('asks for the second factor when required', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();

    await fillAndSubmit(fixture.nativeElement, 'ana@skybridge.test', 'Sky!Bridge2026');
    http.expectOne('/api/auth/login').flush({ requiresTwoFactor: true, accessToken: null, expiresAtUtc: null, twoFactorToken: 'tf' });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="two-factor-form"]')).not.toBeNull();
  });

  it('shows the server error on invalid credentials', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();

    await fillAndSubmit(fixture.nativeElement, 'ana@skybridge.test', 'wrong');
    http.expectOne('/api/auth/login').flush({ title: 'Invalid email or password.' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="form-error"]').textContent).toContain('Invalid email or password.');
  });

  it('goes home after a successful login', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();

    await fillAndSubmit(fixture.nativeElement, 'ana@skybridge.test', 'Sky!Bridge2026');
    http.expectOne('/api/auth/login').flush({
      requiresTwoFactor: false, accessToken: 'jwt', expiresAtUtc: new Date(Date.now() + 3600_000).toISOString(), twoFactorToken: null
    });

    expect(navigate).toHaveBeenCalledWith('/');
  });
});