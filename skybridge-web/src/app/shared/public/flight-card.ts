import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { PublicFlight } from '../../core/public/public.models';
import { FreelanceJobKind } from '../../core/freelance/freelance.models';
import { missionLabel } from '../freelance/missions';
import { durationLabel } from '../time/utc';

@Component({
  selector: 'sb-flight-card',
  imports: [DatePipe],
  template: `
    @let item = flight();
    <article class="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface" [attr.data-testid]="'public-flight-' + item.id">
      <div class="relative h-32 overflow-hidden bg-gradient-to-br from-primary/40 via-surface-2 to-background">
        <svg class="absolute -right-4 -top-2 h-40 w-40 rotate-12 text-foreground/10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
        </svg>
        <p class="absolute bottom-3 left-4 font-mono text-3xl font-bold tracking-wider">{{ item.aircraft }}</p>
        <p class="absolute right-4 top-3 rounded-full border border-foreground/20 px-2 py-0.5 font-mono text-[10px] tracking-widest text-foreground/80">
          {{ item.arrivedAtUtc | date: 'dd MMM' : 'UTC' }}
        </p>
      </div>
      <div class="flex flex-1 flex-col p-5">
        <p class="font-mono text-lg font-semibold">
          @if (item.flightNumber) { <span class="text-primary">{{ item.flightNumber }}</span> · }
          {{ item.origin }} <span class="text-primary">→</span> {{ item.destination }}
        </p>
        <p class="mt-1 truncate text-xs text-muted" [title]="item.originName + ' → ' + item.destinationName">{{ item.originName }} → {{ item.destinationName }}</p>
        <dl class="mt-4 space-y-1 text-sm">
          <div><dt class="inline text-muted">Aircraft: </dt><dd class="inline">{{ item.aircraftModel }}</dd></div>
          <div><dt class="inline text-muted">Operation: </dt><dd class="inline" data-testid="operation">{{ operation() }}</dd></div>
          <div><dt class="inline text-muted">Duration: </dt><dd class="inline font-mono">{{ duration() }}</dd></div>
        </dl>
        <div class="mt-auto flex items-center justify-between border-t border-line pt-4 text-sm">
          <span class="flex items-center gap-2">
            <span class="grid h-7 w-7 place-items-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">{{ item.pilot.charAt(0) }}</span>
            {{ item.pilot }}
          </span>
          @if (item.landingRateFpm !== null) {
            <span class="font-mono text-xs text-muted">-{{ item.landingRateFpm }} fpm</span>
          }
        </div>
      </div>
    </article>
  `
})
export class FlightCard {
  readonly flight = input.required<PublicFlight>();

  protected readonly operation = computed(() => {
    const flight = this.flight();
    if (flight.airline) return flight.airline;
    return flight.mission ? `${missionLabel(flight.mission as FreelanceJobKind)} · freelance` : 'Freelance';
  });
  protected readonly duration = computed(() => durationLabel(this.flight().flightMinutes));
}