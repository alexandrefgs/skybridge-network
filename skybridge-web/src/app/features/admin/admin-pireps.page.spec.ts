import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { page } from '../../testing/airlines';
import { filedPirep } from '../../testing/freelance';
import { AdminPirepsPage } from './admin-pireps.page';

describe('AdminPirepsPage', () => {
  let fixture: ComponentFixture<AdminPirepsPage>;
  let http: HttpTestingController;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
  const pending = { ...filedPirep, id: 60, status: 'Pending' as const, flag: '30 min is too short for 278 nm in a C172 (about 135 min expected).', flightMinutes: 30 };

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminPirepsPage);
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/admin/pireps' && r.params.get('status') === 'Pending').flush(page([pending]));
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('lists pending PIREPs with the reason', () => {
    expect(query('pirep-60')!.textContent).toContain('SBFL → SBGR');
    expect(query('pirep-60')!.textContent).toContain('Alexandre Fagundes');
    expect(query('pirep-60')!.textContent).toContain('30min');
    expect(query('flag-60')!.textContent).toContain('too short');
  });

  it('approves with an optional note and reloads', async () => {
    query('approve-60')!.click();
    const request = http.expectOne('/api/admin/pireps/60/approve');
    expect(request.request.body).toEqual({ note: null });
    request.flush({ ...pending, status: 'Accepted' });
    await fixture.whenStable();

    http.expectOne(r => r.url === '/api/admin/pireps').flush(page([]));
    await fixture.whenStable();
    expect(query('notice')!.textContent).toContain('PIREP #60 approved.');
    expect(query('no-pireps')!.textContent).toContain('Nothing to review.');
  });

  it('needs a note to reject', async () => {
    query('reject-60')!.click();
    await fixture.whenStable();
    expect(query('error')!.textContent).toContain('Write a note');

    const note = query('note-60') as HTMLInputElement;
    note.value = 'Slew mode used.';
    note.dispatchEvent(new Event('input'));
    query('reject-60')!.click();

    expect(http.expectOne('/api/admin/pireps/60/reject').request.body).toEqual({ note: 'Slew mode used.' });
  });

  it('switches the filter', async () => {
    query('filter-all')!.click();
    await fixture.whenStable();

    http.expectOne(r => r.url === '/api/admin/pireps' && !r.params.has('status')).flush(page([filedPirep]));
    await fixture.whenStable();
    expect(query('status-51')!.textContent).toContain('Accepted');
  });
});