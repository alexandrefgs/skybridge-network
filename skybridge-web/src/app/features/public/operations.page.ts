import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, interval, of, startWith, switchMap } from 'rxjs';
import { PublicStats } from '../../core/public/public.models';
import { PublicService } from '../../core/public/public.service';

@Component({
  selector: 'sb-operations-page',
  styles: `
    .sweep { animation: sweep 4s linear infinite; transform-origin: 100px 100px; }
    @keyframes sweep { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .sweep { animation: none; } }
  `,
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="font-mono text-xs tracking-[0.2em] text-primary">OPERATIONS</p>
        <h1 class="mt-2 font-display text-4xl font-bold sm:text-5xl">The numbers behind the crew</h1>
      </div>
      <p class="flex items-center gap-2 rounded-full border border-line px-3 py-1 font-mono text-xs text-muted" data-testid="live">
        <span class="h-2 w-2 animate-pulse rounded-full bg-primary"></span> LIVE · {{ updatedAt() ?? '--:--' }}Z
      </p>
    </div>

    <section class="relative mt-8 overflow-hidden rounded-2xl border border-line bg-surface p-8 sm:p-10" data-testid="total-card">
      <div class="pointer-events-none absolute inset-x-0 bottom-10 h-px border-t-2 border-dashed border-foreground/10" aria-hidden="true"></div>
      <div class="pointer-events-none absolute bottom-4 left-8 right-8 flex justify-between font-mono text-[10px] text-foreground/20" aria-hidden="true">
        <span>RWY 14</span><span>RWY 32</span>
      </div>
      <p class="font-mono text-[10px] tracking-[0.2em] text-muted">TOTAL FLIGHTS</p>
      <p class="mt-2 font-display text-6xl font-bold tabular-nums sm:text-8xl" data-testid="total-flights">{{ show(stats()?.totalFlights) }}</p>
      <p class="mt-2 pb-8 text-muted">Accepted flights since the crew took off in 2026.</p>
    </section>

    <div class="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <section class="sb-card flex flex-col items-center p-8 sm:flex-row sm:gap-10" data-testid="radar-card">
        <svg class="h-48 w-48 shrink-0" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <linearGradient id="sweep-fill" x1="100" y1="100" x2="100" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="currentColor" stop-opacity="0" />
              <stop offset="1" stop-color="currentColor" stop-opacity="0.45" />
            </linearGradient>
          </defs>
          <g class="text-line" fill="none" stroke="currentColor">
            <circle cx="100" cy="100" r="90" />
            <circle cx="100" cy="100" r="60" />
            <circle cx="100" cy="100" r="30" />
            <path d="M100 10V190M10 100H190" />
          </g>
          <path class="sweep text-primary" d="M100 100 L100 10 A90 90 0 0 1 163.6 36.4 Z" fill="url(#sweep-fill)" />
          @for (blip of blips(); track $index) {
            <circle [attr.cx]="blip.x" [attr.cy]="blip.y" r="3.5" class="fill-primary" />
          }
        </svg>
        <div class="mt-6 w-full sm:mt-0">
          <p class="font-mono text-[10px] tracking-[0.2em] text-muted">ONLINE NOW</p>
          <p class="mt-1 text-sm text-muted">SkyBridge pilots connected right now.</p>
          <dl class="mt-5 grid grid-cols-2 gap-4">
            <div class="rounded-lg border border-line p-4">
              <dt class="font-mono text-xs font-semibold tracking-widest">VATSIM</dt>
              <dd class="mt-1 font-display text-4xl font-bold tabular-nums" data-testid="online-vatsim">{{ show(stats()?.onlineVatsim) }}</dd>
            </div>
            <div class="rounded-lg border border-line p-4">
              <dt class="font-mono text-xs font-semibold tracking-widest">IVAO</dt>
              <dd class="mt-1 font-display text-4xl font-bold tabular-nums" data-testid="online-ivao">{{ show(stats()?.onlineIvao) }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section class="sb-card p-8" data-testid="checklist">
        <p class="font-mono text-[10px] tracking-[0.2em] text-muted">PRE-FLIGHT CHECKLIST</p>
        <ol class="mt-4 space-y-3 font-mono text-sm">
          @for (item of checklist(); track item) {
            <li class="flex items-baseline gap-2">
              <span class="shrink-0">{{ item }}</span>
              <span class="min-w-4 flex-1 border-b border-dotted border-muted/40"></span>
              <span class="shrink-0 text-xs font-semibold text-primary">CHECKED</span>
            </li>
          }
        </ol>
      </section>
    </div>

    <div class="mt-6 grid gap-6 sm:grid-cols-3" data-testid="numbers">
      <section class="sb-card p-6">
        <p class="font-mono text-[10px] tracking-[0.2em] text-muted">FLIGHTS · {{ monthShort }}</p>
        <p class="mt-2 font-display text-5xl font-bold tabular-nums" data-testid="month-flights">{{ show(stats()?.flightsThisMonth) }}</p>
        <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
          <div class="h-full rounded-full bg-primary" [style.width.%]="monthProgress"></div>
        </div>
        <p class="mt-2 text-xs text-muted" data-testid="month-label">Flown in {{ month }} · day {{ day }} of {{ daysInMonth }}</p>
      </section>
      <section class="sb-card p-6">
        <p class="font-mono text-[10px] tracking-[0.2em] text-muted">FLEET</p>
        <p class="mt-2 font-display text-5xl font-bold tabular-nums" data-testid="aircraft-count">{{ show(stats()?.aircraft) }}</p>
        <p class="mt-4 text-xs text-muted">Aircraft types, from trainers to wide-bodies, unlocked by your flight hours.</p>
      </section>
      <section class="sb-card p-6">
        <p class="font-mono text-[10px] tracking-[0.2em] text-muted">NETWORK</p>
        <p class="mt-2 font-display text-5xl font-bold tabular-nums" data-testid="destinations">{{ show(stats()?.destinations) }}</p>
        <p class="mt-4 text-xs text-muted">Destinations served by the {{ stats()?.airlines ?? 0 }} airlines we fly, growing with their real schedules.</p>
      </section>
    </div>

    @if (failed()) {
      <p class="sb-error mt-8" data-testid="stats-error">We could not load the numbers right now. They will refresh in a minute.</p>
    }
  `
})
export class OperationsPage {
  private readonly now = new Date();

  protected readonly stats = signal<PublicStats | null>(null);
  protected readonly failed = signal(false);
  protected readonly updatedAt = signal<string | null>(null);
  protected readonly month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(this.now);
  protected readonly monthShort = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(this.now).toUpperCase();
  protected readonly day = this.now.getUTCDate();
  protected readonly daysInMonth = new Date(Date.UTC(this.now.getUTCFullYear(), this.now.getUTCMonth() + 1, 0)).getUTCDate();
  protected readonly monthProgress = Math.round((this.day / this.daysInMonth) * 100);

  protected readonly checklist = computed(() => {
    const stats = this.stats();
    return [
      'Real airline schedules (CGNA)',
      `${stats?.airlines ?? 0} airlines + freelance missions`,
      'Careers built on flight hours',
      'Any simulator, online or offline',
      `${stats?.pilots ?? 0} pilots in the crew`
    ];
  });

  protected readonly blips = computed(() => {
    const total = Math.min((this.stats()?.onlineVatsim ?? 0) + (this.stats()?.onlineIvao ?? 0), 12);
    return Array.from({ length: total }, (_, index) => {
      const angle = index * 2.399;
      const radius = 22 + ((index * 37) % 62);
      return { x: 100 + Math.cos(angle) * radius, y: 100 + Math.sin(angle) * radius };
    });
  });

  constructor() {
    const service = inject(PublicService);
    interval(60_000)
      .pipe(
        startWith(0),
        switchMap(() =>
          service.stats().pipe(
            catchError(() => {
              this.failed.set(true);
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe(stats => {
        if (!stats) return;
        this.failed.set(false);
        this.stats.set(stats);
        this.updatedAt.set(new Date().toISOString().slice(11, 16));
      });
  }

  protected show(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : value.toLocaleString('en-US');
  }
}