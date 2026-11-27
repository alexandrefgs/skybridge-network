import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { publicStats } from '../../testing/public';
import { OperationsPage } from './operations.page';

describe('OperationsPage', () => {
  let fixture: ComponentFixture<OperationsPage>;
  let http: HttpTestingController;
  const digits = (id: string) =>
    (fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement).textContent!.replace(/\s/g, '');

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OperationsPage);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('shows every number with flip digits', async () => {
    http.expectOne('/api/public/stats').flush(publicStats);
    await fixture.whenStable();

    expect(digits('total-flights')).toBe('001284');
    expect(digits('online-vatsim')).toBe('012');
    expect(digits('online-ivao')).toBe('005');
    expect(digits('month-flights')).toBe('097');
    expect(digits('aircraft-count')).toBe('058');
    expect(digits('destinations')).toBe('214');
    expect(digits('highlights')).toContain('236pilots');
  });

  it('shows dashes for a network that is down', async () => {
    http.expectOne('/api/public/stats').flush({ ...publicStats, onlineIvao: null });
    await fixture.whenStable();

    expect(digits('online-ivao')).toBe('–––');
  });

  it('explains when the numbers could not load', async () => {
    http.expectOne('/api/public/stats').flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="stats-error"]')).not.toBeNull();
  });
});