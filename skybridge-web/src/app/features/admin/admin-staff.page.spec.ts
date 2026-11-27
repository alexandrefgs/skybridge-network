import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { staffCandidates, staffMembers } from '../../testing/staff';
import { AdminStaffPage } from './admin-staff.page';

describe('AdminStaffPage', () => {
  let fixture: ComponentFixture<AdminStaffPage>;
  let http: HttpTestingController;
  const query = <T extends HTMLElement>(id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as T | null;

  async function type(id: string, value: string) {
    const input = query<HTMLInputElement>(id)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function click(id: string) {
    query(id)!.click();
    await fixture.whenStable();
  }

  async function submit(id: string) {
    query<HTMLFormElement>(id)!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminStaffPage);
    await fixture.whenStable();
    http.expectOne('/api/admin/staff').flush(staffMembers);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('lists the staff with their department code and panel access', () => {
    expect(query('member-u-1')!.textContent).toContain('EXE');
    expect(query('member-u-1')!.textContent).toContain('Chief Executive Officer');
    expect(query('member-u-3')!.textContent).toContain('Yes');
  });

  it('finds a pilot and adds them to the staff', async () => {
    await type('search', 'ana');
    await submit('search-form');
    http.expectOne(r => r.url === '/api/admin/staff/candidates' && r.params.get('search') === 'ana').flush(staffCandidates);
    await fixture.whenStable();

    expect(query('candidates')!.textContent).toContain('STAFF');
    await click('candidate-u-4');
    await type('position', '  Events Manager ');
    const department = query<HTMLSelectElement>('department')!;
    department.value = 'Events';
    department.dispatchEvent(new Event('change'));
    await type('order', '3');
    await click('panel-access');
    expect(query('save')!.textContent).toContain('Add to staff');
    await submit('member-form');

    const save = http.expectOne('/api/admin/staff/u-4');
    expect(save.request.body).toEqual({ position: 'Events Manager', department: 'Events', sortOrder: 3, panelAccess: true });
    save.flush({ userId: 'u-4', name: 'Ana Silva', email: 'ana@skybridge.test', position: 'Events Manager', department: 'Events', sortOrder: 3, panelAccess: true });
    await fixture.whenStable();

    expect(query('member-u-4')!.textContent).toContain('EVT');
    expect(query('member-form')).toBeNull();
    const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')).map(row => (row as HTMLElement).dataset['testid']);
    expect(rows).toEqual(['member-u-1', 'member-u-3', 'member-u-4']);
  });

  it('edits a member, keeping the form filled with their data', async () => {
    await click('edit-u-3');

    expect(query<HTMLInputElement>('position')!.value).toBe('PIREP Reviewer');
    expect(query('save')!.textContent).toContain('Save changes');
    await type('position', 'Head of Safety');
    await submit('member-form');

    http.expectOne('/api/admin/staff/u-3').flush({ ...staffMembers[1], position: 'Head of Safety' });
    await fixture.whenStable();
    expect(query('member-u-3')!.textContent).toContain('Head of Safety');
  });

  it('shows a picked existing member with their current data', async () => {
    await type('search', 'alex');
    await submit('search-form');
    http.expectOne(r => r.url === '/api/admin/staff/candidates').flush(staffCandidates);
    await fixture.whenStable();
    await click('candidate-u-1');

    expect(query<HTMLInputElement>('position')!.value).toBe('Chief Executive Officer');
  });

  it('asks before removing a member', async () => {
    await click('remove-u-3');
    await click('confirm-u-3');

    const request = http.expectOne('/api/admin/staff/u-3');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    await fixture.whenStable();
    expect(query('member-u-3')).toBeNull();
  });

  it('shows the API error when saving fails', async () => {
    await click('edit-u-1');
    await submit('member-form');

    http.expectOne('/api/admin/staff/u-1').flush(
      { title: 'One or more validation errors occurred.', errors: { Position: ['The position has 2 to 80 characters.'] } },
      { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();

    expect(query('staff-error')!.textContent).toContain('The position has 2 to 80 characters.');
    expect(query('member-form')).not.toBeNull();
  });
});