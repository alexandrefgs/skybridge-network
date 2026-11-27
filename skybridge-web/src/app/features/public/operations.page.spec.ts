import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { publicStats } from '../../testing/public';
import { OperationsPage } from './operations.page';

describe('OperationsPage', () => {
  let fixture: ComponentFixture<OperationsPage>;
  let http: HttpTestingController;
  const text = (id: string) => (fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement).textContent!.trim();

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OperationsPage);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('shows every number, the radar and the checklist', async () => {
    http.expectOne('/api/public/stats').flush(publicStats);
    await fixture.whenStable();

    expect(text('total-flights')).toBe('1,284');
    expect(text('online-vatsim')).toBe('12');
    expect(text('online-ivao')).toBe('5');
    expect(text('month-flights')).toBe('97');
    expect(text('aircraft-count')).toBe('58');
    expect(text('destinations')).toBe('214');
    expect(text('checklist')).toContain('236 pilots in the crew');
    const traffic = Array.from(fixture.nativeElement.querySelectorAll('[data-testid="traffic"]')) as SVGElement[];
    expect(traffic.map(t => t.getAttribute('class'))).toEqual(['blip traffic-red', 'blip traffic-white', 'blip traffic-white']);
    expect(text('live')).not.toContain('--:--');
  });

  it('shows a dash for a network that is down', async () => {
    http.expectOne('/api/public/stats').flush({ ...publicStats, onlineIvao: null });
    await fixture.whenStable();

    expect(text('online-ivao')).toBe('—');
  });

  it('explains when the numbers could not load', async () => {
    http.expectOne('/api/public/stats').flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="stats-error"]')).not.toBeNull();
  });
});