import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AccountState } from '../../core/account/account.models';
import { activeAccount, regulationsV1, regulationsV2 } from '../../testing/account';
import { signInAs } from '../../testing/jwt';
import { AccountGate } from './account-gate';

describe('AccountGate', () => {
  let fixture: ComponentFixture<AccountGate>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;
  const query = <T extends HTMLElement>(id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as T | null;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  async function open(state: AccountState) {
    signInAs(['Pilot']);
    fixture = TestBed.createComponent(AccountGate);
    await fixture.whenStable();
    http.expectOne('/api/account/status').flush(state);
    await fixture.whenStable();
  }

  it('does not check anything for guests', async () => {
    fixture = TestBed.createComponent(AccountGate);
    await fixture.whenStable();

    http.expectNone('/api/account/status');
  });

  it('shows nothing when the pilot is active and up to date', async () => {
    await open(activeAccount);

    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('asks a new pilot to accept the regulations', async () => {
    await open({ ...activeAccount, acceptedRegulationsVersion: null, pendingRegulations: [regulationsV1] });

    expect(query('gate-regulations')!.textContent).toContain('Welcome aboard');
    expect(query<HTMLButtonElement>('accept')!.disabled).toBe(true);
    const agree = query<HTMLInputElement>('agree')!;
    agree.checked = true;
    agree.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    query('accept')!.click();

    const request = http.expectOne('/api/account/regulations/accept');
    expect(request.request.body).toEqual({ version: 1 });
    request.flush(activeAccount);
    await fixture.whenStable();
    expect(query('gate-regulations')).toBeNull();
  });

  it('lists what changed and lets the pilot decline by deleting the account', async () => {
    await open({ ...activeAccount, currentRegulationsVersion: 2, pendingRegulations: [regulationsV2] });

    expect(query('gate-regulations')!.textContent).toContain('Our regulations changed');
    expect(query('pending-changes')!.textContent).toContain('PIREPs must be filed within 24 hours.');
    query('decline')!.click();
    await fixture.whenStable();

    expect(query('delete-warning')!.textContent).toContain('Declining them deletes your account.');
    query('delete-cancel')!.click();
    await fixture.whenStable();
    expect(query('accept')).not.toBeNull();
  });

  it('offers a free reactivation to an inactive pilot', async () => {
    await open({ ...activeAccount, status: 'Inactive' });

    expect(query('gate-inactive')!.textContent).toContain('60 days');
    query('reactivate')!.click();
    http.expectOne({ method: 'POST', url: '/api/account/reactivate' }).flush({
      ...activeAccount, status: 'Reactivating', reactivationReadyAtUtc: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    });
    await fixture.whenStable();

    expect(query('gate-reactivating')).not.toBeNull();
    expect(['10:00', '09:59']).toContain(query('countdown')!.textContent!.trim());
    expect(query('percent')!.textContent).toContain('0.0%');
    expect(query('gate-reactivating')!.textContent).toContain('SEQ 1/5');
  });

  it('takes the pilot to the cockpit when the account is ready', async () => {
    await open({ ...activeAccount, status: 'Reactivating', reactivationReadyAtUtc: new Date(Date.now() - 1000).toISOString() });

    http.expectOne('/api/account/status').flush(activeAccount);
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith('/cockpit');
    expect(query('gate-reactivating')).toBeNull();
  });
});