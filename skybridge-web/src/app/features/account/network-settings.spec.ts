import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { pilotAtFlorianopolis } from '../../testing/freelance';
import { NetworkSettings } from './network-settings';

describe('NetworkSettings', () => {
  let fixture: ComponentFixture<NetworkSettings>;
  let http: HttpTestingController;
  const byId = <T extends HTMLElement>(id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as T | null;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NetworkSettings);
    await fixture.whenStable();
    http.expectOne('/api/pilot').flush({ ...pilotAtFlorianopolis, vatsimId: 1234567 });
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  function type(id: string, value: string) {
    const input = byId<HTMLInputElement>(id)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('shows and saves the ids, clearing the empty one', async () => {
    expect(byId<HTMLInputElement>('vatsim-input')!.value).toBe('1234567');

    type('vatsim-input', '');
    type('ivao-input', ' 654321 ');
    byId('network-form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne('/api/pilot/networks');
    expect(request.request.body).toEqual({ vatsimId: null, ivaoId: 654321 });
    request.flush({ ...pilotAtFlorianopolis, ivaoId: 654321 });
    await fixture.whenStable();

    expect(byId('network-saved')).not.toBeNull();
  });

  it('does not send an invalid id', async () => {
    type('vatsim-input', 'abc');
    byId('network-form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    http.expectNone('/api/pilot/networks');
    expect(byId<HTMLButtonElement>('save-networks')!.disabled).toBe(true);
  });
});