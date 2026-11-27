import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ClientConfigService } from '../../core/config/client-config.service';
import { regulationsV1, regulationsV2 } from '../../testing/account';
import { PrivacyPage } from './privacy.page';
import { RegulationsPage } from './regulations.page';

describe('Legal pages', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function render(page: Type<unknown>) {
    const fixture = TestBed.createComponent(page);
    await fixture.whenStable();
    http.expectOne('/api/public/regulations').flush({ currentVersion: 2, history: [regulationsV1, regulationsV2] });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    return (id: string) => element.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
  }

  it('shows the regulations with the version in force and the change history', async () => {
    const query = await render(RegulationsPage);

    expect(query('legal-version')!.textContent).toContain('VERSION 2');
    expect(query('legal-sections')!.textContent).toContain('at least 16 years old');
    expect(query('legal-sections')!.textContent).toContain('60 days');
    expect(query('legal-sections')!.textContent).toContain('SimBrief flight plan');
    expect(query('legal-history')!.textContent).toContain('PIREPs must be filed within 24 hours.');
  });

  it('shows the privacy policy with the LGPD rights, without a change history', async () => {
    const query = await render(PrivacyPage);

    expect(query('legal-sections')!.textContent).toContain('art. 18, VI');
    expect(query('legal-sections')!.textContent).toContain('12 months');
    expect(query('legal-history')).toBeNull();
  });

  it('points to Discord until a contact e-mail is configured', async () => {
    TestBed.inject(ClientConfigService).discordUrl.set('https://discord.gg/skybridge');
    const query = await render(PrivacyPage);
    expect(query('legal-contact')!.querySelector('a')!.getAttribute('href')).toBe('https://discord.gg/skybridge');

    TestBed.inject(ClientConfigService).contactEmail.set('privacy@skybridge.test');
    const withEmail = await render(PrivacyPage);
    expect(withEmail('legal-contact')!.querySelector('a')!.getAttribute('href')).toBe('mailto:privacy@skybridge.test');
  });
});