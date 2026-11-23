import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PirepFiled } from '../../core/pireps/pirep.models';
import { acceptedMedevac, filedPirep, pilotAtFlorianopolis } from '../../testing/freelance';
import { PirepForm } from './pirep-form';

describe('PirepForm', () => {
  let fixture: ComponentFixture<PirepForm>;
  let http: HttpTestingController;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLInputElement;
  const set = (id: string, value: string) => {
    const input = query(id);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PirepForm);
    fixture.componentRef.setInput('booking', { ...acceptedMedevac, legInProgress: true, legStartedAtUtc: '2026-11-23T14:05:00Z' });
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('starts with the takeoff at the leg start and shows the flight time', async () => {
    expect(query('pirep-departed').value).toBe('2026-11-23T14:05');
    expect(fixture.nativeElement.textContent).toContain('SBFL → SBGR');

    set('pirep-arrived', '2026-11-23T16:25');
    await fixture.whenStable();

    expect(query('pirep-duration').textContent).toContain('2h 20m');
  });

  it('files the PIREP in UTC and emits the result', async () => {
    let emitted: PirepFiled | null = null;
    fixture.componentInstance.filed.subscribe(result => (emitted = result));
    set('pirep-departed', '2026-11-23T14:10');
    set('pirep-arrived', '2026-11-23T15:40');
    set('pirep-fuel', '180');
    set('pirep-landing-rate', '160');
    set('pirep-remarks', '  Light chop on descent ');

    query('pirep-form').dispatchEvent(new Event('submit'));
    const request = http.expectOne('/api/pireps');
    expect(request.request.body).toEqual({
      departedAtUtc: '2026-11-23T14:10:00.000Z',
      arrivedAtUtc: '2026-11-23T15:40:00.000Z',
      fuelUsedKg: 180,
      landingRateFpm: 160,
      remarks: 'Light chop on descent'
    });
    const result: PirepFiled = { pirep: filedPirep, booking: null, rewardPaid: 4500, pilot: pilotAtFlorianopolis };
    request.flush(result);

    expect(emitted).toEqual(result);
  });

  it('shows the server error', async () => {
    query('pirep-form').dispatchEvent(new Event('submit'));
    http.expectOne('/api/pireps').flush(
      { errors: { ArrivedAtUtc: ['Landing must be after takeoff.'] } },
      { status: 400, statusText: 'Bad Request' }
    );
    await fixture.whenStable();

    expect(query('pirep-error').textContent).toContain('Landing must be after takeoff.');
  });
});