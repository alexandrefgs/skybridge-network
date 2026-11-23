import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { flnGru, page } from '../../testing/airlines';
import { RouteList } from './route-list';

describe('RouteList', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  async function render() {
    const fixture = TestBed.createComponent(RouteList);
    fixture.componentRef.setInput('airlineId', 2579);
    await fixture.whenStable();
    return fixture;
  }

  it('warns about routes the aircraft cannot fly', async () => {
    const fixture = await render();
    const heavy = { ...flnGru, id: 11, destination: 'SBSP', aircraft: ['A332'], warnings: ['A332 needs 6,500 ft, SBSP longest runway is 6,365 ft'] };

    http.expectOne(r => r.url === '/api/airlines/2579/routes').flush(page([flnGru, heavy]));
    await fixture.whenStable();

    const warning = fixture.nativeElement.querySelector('[data-testid="route-warning-11"]') as HTMLElement;
    expect(warning.getAttribute('title')).toBe('A332 needs 6,500 ft, SBSP longest runway is 6,365 ft');
    expect(fixture.nativeElement.querySelector('[data-testid="route-warning-10"]')).toBeNull();
  });
});