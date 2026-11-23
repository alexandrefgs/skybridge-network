import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { signInAs } from './testing/jwt';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  it('renders the brand', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('SkyBridge');
  });

  it('renders the logo icon in the brand link', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const icon: HTMLImageElement = fixture.nativeElement.querySelector('[data-testid="brand"] img');
    expect(icon.getAttribute('src')).toBe('favicon.svg');
  });

  it('shows sign in links and hides the catalog for guests', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Create account');
    expect(fixture.nativeElement.querySelector('[data-testid="nav-airports"]')).toBeNull();
  });

  it('loads the pilot profile when signed in', async () => {
    localStorage.setItem('sb-token', JSON.stringify({ accessToken: 'jwt', expiresAtUtc: new Date(Date.now() + 3600_000).toISOString() }));
    const fixture = TestBed.createComponent(App);
    const http = TestBed.inject(HttpTestingController);
    TestBed.tick();

    http.expectOne('/api/auth/me').flush({
      id: '1', email: 'ana@skybridge.test', firstName: 'Ana', lastName: 'Silva', twoFactorEnabled: false, roles: ['Pilot']
    });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="user-name"]').textContent).toContain('Ana Silva');
    expect(fixture.nativeElement.querySelector('[data-testid="nav-aircraft"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="nav-admin"]')).toBeNull();
  });

  it('shows the admin link only for staff', async () => {
    signInAs(['Staff', 'Pilot']);
    const fixture = TestBed.createComponent(App);
    const http = TestBed.inject(HttpTestingController);
    TestBed.tick();
    http.expectOne('/api/auth/me').flush({
      id: '1', email: 'staff@skybridge.test', firstName: 'Bia', lastName: 'Costa', twoFactorEnabled: true, roles: ['Staff', 'Pilot']
    });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="nav-admin"]')).not.toBeNull();
  });

  it('toggles the theme from the header', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('[data-testid="theme-toggle"]').click();
    await fixture.whenStable();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});