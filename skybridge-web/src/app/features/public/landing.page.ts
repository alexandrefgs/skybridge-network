import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval, startWith } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { PublicFlight, PublicStats } from '../../core/public/public.models';
import { PublicService } from '../../core/public/public.service';
import { missionCode } from '../../shared/freelance/missions';

interface BoardRow {
  id: number | null;
  flight: string;
  origin: string;
  destination: string;
  detail: string;
  time: string;
}

const PLANE = 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z';

@Component({
  selector: 'sb-landing-page',
  imports: [RouterLink],
  styles: `
    .grid-bg {
      background-image:
        linear-gradient(to right, color-mix(in srgb, var(--sb-foreground) 7%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--sb-foreground) 7%, transparent) 1px, transparent 1px);
      background-size: 56px 56px;
      mask-image: radial-gradient(ellipse at 25% 30%, black 15%, transparent 70%);
    }
    .flap {
      display: inline-block;
      width: 1.3em;
      margin-right: 2px;
      padding: 0.2em 0;
      border-radius: 3px;
      text-align: center;
      background: linear-gradient(to bottom, var(--sb-surface-2) 0 48%, var(--sb-background) 48% 52%, var(--sb-surface-2) 52%);
      animation: flip 0.45s ease-out both;
    }
    .flap.dim { color: color-mix(in srgb, var(--sb-foreground) 20%, transparent); }
    @keyframes flip { from { transform: rotateX(90deg); opacity: 0; } }
    .outline-num {
      color: transparent;
      -webkit-text-stroke: 1px color-mix(in srgb, var(--sb-foreground) 30%, transparent);
      transition: -webkit-text-stroke-color 0.2s;
    }
    .group:hover .outline-num { -webkit-text-stroke-color: var(--sb-primary); }
    @media (prefers-reduced-motion: reduce) { .flap { animation: none; } }
  `,
  template: `
    <section class="relative pb-14 pt-4 lg:pt-10" data-testid="hero">
      <div class="grid-bg pointer-events-none absolute -inset-x-6 -top-10 bottom-0" aria-hidden="true"></div>
      <div class="pointer-events-none absolute -left-48 -top-48 h-[30rem] w-[30rem] rounded-full bg-primary/20 blur-3xl" aria-hidden="true"></div>

      <div class="relative grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <p class="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 font-mono text-xs text-muted backdrop-blur" data-testid="online-now">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"></span>
              <span class="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            @if (online() !== null) {
              <span><strong class="text-foreground">{{ online() }}</strong> pilots online now on VATSIM &amp; IVAO</span>
            } @else {
              <span>Flying live on VATSIM &amp; IVAO</span>
            }
          </p>

          <h1 class="mt-6 font-display text-6xl font-bold leading-[0.95] tracking-tight sm:text-7xl xl:text-8xl">
            Your sky.<br /><span class="text-primary">Your rules.</span>
          </h1>
          <p class="mt-6 max-w-lg text-lg text-muted">
            Real airline schedules, freelance missions and executive charters — from a Cessna 172 to a 777.
            Online or offline, in any simulator.
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            @if (auth.isSignedIn()) {
              <a routerLink="/cockpit" class="sb-btn-primary group w-auto gap-2 px-6 py-3" data-testid="hero-cockpit">
                Open cockpit <span class="transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a routerLink="/freelance" class="sb-btn-secondary w-auto px-6 py-3">Find a job</a>
            } @else {
              <a routerLink="/register" class="sb-btn-primary group w-auto gap-2 px-6 py-3" data-testid="hero-register">
                Start flying <span class="transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a routerLink="/login" class="sb-btn-secondary w-auto px-6 py-3">Sign in</a>
            }
          </div>

          <ul class="mt-10 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] tracking-[0.15em] text-muted">
            @for (sim of sims; track sim) {
              <li>{{ sim }}</li>
            }
          </ul>
        </div>

        <div class="rounded-2xl border border-line bg-surface/90 shadow-2xl shadow-black/40 backdrop-blur" data-testid="board">
          <div class="flex items-center justify-between border-b border-line px-5 py-3">
            <p class="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.2em]">
              <svg class="h-4 w-4 rotate-135 text-primary" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path [attr.d]="plane" /></svg>
              ARRIVALS
            </p>
            <p class="font-mono text-[11px] text-muted" data-testid="board-clock">{{ clock() }} UTC</p>
          </div>

          <div class="hidden grid-cols-[auto_1fr_auto] gap-6 px-5 pt-4 font-mono text-[10px] tracking-[0.2em] text-muted sm:grid">
            <span class="w-52">FLIGHT</span><span>ROUTE</span><span class="text-right">STATUS</span>
          </div>

          <ol class="divide-y divide-line/60 px-5">
            @for (row of board(); track $index; let r = $index) {
              <li class="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 py-3 sm:grid-cols-[auto_1fr_auto]" [attr.data-testid]="row.id ? 'board-flight-' + row.id : null">
                <div class="font-mono text-xs font-semibold sm:w-52 sm:text-sm">
                  <span class="whitespace-nowrap">@for (char of chars(row.flight, 9); track $index; let c = $index) {<span class="flap" [class.dim]="!row.id" [style.animation-delay.ms]="r * 120 + c * 30">{{ char }}</span>}</span>
                  <p class="mt-1 truncate font-sans text-[11px] font-normal text-muted">{{ row.detail }}</p>
                </div>
                <div class="col-span-2 row-start-2 flex items-center gap-2 font-mono text-xs font-semibold sm:col-span-1 sm:row-start-auto sm:text-sm">
                  <span class="whitespace-nowrap">@for (char of chars(row.origin, 4); track $index; let c = $index) {<span class="flap" [class.dim]="!row.id" [style.animation-delay.ms]="r * 120 + 270 + c * 30">{{ char }}</span>}</span>
                  <span class="text-primary" aria-hidden="true">›</span>
                  <span class="whitespace-nowrap">@for (char of chars(row.destination, 4); track $index; let c = $index) {<span class="flap" [class.dim]="!row.id" [style.animation-delay.ms]="r * 120 + 390 + c * 30">{{ char }}</span>}</span>
                </div>
                <div class="text-right font-mono text-[11px]">
                  @if (row.id) {
                    <p class="font-semibold tracking-widest text-primary">LANDED</p>
                    <p class="text-muted">{{ row.time }}Z</p>
                  } @else {
                    <p class="tracking-widest text-muted/40">— — —</p>
                  }
                </div>
              </li>
            }
          </ol>

          <div class="flex items-center justify-between gap-4 border-t border-line px-5 py-3 text-xs">
            @if (flights().length === 0) {
              <p class="text-muted" data-testid="no-public-flights">The first flights are about to land.</p>
            } @else {
              <p class="text-muted">Accepted flights · refreshed every minute</p>
            }
            <a routerLink="/flights" class="shrink-0 text-muted hover:text-primary">All flights →</a>
          </div>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-2 border-y border-line lg:grid-cols-4" data-testid="hero-numbers">
      @for (item of numbers(); track item.label) {
        <div class="border-line px-2 py-8 sm:px-6" [class]="item.border">
          <p class="font-display text-4xl font-bold tabular-nums sm:text-5xl">{{ item.value }}</p>
          <p class="mt-2 font-mono text-[10px] tracking-[0.2em] text-muted">{{ item.label }}</p>
        </div>
      }
    </section>

    <section class="mt-20">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="font-mono text-xs tracking-[0.2em] text-primary">YOUR CAREER, YOUR CHOICE</p>
          <h2 class="mt-2 font-display text-4xl font-bold tracking-tight">Four ways to fly</h2>
        </div>
        <p class="max-w-sm text-sm text-muted">Every hour you log unlocks bigger aircraft. Stay freelance or join an airline — your logbook goes with you.</p>
      </div>

      <div class="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4" data-testid="ways">
        @for (way of ways; track way.title; let i = $index) {
          <a [routerLink]="way.link" class="group relative flex flex-col bg-surface p-7 transition-colors hover:bg-surface-2">
            <span class="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100"></span>
            <span class="outline-num font-display text-6xl font-bold">0{{ i + 1 }}</span>
            <p class="mt-6 font-mono text-[11px] tracking-[0.2em] text-primary">{{ way.tag }}</p>
            <p class="mt-1 text-xl font-semibold">{{ way.title }}</p>
            <p class="mt-3 flex-1 text-sm text-muted">{{ way.text }}</p>
            <p class="mt-6 font-mono text-[11px] tracking-widest text-muted">{{ way.fleet }}</p>
            <p class="mt-4 text-sm font-medium text-muted transition-colors group-hover:text-primary">{{ way.cta }} →</p>
          </a>
        }
      </div>
    </section>

    <section class="relative mt-20 overflow-hidden rounded-2xl bg-primary px-8 py-12 text-primary-foreground sm:px-12" data-testid="cta">
      <svg class="pointer-events-none absolute -right-8 top-1/2 h-72 w-72 -translate-y-1/2 rotate-45 opacity-15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path [attr.d]="plane" /></svg>
      <div class="relative flex flex-wrap items-center justify-between gap-6">
        <div>
          <p class="font-mono text-xs tracking-[0.2em] opacity-80">CLEARED FOR PUSHBACK</p>
          <h2 class="mt-2 font-display text-3xl font-bold sm:text-4xl">{{ auth.isSignedIn() ? 'Your next flight is waiting.' : 'Your first flight is one click away.' }}</h2>
          <p class="mt-2 opacity-80">Free account · any simulator · online or offline.</p>
        </div>
        @if (auth.isSignedIn()) {
          <a routerLink="/cockpit" class="rounded-md bg-background px-6 py-3 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5">Open cockpit →</a>
        } @else {
          <a routerLink="/register" class="rounded-md bg-background px-6 py-3 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5" data-testid="cta-register">Create your account →</a>
        }
      </div>
    </section>
  `
})
export class LandingPage {
  protected readonly auth = inject(AuthService);
  protected readonly stats = signal<PublicStats | null>(null);
  protected readonly flights = signal<PublicFlight[]>([]);
  protected readonly clock = signal('--:--');
  protected readonly plane = PLANE;

