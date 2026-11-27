import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { staffMembers } from '../../testing/staff';
import { StaffService } from './staff.service';

describe('StaffService', () => {
  let service: StaffService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(StaffService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the public staff and the admin list', () => {
    service.publicList().subscribe();
    service.list().subscribe();

    http.expectOne('/api/public/staff').flush([]);
    http.expectOne('/api/admin/staff').flush(staffMembers);
  });

  it('searches candidates, saves and removes members', () => {
    service.candidates('ana').subscribe();
    service.save('u-1', { position: 'CEO', department: 'Executive', sortOrder: 1, panelAccess: true }).subscribe();
    service.remove('u-1').subscribe();

    const search = http.expectOne(r => r.url === '/api/admin/staff/candidates');
    expect(search.request.params.get('search')).toBe('ana');
    search.flush([]);
    const save = http.expectOne({ method: 'PUT', url: '/api/admin/staff/u-1' });
    expect(save.request.body.department).toBe('Executive');
    save.flush(staffMembers[0]);
    const remove = http.expectOne(r => r.method === 'DELETE');
    expect(remove.request.url).toBe('/api/admin/staff/u-1');
    remove.flush(null);
  });
});