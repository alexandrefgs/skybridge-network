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

  it('invites visitors with the numbers, the arrivals board and the four ways to fly', async () => {
    await load();

    expect(query('hero-register')!.getAttribute('href')).toBe('/register');
    expect(query('cta-register')!.getAttribute('href')).toBe('/register');
    expect(query('online-now')!.textContent).toContain('17');
    expect(query('hero-numbers')!.textContent).toContain('1,284');
    expect(query('hero-numbers')!.textContent).toContain('97');
    expect(query('hero-numbers')!.textContent).toContain('214');
    expect(query('hero-numbers')!.textContent).toContain('236');
    expect(query('ways')!.querySelectorAll('a').length).toBe(4);
    expect(query('board-flight-98')!.textContent).toContain('GLO1042');
    expect(query('board-flight-98')!.textContent).toContain('SBFL');
    expect(query('board-flight-98')!.textContent).toContain('LANDED');
    expect(query('board-flight-97')!.textContent).toContain('MEDEVAC');
    expect(query('board')!.querySelectorAll('li').length).toBe(5);
  });

  it('labels a freelance flight whose job no longer exists', async () => {
    await load(publicStats, [{ ...publicFlights[1], mission: 'Freelance' }]);

    expect(query('board-flight-97')!.textContent).toContain('FREELANCE');
  });

  it('sends signed in pilots to the cockpit', async () => {
    signInAs(['Pilot']);
    await load();

    expect(query('hero-cockpit')!.getAttribute('href')).toBe('/cockpit');
  });

  it('falls back when the networks are down and waits for the first flights', async () => {
    await load({ ...publicStats, onlineVatsim: null, onlineIvao: null }, []);

    expect(query('online-now')!.textContent).toContain('Flying live on VATSIM');
    expect(query('board')!.querySelectorAll('li').length).toBe(5);
    expect(query('no-public-flights')).not.toBeNull();
  });
});