  protected readonly sims = ['MSFS 2024', 'MSFS 2020', 'X-PLANE 12', 'PREPAR3D', 'VATSIM', 'IVAO'];

  protected readonly ways = [
    { tag: 'FREELANCE', title: 'Missions', text: 'Medevac, cargo, repatriation and air taxi jobs with real stories and a fixed reward.', fleet: 'C172 · C208 · PC12', link: '/freelance', cta: 'See the board' },
    { tag: 'EXECUTIVE', title: 'Charters', text: 'Fly executives between capitals in light and mid-size jets, leg after leg.', fleet: 'E55P · C68A · CL35', link: '/freelance', cta: 'Find a charter' },
    { tag: 'REGIONAL', title: 'Turboprops', text: 'Short runways and small towns in ATRs, Caravans and King Airs.', fleet: 'B350 · AT76 · DH8D', link: '/aircraft', cta: 'See the aircraft' },
    { tag: 'AIRLINES', title: 'Major airlines', text: 'Real schedules from real airlines, paid per flight hour.', fleet: 'A320 · B738 · B77W', link: '/airlines', cta: 'Browse airlines' }
  ];

  protected readonly online = computed(() => {
    const stats = this.stats();
    if (!stats || (stats.onlineVatsim === null && stats.onlineIvao === null)) return null;
    return (stats.onlineVatsim ?? 0) + (stats.onlineIvao ?? 0);
  });

