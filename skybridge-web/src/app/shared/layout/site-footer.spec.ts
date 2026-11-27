import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ClientConfigService } from '../../core/config/client-config.service';
import { provideHttpClient } from '@angular/common/http';
import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
  });

  it('shows the community links that are configured', async () => {
    const config = TestBed.inject(ClientConfigService);
    config.discordUrl.set('https://discord.gg/skybridge');
    const fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();
    const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

    expect(query('footer-discord')!.getAttribute('href')).toBe('https://discord.gg/skybridge');
    expect(query('footer-instagram')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('© 2026 SkyBridge Network');
  });

  it('goes back to the top', async () => {
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('[data-testid="back-to-top"]') as HTMLButtonElement).click();

    expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});