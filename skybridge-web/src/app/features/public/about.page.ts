import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PublicStats } from '../../core/public/public.models';
import { PublicService } from '../../core/public/public.service';

@Component({
  selector: 'sb-about-page',
  imports: [RouterLink],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="font-mono text-xs tracking-[0.2em] text-primary">THANK YOU FOR VISITING US</p>
        <h1 class="mt-2 font-display text-5xl font-bold">In the virtual sky since 2026</h1>
      </div>
      <a href="https://www.simbrief.com" target="_blank" rel="noopener" class="border-b border-foreground pb-1 text-sm font-medium hover:border-primary hover:text-primary">Flight planning tool ↗</a>
    </div>

    <div class="mt-12 grid items-center gap-12 lg:grid-cols-2">
      <div class="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-primary/30 via-surface-2 to-background" aria-hidden="true">
        <svg class="absolute inset-0 h-full w-full text-primary/40" viewBox="0 0 400 300" fill="none" stroke="currentColor" stroke-width="1.2">
          @for (line of grid; track line) {
            <path [attr.d]="'M0 ' + line + ' H400'" class="text-foreground/5" stroke="currentColor" />
          }
          <path d="M40 240 Q 140 80 250 120 T 370 50" stroke-dasharray="5 7" />
          <path d="M30 120 Q 160 200 360 220" stroke-dasharray="5 7" />
          <circle cx="40" cy="240" r="5" fill="currentColor" />
          <circle cx="370" cy="50" r="5" fill="currentColor" />
          <circle cx="360" cy="220" r="5" fill="currentColor" />
        </svg>
        <p class="absolute bottom-6 left-6 font-display text-4xl font-bold">Sky<span class="text-primary">Bridge</span></p>
      </div>

      <div class="space-y-6 text-muted" data-testid="about-text">
        <p class="text-lg font-semibold text-foreground">SkyBridge Network is a virtual airline platform where every pilot builds their own career.</p>
        <p>
          We currently have <span class="font-semibold text-foreground" data-testid="about-pilots">{{ stats()?.pilots ?? '…' }}</span> pilots flying with us,
          online on <span class="font-semibold text-foreground">VATSIM</span> and <span class="font-semibold text-foreground">IVAO</span> or offline,
          in Microsoft Flight Simulator, X-Plane, Prepar3D or any other simulator.
        </p>
        <p>
          Start in a Cessna 172 and grow with your flight hours: freelance missions, executive charters, regional turboprops and the schedules of
          <span class="font-semibold text-foreground">{{ stats()?.airlines ?? '…' }}</span> real airlines. You choose where your career goes.
        </p>
        <p class="text-lg font-semibold text-foreground">Our mission is a realistic, friendly and rewarding virtual aviation experience.</p>
        <p>Every flight starts with a SimBrief plan, ends with a PIREP and pays into your wallet. Pilots learn from each other and share the same passion for aviation.</p>
        <div class="flex flex-wrap gap-3 pt-2">
          <a routerLink="/register" class="sb-btn-primary w-auto px-6">Join the crew</a>
          <a routerLink="/operations" class="sb-btn-secondary w-auto px-6">See our numbers</a>
        </div>
      </div>
    </div>
  `
})
export class AboutPage {
  protected readonly stats = signal<PublicStats | null>(null);
  protected readonly grid = [50, 100, 150, 200, 250];

  constructor() {
    inject(PublicService).stats().pipe(takeUntilDestroyed()).subscribe({ next: stats => this.stats.set(stats), error: () => undefined });
  }
}