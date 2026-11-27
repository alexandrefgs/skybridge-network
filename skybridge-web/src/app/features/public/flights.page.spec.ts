import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { publicFlights } from '../../testing/public';
import { FlightsPage } from './flights.page';

describe('FlightsPage', () => {
  it('shows the last four flights with their operation', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(FlightsPage);
    await fixture.whenStable();

    const request = http.expectOne(r => r.url === '/api/public/flights');
    expect(request.request.params.get('count')).toBe('4');
    request.flush(publicFlights);
    await fixture.whenStable();

    const cards = fixture.nativeElement.querySelectorAll('[data-testid^="public-flight-"]');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Gol Transportes Aéreos');
    expect(cards[0].textContent).toContain('1h02min');
    expect(cards[0].textContent).toContain('-140 fpm');
    expect(cards[1].textContent).toContain('MEDEVAC · freelance');
    expect(cards[1].textContent).toContain('Rafael L.');
    http.verify();
  });
});