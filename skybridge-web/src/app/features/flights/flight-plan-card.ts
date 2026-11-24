import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Booking } from '../../core/bookings/booking.models';
import { BookingService } from '../../core/bookings/booking.service';
import { problemMessages } from '../../core/http/problem';
import { Pilot } from '../../core/pilot/pilot.models';
import { PilotService } from '../../core/pilot/pilot.service';
import { currentLeg } from '../../shared/flights/booking-legs';
import { simBriefDispatchUrl } from '../../shared/flights/simbrief';
import { durationLabel } from '../../shared/time/utc';

@Component({
  selector: 'sb-flight-plan-card',
  imports: [ReactiveFormsModule, DecimalPipe, DatePipe],
  template: `
    <section class="sb-card" data-testid="ofp">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p class="font-mono text-[10px] tracking-[0.2em] text-primary">SIMBRIEF OFP · LEG {{ booking().currentLeg }}</p>
          <h2 class="mt-1 text-lg font-semibold">Flight plan</h2>
        </div>
        @if (pilotId() && !editing()) {
          <p class="text-xs text-muted" data-testid="simbrief-id">
            Pilot ID <span class="font-mono text-foreground">{{ pilotId() }}</span> ·
            <button type="button" class="hover:text-primary" (click)="edit()" data-testid="change-simbrief">change</button>
          </p>
        }
      </div>

      @if (!pilotId() || editing()) {
        <form class="mt-4 flex flex-wrap items-end gap-3" (submit)="link($event)" data-testid="simbrief-form">
          <div>
            <label class="sb-label" for="simbrief-id">SimBrief Pilot ID</label>
            <input id="simbrief-id" class="sb-input w-40 font-mono" inputmode="numeric" maxlength="7" placeholder="123456"
              [formControl]="pilotIdControl" data-testid="simbrief-input">
          </div>
          <button type="submit" class="sb-btn-primary w-auto px-5" [disabled]="busy() || pilotIdControl.invalid" data-testid="save-simbrief">Save</button>
          <p class="w-full text-xs text-muted">It's the number in SimBrief → Account Settings. An OFP is required before every leg.</p>
        </form>
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
  private readonly pilots = inject(PilotService);

  readonly booking = input.required<Booking>();
  readonly pilot = input<Pilot | null>(null);
  readonly imported = output<Booking>();
  readonly linked = output<Pilot>();

  protected readonly pilotIdControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{1,7}$/)]
  });
  protected readonly busy = signal(false);
  protected readonly editing = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly pilotId = computed(() => this.pilot()?.simBriefPilotId ?? null);
  protected readonly dispatchUrl = computed(() => simBriefDispatchUrl(this.booking()));
  protected readonly legLabel = computed(() => {
    const leg = currentLeg(this.booking());
    return leg ? `${leg.origin} → ${leg.destination}` : '';
  });
  protected readonly ete = durationLabel;

  protected edit(): void {
    this.pilotIdControl.setValue(this.pilotId() ?? '');
    this.editing.set(true);
  }

  protected link(event: Event): void {
    event.preventDefault();
    if (this.pilotIdControl.invalid) return;

    this.busy.set(true);
    this.errors.set([]);
    this.pilots.linkSimBrief(this.pilotIdControl.value.trim()).subscribe({
      next: pilot => {
        this.busy.set(false);
        this.editing.set(false);
        this.linked.emit(pilot);
      },
      error: error => {
        this.busy.set(false);
        this.errors.set(problemMessages(error));
      }
    });
  }

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