import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientConfigService } from '../../core/config/client-config.service';
import { publicStaff } from '../../testing/staff';
import { StaffPage } from './staff.page';

describe('StaffPage', () => {
  let fixture: ComponentFixture<StaffPage>;
  let http: HttpTestingController;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(ClientConfigService).discordUrl.set('https://discord.gg/skybridge');
    fixture = TestBed.createComponent(StaffPage);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('groups the crew by department with their flights and hours', async () => {
    http.expectOne('/api/public/staff').flush(publicStaff);
    await fixture.whenStable();

    expect(query('department-Executive')!.textContent).toContain('Alexandre Fagundes');
    expect(query('department-Operations')!.textContent).toContain('Director of Operations');
    expect(query('department-Training')).toBeNull();
    expect(query('staff-u-1')!.querySelector('[data-testid="flights"]')!.textContent).toContain('128');
    expect(query('staff-u-1')!.querySelector('[data-testid="hours"]')!.textContent).toContain('155.5');
    expect(query('staff-u-1')!.querySelector('[data-testid="initials"]')!.textContent).toContain('AF');
    expect(query('staff-u-2')!.querySelector('img')!.getAttribute('src')).toBe('/api/users/u-2/avatar?v=1');
    expect(query('staff-u-3')!.textContent).toContain('SKB-003');
    expect(query('staff-discord')!.getAttribute('href')).toBe('https://discord.gg/skybridge');
  });

  it('says when there is no staff yet', async () => {
    http.expectOne('/api/public/staff').flush([]);
    await fixture.whenStable();

    expect(query('staff-empty')).not.toBeNull();
  });

  it('explains when the staff could not load', async () => {
    http.expectOne('/api/public/staff').flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(query('staff-error')).not.toBeNull();
    expect(query('staff-empty')).toBeNull();
  });
});