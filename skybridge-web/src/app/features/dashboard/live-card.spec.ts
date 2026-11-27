import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Pilot } from '../../core/pilot/pilot.models';
import { LiveFlight } from '../../core/public/public.models';
import { LiveMap } from '../../shared/map/live-map';
import { pilotAtFlorianopolis } from '../../testing/freelance';
import { emptyLiveMap, liveGol, liveMap } from '../../testing/live';
import { LiveCard } from './live-card';

@Component({ selector: 'sb-live-map', template: '' })
class LiveMapStub {
  readonly flights = input<LiveFlight[]>([]);
  readonly selected = input<string | null>(null);
  readonly compact = input(false);
}

describe('LiveCard', () => {
  let fixture: ComponentFixture<LiveCard>;
  let http: HttpTestingController;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
  const map = () => fixture.debugElement.query(e => e.name === 'sb-live-map')?.componentInstance as LiveMapStub | undefined;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveCard],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
      .overrideComponent(LiveCard, { remove: { imports: [LiveMap] }, add: { imports: [LiveMapStub] } })
      .compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LiveCard);
  });

  afterEach(() => http.verify());

  async function load(pilot: Pilot | null, data = liveMap) {
    fixture.componentRef.setInput('pilot', pilot);
    await fixture.whenStable();
    http.expectOne('/api/public/live').flush(data);
    await fixture.whenStable();
  }

  it('shows who is flying and links to the live map', async () => {
    await load({ ...pilotAtFlorianopolis, vatsimId: null, ivaoId: null });

    expect(query('live-count')!.textContent).toContain('3 pilots');
    expect(fixture.nativeElement.querySelectorAll('[data-testid="live-card-row"]').length).toBe(3);
    expect(query('open-live')!.getAttribute('href')).toBe('/live');
    expect(query('live-you')!.textContent).toContain('Link your VATSIM CID or IVAO VID');
    expect(map()!.selected()).toBe('VATSIM-7654321');
  });

  it('tells the pilot when their own flight is tracked and highlights it', async () => {
    await load({ ...pilotAtFlorianopolis, vatsimId: liveGol.networkId, ivaoId: null });

    expect(query('live-you')!.textContent).toContain('GLO1450 is being tracked on VATSIM');
    expect(map()!.selected()).toBe('VATSIM-1234567');
  });

  it('hides the map when nobody is flying', async () => {
    await load({ ...pilotAtFlorianopolis, vatsimId: 1234567, ivaoId: null }, emptyLiveMap);

    expect(query('live-card-empty')).not.toBeNull();
    expect(map()).toBeUndefined();
    expect(query('live-you')!.textContent).toContain('Connect to VATSIM or IVAO');
  });
});