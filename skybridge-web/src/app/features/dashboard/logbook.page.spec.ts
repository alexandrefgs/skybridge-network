import { Component, input } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouteNetwork } from '../../core/airlines/airline.models';
import { Logbook } from '../../core/pireps/pirep.models';
import { RouteMap } from '../../shared/map/route-map';
import { emptyLogbook, monthLogbook } from '../../testing/dashboard';
import { LogbookPage } from './logbook.page';

@Component({ selector: 'sb-route-map', template: '' })
class RouteMapStub {
  readonly network = input<RouteNetwork | null>(null);
  readonly showAll = input(false);
}

describe('LogbookPage', () => {
  let fixture: ComponentFixture<LogbookPage>;
  let http: HttpTestingController;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogbookPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
      .overrideComponent(LogbookPage, { remove: { imports: [RouteMap] }, add: { imports: [RouteMapStub] } })
      .compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LogbookPage);
  });

  afterEach(() => http.verify());

  async function flush(logbook: Logbook, period = '30d', page = '1') {
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/pireps/logbook' && r.params.get('period') === period && r.params.get('page') === page).flush(logbook);
    await fixture.whenStable();
  }

  it('shows the last 30 days with the summary, the map and the flights', async () => {
    await flush(monthLogbook);

    expect(query('period-30d')!.getAttribute('aria-selected')).toBe('true');
    expect(query('stat-flights')!.textContent).toContain('2');
    expect(query('stat-time')!.textContent).toContain('3h05min');
    expect(query('stat-earned')!.textContent).toContain('$4,500');
    expect(query('stat-landing')!.textContent).toContain('-185 fpm');
    const map = fixture.debugElement.query(By.directive(RouteMapStub)).componentInstance as RouteMapStub;
    expect(map.network()!.links).toEqual([[0, 1]]);
    expect(map.showAll()).toBe(true);
    expect(query('flights')!.querySelectorAll('tbody tr').length).toBe(3);
    expect(query('flight-52')!.textContent).toContain('SBGR → SBFL');
    expect(query('flight-52')!.textContent).toContain('leg 2/2');
    expect(query('flight-53')!.textContent).toContain('Pending');
  });

  it('changes the period and goes back to the first page', async () => {
    await flush({ ...monthLogbook, flights: { ...monthLogbook.flights, totalCount: 45 } });

    query('next-page')!.click();
    await flush(monthLogbook, '30d', '2');
    query('period-1y')!.click();
    await flush({ ...monthLogbook, period: '1y' }, '1y', '1');

    expect(query('period-1y')!.getAttribute('aria-selected')).toBe('true');
  });

  it('explains an empty period without drawing the map', async () => {
    await flush(emptyLogbook);

    expect(query('no-flights')!.textContent).toContain('No flights in this period.');
    expect(fixture.debugElement.query(By.directive(RouteMapStub))).toBeNull();
    expect(query('stat-landing')!.textContent).toContain('—');
  });

  it('shows the API error', async () => {
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/pireps/logbook').flush(
      { errors: { Period: ['Use 30d, 1y or all.'] } },
      { status: 400, statusText: 'Bad Request' }
    );
    await fixture.whenStable();

    expect(query('logbook-error')!.textContent).toContain('Use 30d, 1y or all.');
  });
});