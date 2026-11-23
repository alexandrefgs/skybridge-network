import { Component, effect, inject, input, output } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AirlineInput } from '../../core/airlines/airline.models';

@Component({
  selector: 'sb-airline-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate data-testid="airline-form">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div class="lg:col-span-2">
          <label class="sb-label" for="name">Name</label>
          <input class="sb-input" id="name" maxlength="100" formControlName="name">
          @if (fieldError('name'); as message) {
            <p class="sb-field-error" data-testid="error-name">{{ message }}</p>
          }
        </div>
        <div>
          <label class="sb-label" for="icaoCode">ICAO</label>
          <input class="sb-input font-mono uppercase" id="icaoCode" maxlength="3" formControlName="icaoCode">
          @if (fieldError('icaoCode'); as message) {
            <p class="sb-field-error" data-testid="error-icaoCode">{{ message }}</p>
          }
        </div>
        <div>
          <label class="sb-label" for="iataCode">IATA</label>
          <input class="sb-input font-mono uppercase" id="iataCode" maxlength="2" formControlName="iataCode">
          @if (fieldError('iataCode'); as message) {
            <p class="sb-field-error" data-testid="error-iataCode">{{ message }}</p>
          }
        </div>
        <div>
          <label class="sb-label" for="callsign">Callsign</label>
          <input class="sb-input font-mono uppercase" id="callsign" maxlength="60" formControlName="callsign">
        </div>
        <div>
          <label class="sb-label" for="country">Country</label>
          <input class="sb-input" id="country" maxlength="60" formControlName="country">
        </div>
      </div>

      <label class="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" class="accent-primary" formControlName="isActive" data-testid="is-active">
        Active airline
      </label>

      @for (message of errors(); track message) {
        <p class="sb-error mt-4" data-testid="airline-form-error">{{ message }}</p>
      }

      <div class="mt-5 flex gap-3">
        <button type="submit" class="sb-btn-primary w-auto px-5" [disabled]="saving()">Save</button>
        @if (cancellable()) {
          <button type="button" class="sb-btn-secondary w-auto px-5" (click)="cancelled.emit()">Cancel</button>
        }
      </div>
    </form>
  `
})
export class AirlineForm {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly airline = input<AirlineInput | null>(null);
  readonly errors = input<string[]>([]);
  readonly saving = input(false);
  readonly cancellable = input(true);
  readonly saved = output<AirlineInput>();
  readonly cancelled = output<void>();

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    icaoCode: ['', Validators.pattern(/^[A-Za-z]{3}$/)],
    iataCode: ['', Validators.pattern(/^[A-Za-z0-9]{2}$/)],
    callsign: [''],
    country: [''],
    isActive: [true]
  });

  constructor() {
    effect(() => {
      const airline = this.airline();
      this.form.reset({
        name: airline?.name ?? '',
        icaoCode: airline?.icaoCode ?? '',
        iataCode: airline?.iataCode ?? '',
        callsign: airline?.callsign ?? '',
        country: airline?.country ?? '',
        isActive: airline?.isActive ?? true
      });
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const optional = (text: string) => (text.trim() ? text.trim() : null);
    this.saved.emit({
      name: value.name.trim(),
      icaoCode: optional(value.icaoCode)?.toUpperCase() ?? null,
      iataCode: optional(value.iataCode)?.toUpperCase() ?? null,
      callsign: optional(value.callsign)?.toUpperCase() ?? null,
      country: optional(value.country),
      isActive: value.isActive
    });
  }

  protected fieldError(name: 'name' | 'icaoCode' | 'iataCode'): string | null {
    const control: AbstractControl = this.form.controls[name];
    if (!control.touched || !control.errors) return null;
    if (control.errors['required']) return 'Required.';
    if (control.errors['pattern']) return name === 'icaoCode' ? 'Use 3 letters.' : 'Use 2 letters or digits.';
    if (control.errors['maxlength']) return `Use at most ${control.errors['maxlength'].requiredLength} characters.`;
    return 'Invalid value.';
  }
}