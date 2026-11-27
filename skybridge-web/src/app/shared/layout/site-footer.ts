import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClientConfigService } from '../../core/config/client-config.service';

@Component({
  selector: 'sb-site-footer',
  imports: [RouterLink],
  template: `
    <footer class="mt-16 border-t border-line bg-surface" data-testid="site-footer">
      <div class="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p class="font-semibold">About SkyBridge</p>
          <p class="mt-3 text-sm leading-relaxed text-muted">Real airlines, freelance missions and executive flights for virtual pilots. Fly anything, anywhere.</p>
        </div>
        <div>
          <p class="font-semibold">Fly online on</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span class="rounded-md border border-line px-3 py-1.5 font-mono text-sm font-semibold tracking-wider">VATSIM</span>
            <span class="rounded-md border border-line px-3 py-1.5 font-mono text-sm font-semibold tracking-wider">IVAO</span>
          </div>
          <p class="mt-2 text-xs text-muted">Offline flights count too.</p>
        </div>
        <div>
          <p class="font-semibold">Operations</p>
          <ul class="mt-3 space-y-2 text-sm text-muted">
            <li><a routerLink="/operations" class="hover:text-primary">Our numbers</a></li>
            <li><a routerLink="/flights" class="hover:text-primary">Last flights</a></li>
            <li><a routerLink="/about" class="hover:text-primary">About us</a></li>
          </ul>
        </div>
        <div>
          <p class="font-semibold">Community</p>
          <ul class="mt-3 space-y-2 text-sm text-muted">
            @if (config.discordUrl(); as discord) {
              <li><a [href]="discord" target="_blank" rel="noopener" class="hover:text-primary" data-testid="footer-discord">Discord ↗</a></li>
            }
            @if (config.instagramUrl(); as instagram) {
              <li><a [href]="instagram" target="_blank" rel="noopener" class="hover:text-primary" data-testid="footer-instagram">Instagram ↗</a></li>
            }
            <li><a routerLink="/register" class="hover:text-primary">Join as a pilot</a></li>
          </ul>
        </div>
      </div>
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-6 text-xs text-muted">
        <p>© 2026 SkyBridge Network · All rights reserved</p>
        <p>This website is for flight simulation purposes only.</p>
        <button type="button" (click)="toTop()" aria-label="Back to top" data-testid="back-to-top"
          class="grid h-10 w-10 place-items-center rounded-full border border-line text-foreground transition-colors hover:border-primary hover:text-primary">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </footer>
  `
})
export class SiteFooter {
  protected readonly config = inject(ClientConfigService);

  protected toTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}