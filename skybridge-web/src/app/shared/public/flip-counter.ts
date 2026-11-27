import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'sb-flip-counter',
  host: { class: 'inline-flex gap-1.5' },
  template: `
    @for (digit of digits(); track $index) {
      <span class="relative grid place-items-center overflow-hidden rounded-md border border-line bg-surface-2 font-mono font-semibold shadow-lg shadow-black/30"
        [class]="size() === 'lg' ? 'h-16 w-12 text-4xl' : 'h-11 w-8 text-2xl'" data-testid="digit">
        {{ digit }}
        <span class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-background/70"></span>
      </span>
    }
  `
})
export class FlipCounter {
  readonly value = input<number | null>(null);
  readonly minDigits = input(3);
  readonly size = input<'md' | 'lg'>('md');

  protected readonly digits = computed(() => {
    const value = this.value();
    if (value === null || value < 0) return Array.from({ length: this.minDigits() }, () => '–');
    return String(Math.floor(value)).padStart(this.minDigits(), '0').split('');
  });
}