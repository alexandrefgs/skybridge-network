import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { gol, page } from '../../testing/airlines';
import { AirlinesPage } from './airlines.page';

describe('AirlinesPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirlinesPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  const render = async () => {
    const fixture = TestBed.createComponent(AirlinesPage);
    await fixture.whenStable();
    const request = http.expectOne(r => r.url === '/api/airlines');
    expect(request.request.params.get('active')).toBe('true');
    request.flush(page([gol, { ...gol, id: 1, name: 'Old Air', icaoCode: 'OLD', isActive: false, routeCount: 0 }], 1253));
    await fixture.whenStable();
    return fixture;
  };

  it('lists active airlines with links, routes and the data credits', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('[data-testid="count"]')!.textContent).toContain('1,253');
    expect(element.querySelector('[data-testid="airline-2579"]')!.getAttribute('href')).toBe('/airlines/2579');
    expect(element.querySelector('[data-testid="airlines"]')!.textContent).toContain('Retro');
    expect(element.querySelector('[data-testid="data-credits"]')!.textContent).toContain('ODbL');
    expect(element.querySelector('[data-testid="next"]')).not.toBeNull();
  });

  it('shows every airline when active only is unchecked', async () => {
    const fixture = await render();
    const checkbox = fixture.nativeElement.querySelector('[data-testid="active-only"]') as HTMLInputElement;

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    const request = http.expectOne(r => r.url === '/api/airlines');
    expect(request.request.params.has('active')).toBe(false);
    request.flush(page([gol], 6160));
  });
});