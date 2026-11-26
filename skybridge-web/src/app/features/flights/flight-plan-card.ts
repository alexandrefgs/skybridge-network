import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Booking } from '../../core/bookings/booking.models';
import { BookingService } from '../../core/bookings/booking.service';
import { problemMessages } from '../../core/http/problem';
import { Pilot } from '../../core/pilot/pilot.models';
import { currentLeg } from '../../shared/flights/booking-legs';
import { simBriefDispatchUrl } from '../../shared/flights/simbrief';
import { durationLabel } from '../../shared/time/utc';
import { FlightPlanDetailsView } from './flight-plan-details';

@Component({
  selector: 'sb-flight-plan-card',
  imports: [RouterLink, DecimalPipe, DatePipe, FlightPlanDetailsView],
  template: `
    <section class="sb-card" data-testid="ofp">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p class="font-mono text-[10px] tracking-[0.2em] text-primary">SIMBRIEF OFP · LEG {{ booking().currentLeg }}</p>
          <h2 class="mt-1 text-lg font-semibold">Flight plan</h2>
        </div>
        @if (pilotId()) {
          <p class="text-xs text-muted" data-testid="simbrief-id">
            Pilot ID <span class="font-mono text-foreground">{{ pilotId() }}</span> ·
            <a routerLink="/account/profile" class="hover:text-primary">change</a>
          </p>
        }
      </div>

      @if (!pilotId()) {
        <p class="mt-4 text-sm text-muted" data-testid="needs-simbrief">
          Add your SimBrief Pilot ID in
          <a routerLink="/account/profile" class="text-primary hover:underline" data-testid="simbrief-settings-link">Settings</a>
          to plan and import the OFP for this leg.
        </p>
      } @else if (booking().flightPlan; as plan) {
        <dl class="mt-4 grid gap-4 font-mono text-sm sm:grid-cols-4" data-testid="ofp-details">
          <div>
            <dt class="text-[10px] tracking-[0.2em] text-muted">CALLSIGN</dt>
            <dd class="mt-1 font-semibold">{{ plan.callsign ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-[10px] tracking-[0.2em] text-muted">LEG</dt>
            <dd class="mt-1 font-semibold">{{ plan.origin }} → {{ plan.destination }}</dd>
            <dd class="text-xs text-muted">ALTN {{ plan.alternate ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-[10px] tracking-[0.2em] text-muted">CRUISE</dt>
            <dd class="mt-1 font-semibold">FL{{ plan.cruiseAltitudeFt / 100 | number: '3.0-0' }}</dd>
            <dd class="text-xs text-muted">{{ plan.distanceNm | number }} nm · {{ ete(plan.enrouteMinutes) }}</dd>
          </div>
          <div>
            <dt class="text-[10px] tracking-[0.2em] text-muted">AIRCRAFT</dt>
            <dd class="mt-1 font-semibold">{{ plan.aircraft }}</dd>
            <dd class="text-xs text-muted">{{ plan.registration ?? '' }}</dd>
          </div>
          <div class="sm:col-span-4">
            <dt class="text-[10px] tracking-[0.2em] text-muted">ROUTE</dt>
            <dd class="mt-1 break-words" data-testid="ofp-route">{{ plan.route }}</dd>
          </div>
          <div>
            <dt class="text-[10px] tracking-[0.2em] text-muted">BLOCK FUEL</dt>
            <dd class="mt-1 font-semibold text-primary">{{ plan.blockFuelKg | number }} kg</dd>
          </div>
          <div>
            <dt class="text-[10px] tracking-[0.2em] text-muted">TRIP · LANDING</dt>
            <dd class="mt-1 font-semibold">{{ plan.tripFuelKg | number }} · {{ plan.landingFuelKg | number }} kg</dd>
          </div>
          <div>
            <dt class="text-[10px] tracking-[0.2em] text-muted">ZFW · TOW</dt>
            <dd class="mt-1 font-semibold">{{ plan.zeroFuelWeightKg | number }} · {{ plan.takeoffWeightKg | number }} kg</dd>
          </div>
          <div>
            <dt class="text-[10px] tracking-[0.2em] text-muted">PAYLOAD</dt>
            <dd class="mt-1 font-semibold">{{ plan.passengerCount | number }} pax · {{ plan.cargoKg | number }} kg</dd>
          </div>
        </dl>
        <div class="mt-4">
          @if (plan.details; as details) {
            <button type="button" class="text-sm font-medium text-primary hover:underline" (click)="expanded.set(!expanded())" data-testid="toggle-full-plan">
              {{ expanded() ? 'Hide full flight plan ▴' : 'Show full flight plan ▾' }}
            </button>
            @if (expanded()) {
              <div class="mt-4">
                <sb-flight-plan-details [details]="details" />
              </div>
            }
          } @else {
            <p class="text-xs text-muted" data-testid="no-full-plan">Import the OFP again to see the full flight plan.</p>
          }
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4 text-xs text-muted">
          <span>OFP {{ plan.simBriefId }} · AIRAC {{ plan.airac ?? '—' }} · generated {{ plan.generatedAtUtc | date: 'dd MMM HH:mm' : 'UTC' }}Z</span>
          @if (!booking().legInProgress) {
            <a class="ml-auto hover:text-primary" [href]="dispatchUrl()" target="_blank" rel="noopener">Re-plan on SimBrief ↗</a>
            <button type="button" class="hover:text-primary" [disabled]="busy()" (click)="import()" data-testid="reimport-ofp">Import again</button>
          }
        </div>
      } @else {
        <ol class="mt-4 space-y-1 text-sm text-muted">
          <li>1. Open SimBrief with this leg already filled in.</li>
          <li>2. Generate the OFP there (keep {{ legLabel() }} and the {{ booking().aircraft }}).</li>
          <li>3. Come back and import it.</li>
        </ol>
        @if (booking().flight?.atsRoute; as route) {
          <p class="mt-3 font-mono text-xs text-muted" data-testid="scheduled-route">
            Airline route: <span class="text-foreground">{{ route }}</span>
            @if (booking().flight?.flightLevel; as level) { · FL{{ level }} }
          </p>
        }
        <div class="mt-4 flex flex-wrap gap-3">
          <a class="sb-btn-secondary inline-block w-auto px-5" [href]="dispatchUrl()" target="_blank" rel="noopener" data-testid="plan-simbrief">Plan on SimBrief ↗</a>
          <button type="button" class="sb-btn-primary w-auto px-5" [disabled]="busy()" (click)="import()" data-testid="import-ofp">Import OFP</button>
        </div>
      }

      @if (errors().length) {
        <ul class="sb-error mt-4 space-y-1" data-testid="ofp-errors">
          @for (message of errors(); track message) {
            <li>{{ message }}</li>
          }
        </ul>
      }
    </section>
  `
})
export class FlightPlanCard {
  private readonly bookings = inject(BookingService);

  readonly booking = input.required<Booking>();
  readonly pilot = input<Pilot | null>(null);
  readonly imported = output<Booking>();

  protected readonly busy = signal(false);
  protected readonly expanded = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly pilotId = computed(() => this.pilot()?.simBriefPilotId ?? null);
  protected readonly dispatchUrl = computed(() => simBriefDispatchUrl(this.booking()));
  protected readonly legLabel = computed(() => {
    const leg = currentLeg(this.booking());
    return leg ? `${leg.origin} → ${leg.destination}` : '';
  });
  protected readonly ete = durationLabel;

  protected import(): void {
    this.busy.set(true);
    this.errors.set([]);
    this.bookings.importFlightPlan().subscribe({
      next: booking => {
        this.busy.set(false);
        this.imported.emit(booking);
      },
      error: error => {
        this.busy.set(false);
        this.errors.set(problemMessages(error));
      }
    });
  }
}