import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { linkedPilot, pilotAtFlorianopolis } from '../../testing/freelance';
import { SimBriefSettings } from './simbrief-settings';

describe('SimBriefSettings', () => {
  let fixture: ComponentFixture<SimBriefSettings>;
  let http: HttpTestingController;
  const byId = <T extends HTMLElement>(id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as T | null;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SimBriefSettings);
  });

  afterEach(() => http.verify());

  async function load(pilot = pilotAtFlorianopolis) {
    await fixture.whenStable();
    http.expectOne('/api/pilot').flush(pilot);
    await fixture.whenStable();
  }

  function type(value: string) {
    const input = byId<HTMLInputElement>('simbrief-input')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('saves the pilot ID', async () => {
    await load();
    expect(byId('remove-simbrief')).toBeNull();

    type(' 12345 ');
    byId('simbrief-form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne('/api/pilot/simbrief');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ pilotId: '12345' });
    request.flush(linkedPilot);
    await fixture.whenStable();

    expect(byId('simbrief-saved')!.textContent).toContain('saved');
    expect(byId('remove-simbrief')).not.toBeNull();
  });

  it('shows the saved ID and removes it', async () => {
    await load(linkedPilot);
    expect(byId<HTMLInputElement>('simbrief-input')!.value).toBe('123456');

    byId('remove-simbrief')!.click();
    const request = http.expectOne('/api/pilot/simbrief');
    expect(request.request.body).toEqual({ pilotId: null });
    request.flush(pilotAtFlorianopolis);
    await fixture.whenStable();

    expect(byId<HTMLInputElement>('simbrief-input')!.value).toBe('');
    expect(byId('simbrief-saved')!.textContent).toContain('removed');
  });

  it('does not send an invalid ID', async () => {
    await load();

    type('abc');
    byId('simbrief-form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    http.expectNone('/api/pilot/simbrief');
    expect(byId<HTMLButtonElement>('save-simbrief')!.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('1 to 7 digits');
  });

  it('shows the API error', async () => {
    await load();

    type('42');
    byId('simbrief-form')!.dispatchEvent(new Event('submit'));
    http.expectOne('/api/pilot/simbrief').flush(
      { errors: { PilotId: ['The SimBrief Pilot ID has 1 to 7 digits.'] } },
      { status: 400, statusText: 'Bad Request' }
    );
    await fixture.whenStable();

    expect(byId('simbrief-error')!.textContent).toContain('1 to 7 digits');
  });
});