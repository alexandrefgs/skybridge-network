import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AirlineRoute, RouteInput } from '../../core/airlines/airline.models';

@Component({
  selector: 'sb-route-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate data-testid="route-form">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <label class="sb-label" for="origin">Origin</label>
          <input class="sb-input font-mono uppercase" id="origin" maxlength="10" placeholder="SBFL" formControlName="origin">
          @if (fieldError('origin'); as message) {
            <p class="sb-field-error" data-testid="error-origin">{{ message }}</p>
          }
        </div>
        <div>
          <label class="sb-label" for="destination">Destination</label>
          <input class="sb-input font-mono uppercase" id="destination" maxlength="10" placeholder="SBGR" formControlName="destination">
          @if (fieldError('destination'); as message) {
            <p class="sb-field-error" data-testid="error-destination">{{ message }}</p>
          }
        </div>
        <div>
          <label class="sb-label" for="flightLevel">FL</label>
          <input class="sb-input font-mono" id="flightLevel" type="number" min="10" max="600" placeholder="370" formControlName="flightLevel">
          @if (fieldError('flightLevel'); as message) {
            <p class="sb-field-error" data-testid="error-flightLevel">{{ message }}</p>
          }
        </div>
        <div class="sm:col-span-2 lg:col-span-3">
          <label class="sb-label" for="atsRoute">Route</label>
          <input class="sb-input font-mono uppercase" id="atsRoute" maxlength="500" placeholder="NIBRU UZ171 KEVUN" formControlName="atsRoute">
        </div>
      </div>

      <div class="mt-4">
        <span class="sb-label">Aircraft</span>
        <div class="flex flex-wrap items-center gap-2" data-testid="route-aircraft">
          @for (code of choices(); track code) {
            <button type="button" (click)="toggle(code)"
              class="rounded-md border px-3 py-1.5 font-mono text-xs transition-colors"
              [class.border-primary]="selected().has(code)"
              [class.text-primary]="selected().has(code)"
              [class.border-line]="!selected().has(code)"
              [class.text-muted]="!selected().has(code)"
              [attr.aria-pressed]="selected().has(code)"
              [attr.data-testid]="'aircraft-' + code">{{ code }}</button>
          }
          <select class="sb-input w-40 py-1.5 text-xs" (change)="addOther($any($event.target))" data-testid="other-aircraft">
            <option value="">Other type…</option>
            @for (code of others(); track code) {
              <option [value]="code">{{ code }}</option>
            }
          </select>
        </div>
      </div>

      @for (message of errors(); track message) {
        <p class="sb-error mt-4" data-testid="route-form-error">{{ message }}</p>
      }

      <div class="mt-5 flex gap-3">
        <button type="submit" class="sb-btn-primary w-auto px-5" [disabled]="saving()">Save route</button>
        <button type="button" class="sb-btn-secondary w-auto px-5" (click)="cancelled.emit()">Cancel</button>
      </div>
    </form>
  `
})
export class RouteForm {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly route = input<AirlineRoute | null>(null);
  readonly fleet = input<string[]>([]);
  readonly catalog = input<string[]>([]);
  readonly errors = input<string[]>([]);
  readonly saving = input(false);
  readonly saved = output<RouteInput>();
  readonly cancelled = output<void>();

  protected readonly selected = signal(new Set<string>());
  protected readonly choices = computed(() => [...new Set([...this.fleet(), ...this.selected()])].sort());
  protected readonly others = computed(() => this.catalog().filter(code => !this.choices().includes(code)));

  protected readonly form = this.fb.group({
    origin: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{3,10}$/)]],
    destination: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{3,10}$/)]],
    flightLevel: this.fb.control<number | null>(null, [Validators.min(10), Validators.max(600)]),
    atsRoute: ['', Validators.maxLength(500)]
  });

  constructor() {
    effect(() => {
      const route = this.route();
      this.form.reset({
        origin: route?.origin ?? '',
        destination: route?.destination ?? '',
        flightLevel: route?.flightLevel ?? null,
        atsRoute: route?.atsRoute ?? ''
      });
      if (route) {
        this.form.controls.origin.disable();
        this.form.controls.destination.disable();
      } else {
        this.form.controls.origin.enable();
        this.form.controls.destination.enable();
      }
      this.selected.set(new Set(route?.aircraft ?? []));
    });
  }

  protected toggle(code: string): void {
    this.selected.update(current => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  protected addOther(select: HTMLSelectElement): void {
    if (select.value) this.toggle(select.value);
    select.value = '';
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saved.emit({
      origin: value.origin.trim().toUpperCase(),
      destination: value.destination.trim().toUpperCase(),
      aircraft: [...this.selected()].sort(),
      atsRoute: value.atsRoute.trim() ? value.atsRoute.trim().toUpperCase() : null,
      flightLevel: value.flightLevel
    });
  }

  protected fieldError(name: 'origin' | 'destination' | 'flightLevel'): string | null {
    const control: AbstractControl = this.form.controls[name];
    if (!control.touched || !control.errors) return null;
    if (control.errors['required']) return 'Required.';
    if (control.errors['pattern']) return 'Use the airport ICAO code.';
    if (control.errors['min']) return 'Must be at least 10.';
    if (control.errors['max']) return 'Must be at most 600.';
    return 'Invalid value.';
  }
}