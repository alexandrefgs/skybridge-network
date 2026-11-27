import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ClientConfigService } from './client-config.service';

describe('ClientConfigService', () => {
  let service: ClientConfigService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ClientConfigService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the map key and the site links from the API', () => {
    service.load().subscribe();
    http.expectOne('/api/config/client').flush({
      cartoApiKey: 'carto-key', contactEmail: 'privacy@skybridge.test', discordUrl: 'https://discord.gg/sb', instagramUrl: null
    });

    expect(service.cartoApiKey()).toBe('carto-key');
    expect(service.contactEmail()).toBe('privacy@skybridge.test');
    expect(service.discordUrl()).toBe('https://discord.gg/sb');
    expect(service.instagramUrl()).toBeNull();
  });

  it('keeps the app running when the API is unavailable', () => {
    let completed = false;
    service.load().subscribe({ complete: () => (completed = true) });
    http.expectOne('/api/config/client').flush(null, { status: 500, statusText: 'Server Error' });

    expect(completed).toBe(true);
    expect(service.cartoApiKey()).toBeNull();
  });
});