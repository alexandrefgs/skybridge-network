import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveFlight } from '../../core/public/public.models';
import { LiveMap } from '../../shared/map/live-map';
import { emptyLiveMap, liveMap } from '../../testing/live';
import { LivePage } from './live.page';

@Component({ selector: 'sb-live-map', template: '' })
class LiveMapStub {
  readonly flights = input<LiveFlight[]>([]);
  readonly selected = input<string | null>(null);
  readonly selectedChange = output<string>();
}

describe('LivePage', () => {
  let fixture: ComponentFixture<LivePage>;
  let http: HttpTestingController;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
  const rows = () => Array.from(fixture.nativeElement.querySelectorAll('[data-testid="live-row"]')) as HTMLButtonElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LivePage],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
      .overrideComponent(LivePage, { remove: { imports: [LiveMap] }, add: { imports: [LiveMapStub] } })
      .compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LivePage);
  });

  afterEach(() => http.verify());

  async function load(data = liveMap) {
    await fixture.whenStable();
    http.expectOne('/api/public/live').flush(data);
    await fixture.whenStable();
  }

  it('lists the pilots in the air and selects the first one', async () => {
    await load();

    expect(query('live-counters')!.textContent).toContain('3 airborne');
    expect(query('live-counters')!.textContent).toContain('VATSIM 2');
    expect(query('live-counters')!.textContent).toContain('IVAO 1');
    expect(query('live-counters')!.textContent).toContain('14:58:12 UTC');
    expect(rows().length).toBe(3);
    expect(query('selected-callsign')!.textContent).toContain('AZU4512');
    expect(query('selected-altitude')!.textContent).toContain('FL370');
  });

  it('shows the details of the flight picked on the list', async () => {
    await load();

    rows()[1].click();
    await fixture.whenStable();

    expect(query('selected-callsign')!.textContent).toContain('GLO1450');
    expect(query('live-selected')!.textContent).toContain('SBGR');
    expect(query('live-selected')!.textContent).toContain('AIRLINE · GOL');
    expect(query('selected-phase')!.textContent).toContain('En route');
    expect(query('selected-progress')).not.toBeNull();
  });

  it('follows the flight picked on the map', async () => {
    await load();

    fixture.debugElement.query(e => e.name === 'sb-live-map').componentInstance.selectedChange.emit('IVAO-654321');
    await fixture.whenStable();

    expect(query('selected-callsign')!.textContent).toContain('SKB2190');
    expect(query('live-selected')!.textContent).toContain('MEDEVAC');
  });

  it('filters by network', async () => {
    await load();

    query('filter-IVAO')!.click();
    await fixture.whenStable();

    expect(rows().map(r => r.textContent)).toEqual([expect.stringContaining('SKB2190')]);
    expect(query('selected-callsign')!.textContent).toContain('SKB2190');
  });

  it('warns when a network feed is offline and when nobody is flying', async () => {
    await load({ ...emptyLiveMap, ivaoAvailable: false });

    expect(query('offline-IVAO')!.textContent).toContain('IVAO feed offline');
    expect(query('live-empty')).not.toBeNull();
    expect(query('live-selected')).toBeNull();
  });
});