import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { publicFlights, publicStats } from '../../testing/public';
import { signInAs } from '../../testing/jwt';
import { LandingPage } from './landing.page';

describe('LandingPage', () => {
  let fixture: ComponentFixture<LandingPage>;
  let http: HttpTestingController;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function load(stats = publicStats, flights = publicFlights) {
    fixture = TestBed.createComponent(LandingPage);
    await fixture.whenStable();
    http.expectOne('/api/public/stats').flush(stats);
    http.expectOne(r => r.url === '/api/public/flights').flush(flights);
    await fixture.whenStable();
  }

  it('invites visitors with the numbers, the four ways to fly and the last flights', async () => {
    await load();

    expect(query('hero-register')!.getAttribute('href')).toBe('/register');
    expect(query('hero-numbers')!.textContent!.replace(/\s/g, '')).toContain('097');
    expect(query('hero-numbers')!.textContent!.replace(/\s/g, '')).toContain('017');
    expect(query('ways')!.querySelectorAll('a').length).toBe(4);
    expect(query('public-flight-98')!.textContent).toContain('GLO1042');
  });

  it('sends signed in pilots to the cockpit', async () => {
    signInAs(['Pilot']);
    await load();

    expect(query('hero-cockpit')!.getAttribute('href')).toBe('/cockpit');
  });

  it('shows dashes when the networks are down and waits for the first flights', async () => {
    await load({ ...publicStats, onlineVatsim: null, onlineIvao: null }, []);

    expect(query('hero-numbers')!.textContent).toContain('–');
    expect(query('no-public-flights')).not.toBeNull();
  });
});