  protected readonly numbers = computed(() => {
    const stats = this.stats();
    return [
      { label: 'FLIGHTS FLOWN', value: this.show(stats?.totalFlights), border: '' },
      { label: 'THIS MONTH', value: this.show(stats?.flightsThisMonth), border: 'border-l' },
      { label: 'DESTINATIONS', value: this.show(stats?.destinations), border: 'border-t lg:border-l lg:border-t-0' },
      { label: 'PILOTS', value: this.show(stats?.pilots), border: 'border-l border-t lg:border-t-0' }
    ];
  });

  protected readonly board = computed<BoardRow[]>(() => {
    const rows: BoardRow[] = this.flights().map(f => ({
      id: f.id,
      flight: f.flightNumber ?? missionCode(f.mission),
      origin: f.origin,
      destination: f.destination,
      detail: `${f.pilot} · ${f.aircraft}`,
      time: f.arrivedAtUtc.slice(11, 16)
    }));
    while (rows.length < 5) rows.push({ id: null, flight: '', origin: '', destination: '', detail: '\u00a0', time: '' });
    return rows;
  });

  constructor() {
    const service = inject(PublicService);
    service.stats().pipe(takeUntilDestroyed()).subscribe({ next: stats => this.stats.set(stats), error: () => undefined });
    service.flights(5).pipe(takeUntilDestroyed()).subscribe({ next: flights => this.flights.set(flights), error: () => undefined });
    interval(30_000)
      .pipe(startWith(0), takeUntilDestroyed())
      .subscribe(() => this.clock.set(new Date().toISOString().slice(11, 16)));
  }

  protected chars(value: string, size: number): string[] {
    return value.padEnd(size, ' ').slice(0, size).split('').map(c => (c === ' ' ? '\u00a0' : c));
  }

  protected show(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : value.toLocaleString('en-US');
  }
}