import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Booking } from '../../core/bookings/booking.models';
import { problemMessages } from '../../core/http/problem';
import { PirepFiled } from '../../core/pireps/pirep.models';
import { PirepService } from '../../core/pireps/pirep.service';
import { durationLabel, fromUtcInput, toUtcInput } from '../../shared/time/utc';

@Component({
  selector: 'sb-pirep-form',
  imports: [ReactiveFormsModule],
  template: `
    <form class="rounded-lg border border-line p-4" [formGroup]="form" (ngSubmit)="submit()" data-testid="pirep-form">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="font-semibold">PIREP · leg {{ booking().currentLeg }} · {{ leg() }}</h3>
        <span class="font-mono text-sm text-muted" data-testid="pirep-duration">{{ duration() }}</span>
      </div>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <label class="block text-sm">
          <span class="text-muted">Takeoff (UTC)</span>
          <input type="datetime-local" class="sb-input mt-1 font-mono" formControlName="departed" data-testid="pirep-departed">
        </label>
        <label class="block text-sm">
          <span class="text-muted">Landing (UTC)</span>
          <input type="datetime-local" class="sb-input mt-1 font-mono" formControlName="arrived" data-testid="pirep-arrived">
        </label>
        <label class="block text-sm">
          <span class="text-muted">Fuel used (kg)</span>
          <input type="number" min="0" class="sb-input mt-1 font-mono" formControlName="fuel" data-testid="pirep-fuel">
        </label>
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
    const current = this.booking();
    const leg = current.job?.legs.find(l => l.sequence === current.currentLeg);
    return leg ? `${leg.origin} → ${leg.destination}` : '';
  });

  protected readonly duration = computed(() => {
    const departed = fromUtcInput(this.times().departed ?? '');
    const arrived = fromUtcInput(this.times().arrived ?? '');
    if (!departed || !arrived) return '—';
    const minutes = Math.round((new Date(arrived).getTime() - new Date(departed).getTime()) / 60000);
    return minutes > 0 ? durationLabel(minutes) : '—';
  });

  ngOnInit(): void {
    const started = this.booking().legStartedAtUtc;
    if (started) this.form.controls.departed.setValue(toUtcInput(new Date(started)));
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