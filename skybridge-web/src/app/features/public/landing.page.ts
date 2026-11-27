import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PublicFlight, PublicStats } from '../../core/public/public.models';
import { PublicService } from '../../core/public/public.service';
import { FlightCard } from '../../shared/public/flight-card';
import { FlipCounter } from '../../shared/public/flip-counter';

@Component({
  selector: 'sb-landing-page',
  imports: [RouterLink, FlipCounter, FlightCard],
  template: `
    <section class="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-primary/25 via-surface to-background px-8 py-16 sm:px-12" data-testid="hero">
      <svg class="pointer-events-none absolute -right-10 top-0 h-full w-1/2 text-primary/20" viewBox="0 0 400 300" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path d="M10 260 Q 150 40 390 60" stroke-dasharray="6 8" />
        <path d="M40 290 Q 200 120 390 180" stroke-dasharray="6 8" />
        <circle cx="390" cy="60" r="5" fill="currentColor" />
        <circle cx="390" cy="180" r="5" fill="currentColor" />
      </svg>
      <p class="font-mono text-xs tracking-[0.2em] text-primary">FLY ANYTHING · ANYWHERE</p>
      <h1 class="mt-3 max-w-2xl font-display text-5xl font-bold leading-tight sm:text-6xl">Your sky. Your rules.</h1>
      <p class="mt-4 max-w-xl text-lg text-muted">
        Real airline schedules, freelance missions and executive charters — from a Cessna 172 to a 777. Online on VATSIM and IVAO, or offline in any simulator.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        @if (auth.isSignedIn()) {
          <a routerLink="/cockpit" class="sb-btn-primary w-auto px-6" data-testid="hero-cockpit">Open cockpit</a>
          <a routerLink="/freelance" class="sb-btn-secondary w-auto px-6">Find a job</a>
        } @else {
          <a routerLink="/register" class="sb-btn-primary w-auto px-6" data-testid="hero-register">Start flying</a>
          <a routerLink="/login" class="sb-btn-secondary w-auto px-6">Sign in</a>
        }
      </div>
    </section>

    <section class="mt-10 grid gap-4 sm:grid-cols-3" data-testid="hero-numbers">
      <div class="sb-card p-6">
        <sb-flip-counter [value]="stats()?.flightsThisMonth ?? null" />
        <p class="mt-3 font-semibold">Flights this month</p>
      </div>
      <div class="sb-card p-6">
        <sb-flip-counter [value]="online()" />
        <p class="mt-3 font-semibold">Pilots online now</p>
        <p class="text-xs text-muted">VATSIM + IVAO</p>
      </div>
      <div class="sb-card p-6">
        <sb-flip-counter [value]="stats()?.destinations ?? null" />
        <p class="mt-3 font-semibold">Destinations</p>
      </div>
    </section>

    <section class="mt-16">
      <p class="font-mono text-xs tracking-[0.2em] text-primary">YOUR CAREER, YOUR CHOICE</p>
      <h2 class="mt-2 font-display text-3xl font-bold">Four ways to fly</h2>
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="ways">
        @for (way of ways; track way.title) {
          <a [routerLink]="way.link" class="group rounded-xl border border-line bg-surface p-6 transition-colors hover:border-primary">
            <p class="font-mono text-xs tracking-[0.2em] text-primary">{{ way.tag }}</p>
            <p class="mt-2 text-lg font-semibold">{{ way.title }}</p>
            <p class="mt-2 text-sm text-muted">{{ way.text }}</p>
            <p class="mt-4 text-sm text-muted transition-colors group-hover:text-primary">{{ way.cta }} →</p>
          </a>
        }
      </div>
    </section>

    <section class="mt-16">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="font-mono text-xs tracking-[0.2em] text-primary">UPDATED EVERY MINUTE</p>
          <h2 class="mt-2 font-display text-3xl font-bold">Last flights flown</h2>
        </div>
        <a routerLink="/flights" class="text-sm text-muted hover:text-primary">All recent flights →</a>
      </div>
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (flight of flights(); track flight.id) {
          <sb-flight-card [flight]="flight" />
        } @empty {
          <p class="text-muted sm:col-span-2 lg:col-span-4" data-testid="no-public-flights">The first flights are about to take off.</p>
        }
      </div>
    </section>
  `
})
export class LandingPage {
  protected readonly auth = inject(AuthService);
  protected readonly stats = signal<PublicStats | null>(null);
  protected readonly flights = signal<PublicFlight[]>([]);

  protected readonly ways = [
    { tag: 'FREELANCE', title: 'Missions', text: 'Medevac, cargo, repatriation and air taxi jobs with real stories and a fixed reward.', link: '/freelance', cta: 'See the board' },
    { tag: 'EXECUTIVE', title: 'Charters', text: 'Fly executives between capitals in light and mid-size jets, leg after leg.', link: '/freelance', cta: 'Find a charter' },
    { tag: 'REGIONAL', title: 'Turboprops', text: 'Short runways and small towns in ATRs, Caravans and King Airs.', link: '/aircraft', cta: 'See the aircraft' },
    { tag: 'AIRLINES', title: 'Major airlines', text: 'Real schedules from real airlines, paid per flight hour.', link: '/airlines', cta: 'Browse airlines' }
  ];

  constructor() {
    const service = inject(PublicService);
    service.stats().pipe(takeUntilDestroyed()).subscribe({ next: stats => this.stats.set(stats), error: () => undefined });
    service.flights(4).pipe(takeUntilDestroyed()).subscribe({ next: flights => this.flights.set(flights), error: () => undefined });
  }

  protected online(): number | null {
    const stats = this.stats();
    if (!stats || (stats.onlineVatsim === null && stats.onlineIvao === null)) return null;
    return (stats.onlineVatsim ?? 0) + (stats.onlineIvao ?? 0);
  }
}