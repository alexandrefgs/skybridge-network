import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Booking } from '../../core/bookings/booking.models';
import { problemMessages } from '../../core/http/problem';
import { PirepFiled } from '../../core/pireps/pirep.models';
import { PirepService } from '../../core/pireps/pirep.service';
import { currentLeg } from '../../shared/flights/booking-legs';
import { FuelConverter } from '../../shared/forms/fuel-converter';
import { UtcDateTimeInput } from '../../shared/forms/utc-datetime-input';
import { durationLabel, fromUtcInput, toUtcInput } from '../../shared/time/utc';

@Component({
  selector: 'sb-pirep-form',
  imports: [ReactiveFormsModule, UtcDateTimeInput, FuelConverter],
  template: `
    <form class="rounded-lg border border-line p-4" [formGroup]="form" (ngSubmit)="submit()" data-testid="pirep-form">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="font-semibold">PIREP · leg {{ booking().currentLeg }} · {{ leg() }}</h3>
        <span class="font-mono text-sm text-muted" data-testid="pirep-duration">{{ duration() }}</span>
      </div>

      <p class="mt-1 font-mono text-[11px] text-muted" data-testid="pirep-window">
        Leg started {{ startedLabel() }} · takeoff from {{ earliestLabel() }} · landing up to now
      </p>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div class="text-sm">
          <label class="text-muted" for="pirep-departed">Takeoff</label>
          <sb-utc-datetime-input class="mt-1" inputId="pirep-departed" testId="pirep-departed" formControlName="departed" />
        </div>
        <div class="text-sm">
          <label class="text-muted" for="pirep-arrived">Landing</label>
          <sb-utc-datetime-input class="mt-1" inputId="pirep-arrived" testId="pirep-arrived" formControlName="arrived" />
        </div>
        <div class="text-sm">
          <label class="text-muted" for="pirep-fuel">Fuel used (kg)</label>
          <div class="mt-1 flex items-stretch gap-2">
            <input id="pirep-fuel" type="number" min="0" class="sb-input font-mono" formControlName="fuel" data-testid="pirep-fuel">
            <sb-fuel-converter testId="fuel-converter" [fuelType]="booking().aircraftEngine === 'Piston' ? 'AVGAS' : 'JET'" (use)="form.controls.fuel.setValue($event)" />
          </div>
        </div>
        <label class="block text-sm">
          <span class="text-muted">Landing rate (fpm)</span>
          <input type="number" min="0" max="5000" class="sb-input mt-1 font-mono" formControlName="landingRate" data-testid="pirep-landing-rate">
        </label>
        <label class="block text-sm sm:col-span-2">
          <span class="text-muted">Remarks</span>
          <textarea rows="2" maxlength="500" class="sb-input mt-1" formControlName="remarks" data-testid="pirep-remarks"></textarea>
        </label>
      </div>

      @if (error(); as message) {
        <p class="sb-error mt-3" data-testid="pirep-error">{{ message }}</p>
      }

      <button type="submit" class="sb-btn-primary mt-4 w-auto px-5" [disabled]="saving()" data-testid="file-pirep">File PIREP</button>
    </form>
  `
})
export class PirepForm implements OnInit {
  private readonly pireps = inject(PirepService);

  readonly booking = input.required<Booking>();
  readonly filed = output<PirepFiled>();

  protected readonly form = new FormGroup({
    departed: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    arrived: new FormControl(toUtcInput(new Date()), { nonNullable: true, validators: [Validators.required] }),
    fuel: new FormControl<number | null>(null),
    landingRate: new FormControl<number | null>(null),
    remarks: new FormControl('', { nonNullable: true })
  });
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly times = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  protected readonly leg = computed(() => {
    const leg = currentLeg(this.booking());
    return leg ? `${leg.origin} → ${leg.destination}` : '';
  });

  protected readonly startedLabel = computed(() => this.zulu(this.booking().legStartedAtUtc, 0));
  protected readonly earliestLabel = computed(() => this.zulu(this.booking().legStartedAtUtc, -30));

  protected readonly duration = computed(() => {
    const departed = fromUtcInput(this.times().departed ?? '');
    const arrived = fromUtcInput(this.times().arrived ?? '');
    if (!departed || !arrived) return '—';
    const minutes = Math.round((new Date(arrived).getTime() - new Date(departed).getTime()) / 60000);
    return minutes > 0 ? durationLabel(minutes) : '—';
  });

    private zulu(value: string | null, offsetMinutes: number): string {
    if (!value) return '--:--Z';
    const date = new Date(new Date(value).getTime() + offsetMinutes * 60_000);
    return `${toUtcInput(date).slice(11)}Z`;
  }

  ngOnInit(): void {
    const started = this.booking().legStartedAtUtc;
    if (started) this.form.controls.departed.setValue(toUtcInput(new Date(started)));
    const plan = this.booking().flightPlan;
    if (plan) this.form.controls.fuel.setValue(Math.max(0, plan.blockFuelKg - plan.landingFuelKg));
  }

  protected submit(): void {
    const value = this.form.getRawValue();
    const departedAtUtc = fromUtcInput(value.departed);
    const arrivedAtUtc = fromUtcInput(value.arrived);
    if (!departedAtUtc || !arrivedAtUtc) {
      this.error.set('Enter the takeoff and landing times.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.pireps
      .file({
        departedAtUtc,
        arrivedAtUtc,
        fuelUsedKg: value.fuel,
        landingRateFpm: value.landingRate,
        remarks: value.remarks.trim() || null
      })
      .subscribe({
        next: result => {
          this.saving.set(false);
          this.filed.emit(result);
        },
        error: error => {
          this.saving.set(false);
          this.error.set(problemMessages(error)[0]);
        }
      });
  }
}