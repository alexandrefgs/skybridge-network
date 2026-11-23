import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormArray, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  DangerousGood,
  DangerousGoodClass,
  FreelanceJob,
  FreelanceJobInput,
  FreelanceJobKind,
  FreelanceLeg
} from '../../core/freelance/freelance.models';
import { HAZARD_CLASSES, MISSION_KINDS } from '../../shared/freelance/missions';

const DEFAULT_DAYS = 3;
const MAX_LEGS = 8;
const AIRPORT = /^[A-Za-z0-9-]{3,10}$/;

export function toLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

@Component({
  selector: 'sb-freelance-job-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate data-testid="job-form">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label class="sb-label" for="job-kind">Mission</label>
          <select class="sb-input" id="job-kind" formControlName="kind">
            @for (kind of kinds; track kind.value) {
              <option [value]="kind.value">{{ kind.label }}</option>
            }
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="sb-label" for="job-client">Client</label>
          <input class="sb-input" id="job-client" maxlength="100" placeholder="Who hired the flight" formControlName="client">
        </div>
        <div>
          <label class="sb-label" for="job-expires">Expires</label>
          <input class="sb-input font-mono" id="job-expires" type="datetime-local" formControlName="expiresAt">
        </div>

        <div class="sm:col-span-2 lg:col-span-3">
          <label class="sb-label" for="job-briefing">Briefing</label>
          <textarea class="sb-input min-h-28" id="job-briefing" maxlength="4000" placeholder="Why this flight exists, what the crew should expect…" formControlName="briefing"></textarea>
        </div>
        <div>
          <label class="sb-label" for="job-reward">Reward (SB$)</label>
          <input class="sb-input font-mono" id="job-reward" type="number" min="0" formControlName="reward">
        </div>
      </div>

      <div class="mt-6 space-y-4" formArrayName="legs">
        @for (leg of legs.controls; track leg; let i = $index) {
          <fieldset class="rounded-lg border border-line p-4" [formGroupName]="i" [attr.data-testid]="'leg-form-' + i">
            <div class="mb-3 flex items-center justify-between">
              <legend class="text-sm font-semibold">Leg {{ i + 1 }}</legend>
              @if (legs.length > 1) {
                <button type="button" class="text-xs text-muted hover:text-primary" (click)="removeLeg(i)" [attr.data-testid]="'remove-leg-' + i">Remove leg</button>
              }
            </div>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label class="sb-label" [for]="'leg-origin-' + i">Origin</label>
                <input class="sb-input font-mono uppercase" [id]="'leg-origin-' + i" maxlength="10" placeholder="SBFL" formControlName="origin">
              </div>
              <div>
                <label class="sb-label" [for]="'leg-destination-' + i">Destination</label>
                <input class="sb-input font-mono uppercase" [id]="'leg-destination-' + i" maxlength="10" placeholder="SBGR" formControlName="destination">
              </div>
              <div>
                <label class="sb-label" [for]="'leg-passengers-' + i">Passengers</label>
                <input class="sb-input font-mono" [id]="'leg-passengers-' + i" type="number" min="0" max="1000" formControlName="passengerCount">
              </div>
              <div>
                <label class="sb-label" [for]="'leg-cargo-' + i">Cargo (kg)</label>
                <input class="sb-input font-mono" [id]="'leg-cargo-' + i" type="number" min="0" formControlName="cargoKg">
              </div>
              <div class="sm:col-span-2 lg:col-span-4">
                <label class="sb-label" [for]="'leg-names-' + i">Passenger names</label>
                <textarea class="sb-input min-h-20" [id]="'leg-names-' + i" placeholder="One per line (optional)" formControlName="passengerNames"></textarea>
              </div>
            </div>

            <div class="mt-4">
              <div class="flex items-center justify-between">
                <span class="sb-label">Dangerous goods</span>
                <button type="button" class="text-sm text-muted hover:text-primary" (click)="addGood(i)" [attr.data-testid]="'add-good-' + i">+ Add item</button>
              </div>
              <div formArrayName="dangerousGoods" class="space-y-2">
                @for (good of goodsOf(i).controls; track good; let g = $index) {
                  <div class="grid gap-2 sm:grid-cols-[1fr_14rem_7rem_7rem_auto]" [formGroupName]="g" [attr.data-testid]="'good-' + i + '-' + g">
                    <input class="sb-input" placeholder="Name" maxlength="80" formControlName="name">
                    <select class="sb-input" formControlName="class">
                      @for (hazard of hazards; track hazard.value) {
                        <option [value]="hazard.value">Class {{ hazard.code }} · {{ hazard.label }}</option>
                      }
                    </select>
                    <input class="sb-input font-mono" type="number" min="0" placeholder="kg" formControlName="quantityKg">
                    <input class="sb-input font-mono uppercase" placeholder="UN1203" maxlength="8" formControlName="unNumber">
                    <button type="button" class="text-muted hover:text-primary" (click)="goodsOf(i).removeAt(g)" aria-label="Remove item">×</button>
                  </div>
                } @empty {
                  <p class="text-xs text-muted">None declared.</p>
                }
              </div>
            </div>
          </fieldset>
        }
        @if (legs.length < maxLegs) {
          <button type="button" class="sb-btn-secondary w-auto px-4" (click)="addLeg()" data-testid="add-leg">+ Add leg</button>
        }
      </div>

      <div class="mt-5">
        <span class="sb-label">Allowed aircraft</span>
        <div class="flex flex-wrap items-center gap-2" data-testid="job-aircraft">
          @for (code of aircraft(); track code) {
            <button type="button" class="rounded-md border border-primary px-3 py-1.5 font-mono text-xs text-primary" (click)="removeAircraft(code)"
              [attr.data-testid]="'job-aircraft-' + code">{{ code }} ×</button>
          }
          <select class="sb-input w-40 py-1.5 text-xs" (change)="addAircraft($any($event.target))" data-testid="add-aircraft">
            <option value="">Add type…</option>
            @for (code of catalog(); track code) {
              @if (!aircraft().includes(code)) {
                <option [value]="code">{{ code }}</option>
              }
            }
          </select>
        </div>
      </div>

      @if (invalidMessage(); as message) {
        <p class="sb-field-error mt-4" data-testid="job-form-invalid">{{ message }}</p>
      }
      @for (message of errors(); track message) {
        <p class="sb-error mt-4" data-testid="job-form-error">{{ message }}</p>
      }

      <div class="mt-5 flex gap-3">
        <button type="submit" class="sb-btn-primary w-auto px-5" [disabled]="saving()">Save job</button>
        <button type="button" class="sb-btn-secondary w-auto px-5" (click)="cancelled.emit()">Cancel</button>
      </div>
    </form>
  `
})
export class FreelanceJobForm {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly job = input<FreelanceJob | null>(null);
  readonly catalog = input<string[]>([]);
  readonly errors = input<string[]>([]);
  readonly saving = input(false);
  readonly saved = output<FreelanceJobInput>();
  readonly cancelled = output<void>();

  protected readonly kinds = MISSION_KINDS;
  protected readonly hazards = HAZARD_CLASSES;
  protected readonly maxLegs = MAX_LEGS;
  protected readonly aircraft = signal<string[]>([]);
  protected readonly invalidMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    kind: ['Charter' as FreelanceJobKind],
    expiresAt: ['', Validators.required],
    client: [''],
    briefing: [''],
    reward: [0, Validators.min(0)],
    legs: this.fb.array<ReturnType<FreelanceJobForm['legGroup']>>([])
  });

  protected get legs(): FormArray<ReturnType<FreelanceJobForm['legGroup']>> {
    return this.form.controls.legs;
  }

  constructor() {
    effect(() => {
      const job = this.job();
      const expires = job ? new Date(job.expiresAtUtc) : new Date(Date.now() + DEFAULT_DAYS * 86_400_000);
      this.legs.clear();
      for (const leg of job?.legs ?? [undefined]) this.legs.push(this.legGroup(leg));
      this.form.patchValue({
        kind: job?.kind ?? 'Charter',
        expiresAt: toLocalInput(expires),
        client: job?.client ?? '',
        briefing: job?.briefing ?? '',
        reward: job?.reward ?? 0
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
      this.invalidMessage.set(null);
      this.aircraft.set([...(job?.aircraft ?? [])]);
    });
  }

  protected goodsOf(index: number): FormArray<ReturnType<FreelanceJobForm['goodGroup']>> {
    return this.legs.at(index).controls.dangerousGoods;
  }

  protected addLeg(): void {
    const previous = this.legs.at(this.legs.length - 1)?.controls.destination.value ?? '';
    const leg = this.legGroup();
    leg.controls.origin.setValue(previous);
    this.legs.push(leg);
  }

  protected removeLeg(index: number): void {
    this.legs.removeAt(index);
  }

  protected addGood(index: number): void {
    this.goodsOf(index).push(this.goodGroup());
  }

  protected addAircraft(select: HTMLSelectElement): void {
    if (select.value) this.aircraft.update(list => [...list, select.value].sort());
    select.value = '';
  }

  protected removeAircraft(code: string): void {
    this.aircraft.update(list => list.filter(c => c !== code));
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.invalidMessage.set('Fill in the expiry and the ICAO code of every origin and destination.');
      return;
    }
    this.invalidMessage.set(null);
    const value = this.form.getRawValue();
    this.saved.emit({
      kind: value.kind,
      expiresAtUtc: new Date(value.expiresAt).toISOString(),
      client: value.client.trim() || null,
      briefing: value.briefing.trim() || null,
      reward: value.reward ?? 0,
      aircraft: this.aircraft(),
      legs: value.legs.map(leg => ({
        origin: leg.origin.trim().toUpperCase(),
        destination: leg.destination.trim().toUpperCase(),
        passengerCount: leg.passengerCount ?? 0,
        cargoKg: leg.cargoKg ?? 0,
        passengerNames: leg.passengerNames.split('\n').map(name => name.trim()).filter(name => name.length > 0),
        dangerousGoods: leg.dangerousGoods
          .filter(good => good.name.trim())
          .map(good => ({
            name: good.name.trim(),
            class: good.class,
            quantityKg: good.quantityKg ?? 0,
            unNumber: good.unNumber.trim() ? good.unNumber.trim().toUpperCase() : null
          }))
      }))
    });
  }

  private legGroup(leg?: FreelanceLeg) {
    return this.fb.group({
      origin: [leg?.origin ?? '', [Validators.required, Validators.pattern(AIRPORT)]],
      destination: [leg?.destination ?? '', [Validators.required, Validators.pattern(AIRPORT)]],
      passengerCount: [leg?.passengerCount ?? 0, [Validators.min(0), Validators.max(1000)]],
      cargoKg: [leg?.cargoKg ?? 0, Validators.min(0)],
      passengerNames: [leg?.passengerNames.join('\n') ?? ''],
      dangerousGoods: this.fb.array((leg?.dangerousGoods ?? []).map(good => this.goodGroup(good)))
    });
  }

  private goodGroup(good?: DangerousGood) {
    return this.fb.group({
      name: [good?.name ?? '', Validators.maxLength(80)],
      class: [good?.class ?? ('FlammableLiquids' as DangerousGoodClass)],
      quantityKg: [good?.quantityKg ?? 0, Validators.min(0)],
      unNumber: [good?.unNumber ?? '']
    });
  }
}