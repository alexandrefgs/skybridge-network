import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { publicStats } from '../../testing/public';
import { AboutPage } from './about.page';

describe('AboutPage', () => {
  it('tells the story with the live number of pilots', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AboutPage);
    await fixture.whenStable();

    http.expectOne('/api/public/stats').flush(publicStats);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('In the virtual sky since 2026');
    expect(fixture.nativeElement.querySelector('[data-testid="about-pilots"]').textContent).toContain('236');
    http.verify();
  });
});