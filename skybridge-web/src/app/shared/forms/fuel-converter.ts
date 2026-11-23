import { DecimalPipe } from '@angular/common';
import { Component, ElementRef, HostListener, computed, inject, input, linkedSignal, output, signal } from '@angular/core';

export type FuelUnit = 'KG' | 'LB' | 'GAL';
export type FuelType = 'JET' | 'AVGAS';

export const KG_PER_LB = 0.45359237;
export const LB_PER_GALLON: Record<FuelType, number> = { JET: 6.7, AVGAS: 6.0 };

export function toKilograms(value: number, unit: FuelUnit, fuel: FuelType): number {
  if (unit === 'KG') return value;
  const pounds = unit === 'LB' ? value : value * LB_PER_GALLON[fuel];
  return pounds * KG_PER_LB;
}

@Component({
  selector: 'sb-fuel-converter',
  imports: [DecimalPipe],
  host: { class: 'relative inline-block' },
  template: `
    <button type="button" class="flex h-full items-center gap-1.5 rounded-md border border-line bg-surface-2 px-3 font-mono text-xs text-muted transition-colors hover:border-primary hover:text-primary"
      [class.border-primary]="open()" [class.text-primary]="open()" (click)="open.set(!open())" [attr.data-testid]="testId()" title="Convert fuel units">
      ⇄ <span class="tracking-wider">LB/GAL</span>
    </button>

    @if (open()) {
      <div class="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-line bg-surface p-4 shadow-2xl shadow-black/40" [attr.data-testid]="testId() + '-panel'">
        <p class="font-mono text-[10px] tracking-[0.2em] text-muted">FUEL CONVERTER</p>

        <input type="number" min="0" step="any" class="sb-input mt-3 font-mono" placeholder="0" [value]="amount() ?? ''"
          (input)="setAmount($any($event.target).value)" [attr.data-testid]="testId() + '-amount'">
        <div class="mt-2 grid grid-cols-3 overflow-hidden rounded-md border border-line font-mono text-xs">
          @for (option of units; track option) {
            <button type="button" class="py-1.5 transition-colors" [class]="unit() === option ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-foreground'"
              (click)="unit.set(option)" [attr.data-testid]="testId() + '-unit-' + option">{{ option === 'GAL' ? 'US GAL' : option }}</button>
          }
        </div>

        <div class="mt-3 flex items-center justify-between font-mono text-[11px]">
          <span class="text-muted">Density</span>
          <div class="flex overflow-hidden rounded-md border border-line">
            @for (option of fuels; track option.type) {
              <button type="button" class="px-2.5 py-1 transition-colors" [class]="fuel() === option.type ? 'bg-surface-2 text-foreground' : 'text-muted hover:text-foreground'"
                (click)="fuel.set(option.type)" [attr.data-testid]="testId() + '-fuel-' + option.type">{{ option.label }}</button>
            }
          </div>
        </div>

        <dl class="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-line bg-surface-2/50 p-3 text-center font-mono" [attr.data-testid]="testId() + '-result'">
          <div>
            <dt class="text-[10px] tracking-wider text-muted">KG</dt>
            <dd class="text-sm font-semibold text-primary">{{ kilograms() | number: '1.0-0' }}</dd>
          </div>
          <div>
            <dt class="text-[10px] tracking-wider text-muted">LB</dt>
            <dd class="text-sm font-semibold">{{ pounds() | number: '1.0-0' }}</dd>
          </div>
          <div>
            <dt class="text-[10px] tracking-wider text-muted">US GAL</dt>
            <dd class="text-sm font-semibold">{{ gallons() | number: '1.0-1' }}</dd>
          </div>
        </dl>

        <p class="mt-2 font-mono text-[10px] text-muted">{{ densityLabel() }}</p>

        <button type="button" class="sb-btn-primary mt-4 py-1.5 text-xs" [disabled]="amount() === null" (click)="apply()" [attr.data-testid]="testId() + '-use'">
          Use {{ kilograms() | number: '1.0-0' }} kg
        </button>
      </div>
    }
  `
})
export class FuelConverter {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly testId = input('fuel-converter');
  readonly fuelType = input<FuelType>('JET');
  readonly use = output<number>();

  protected readonly units: FuelUnit[] = ['KG', 'LB', 'GAL'];
  protected readonly fuels: { type: FuelType; label: string }[] = [
    { type: 'JET', label: 'Jet A-1' },
    { type: 'AVGAS', label: 'AvGas' }
  ];
  protected readonly open = signal(false);
  protected readonly amount = signal<number | null>(null);
  protected readonly unit = signal<FuelUnit>('LB');
  protected readonly fuel = linkedSignal(() => this.fuelType());

  protected readonly kilograms = computed(() => toKilograms(this.amount() ?? 0, this.unit(), this.fuel()));
  protected readonly pounds = computed(() => this.kilograms() / KG_PER_LB);
  protected readonly gallons = computed(() => this.pounds() / LB_PER_GALLON[this.fuel()]);
  protected readonly densityLabel = computed(() => `${LB_PER_GALLON[this.fuel()].toFixed(1)} lb per US gallon · 1 lb = 0.4536 kg`);

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.open.set(false);
  }

  protected setAmount(text: string): void {
    const value = Number(text);
    this.amount.set(text.trim() === '' || Number.isNaN(value) || value < 0 ? null : value);
  }

  protected apply(): void {
    this.use.emit(Math.round(this.kilograms()));
    this.open.set(false);
  }
}