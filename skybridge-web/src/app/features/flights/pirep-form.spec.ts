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

    async function pick(id: string, day: string, hhmm: string) {
    query(id).click();
    await fixture.whenStable();
    query(`${id}-day-${day}`).click();
    set(`${id}-typed`, hhmm);
    query(`${id}-done`).click();
    await fixture.whenStable();
  }

  it('starts with the takeoff at the leg start and shows the flight time', async () => {
    expect(query('pirep-departed').textContent).toContain('23 NOV 2026');
    expect(query('pirep-departed').textContent).toContain('14:05');
    expect(fixture.nativeElement.textContent).toContain('SBFL → SBGR');
    expect(query('pirep-window').textContent).toContain('Leg started 14:05Z · takeoff from 13:35Z');

    await pick('pirep-arrived', '2026-11-23', '1625');

    expect(query('pirep-duration').textContent).toContain('2h20min');
  });

  it('files the PIREP in UTC and emits the result', async () => {
    let emitted: PirepFiled | null = null;
    fixture.componentInstance.filed.subscribe(result => (emitted = result));
    await pick('pirep-departed', '2026-11-23', '1410');
    await pick('pirep-arrived', '2026-11-23', '1540');
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
  
  it('fills the fuel in kg from the converter', async () => {
    query('fuel-converter').click();
    await fixture.whenStable();
    set('fuel-converter-amount', '1000');
    await fixture.whenStable();
    query('fuel-converter-use').click();
    await fixture.whenStable();

    expect(query('pirep-fuel').value).toBe('454');
  });
});