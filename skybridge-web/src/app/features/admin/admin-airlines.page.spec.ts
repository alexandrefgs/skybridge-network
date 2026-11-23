import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { gol, golDetail, page } from '../../testing/airlines';
import { AdminAirlinesPage } from './admin-airlines.page';

describe('AdminAirlinesPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAirlinesPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  const render = async () => {
    const fixture = TestBed.createComponent(AdminAirlinesPage);
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/airlines').flush(page([gol]));
    await fixture.whenStable();
    return fixture;
  };

  const type = (element: HTMLElement, id: string, value: string) => {
    const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  it('links each airline to its management page', async () => {
    const fixture = await render();

    expect(fixture.nativeElement.querySelector('[data-testid="manage-2579"]').getAttribute('href')).toBe('/2579');
  });

  it('creates an airline and opens it', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    element.querySelector<HTMLButtonElement>('[data-testid="new-airline"]')!.click();
    await fixture.whenStable();
    type(element, 'name', 'SkyBridge Air');
    type(element, 'icaoCode', 'skb');
    element.querySelector<HTMLButtonElement>('[data-testid="airline-form"] button[type="submit"]')!.click();

    const request = http.expectOne('/api/admin/airlines');
    expect(request.request.body).toEqual({ name: 'SkyBridge Air', icaoCode: 'SKB', iataCode: null, callsign: null, country: null, isActive: true });
    request.flush({ ...golDetail, id: 7000, name: 'SkyBridge Air' });
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/admin/airlines', 7000]);
  });

  it('validates the ICAO code before sending', async () => {
    const fixture = await render();
    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('[data-testid="new-airline"]')!.click();
    await fixture.whenStable();
    type(element, 'name', 'Bad Code');
    type(element, 'icaoCode', 'S1');
    element.querySelector<HTMLButtonElement>('[data-testid="airline-form"] button[type="submit"]')!.click();
    await fixture.whenStable();

    http.expectNone('/api/admin/airlines');
    expect(element.querySelector('[data-testid="error-icaoCode"]')!.textContent).toContain('3 letters');
  });
});