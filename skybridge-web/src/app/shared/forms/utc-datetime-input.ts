import { Component, ElementRef, HostListener, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { fromUtcInput, toUtcInput } from '../time/utc';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const MINUTE = 60_000;
const pad = (value: number) => String(value).padStart(2, '0');

interface CalendarDay {
  key: string;
  day: number;
  year: number;
  month: number;
  inMonth: boolean;
}

@Component({
  selector: 'sb-utc-datetime-input',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UtcDateTimeInput), multi: true }],
  host: { class: 'relative block' },
  template: `
    <button type="button" [id]="inputId()"
      class="flex w-full items-center gap-3 rounded-md border bg-surface-2 px-3 py-2.5 text-left font-mono text-sm transition-colors"
      [class.border-primary]="open()" [class.border-line]="!open()" [class.ring-1]="open()" [class.ring-primary]="open()"
      [disabled]="disabled()" (click)="toggle()" [attr.data-testid]="testId()" [attr.aria-expanded]="open()">
      @if (value(); as date) {
        <span class="tracking-wide">{{ dateLabel(date) }}</span>
        <span class="h-4 w-px bg-line"></span>
        <span class="text-base font-semibold tracking-wider">{{ timeLabel(date) }}</span>
        <span class="rounded bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">Z</span>
      } @else {
        <span class="text-muted">--- --- ---- · --:--</span>
      }
      <span class="ml-auto text-[10px] tracking-[0.2em] text-muted">UTC</span>
    </button>

    @if (open()) {
      <div class="absolute left-0 z-30 mt-2 flex w-[34rem] max-w-[calc(100vw-2rem)] flex-wrap overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-black/40"
        [attr.data-testid]="testId() + '-panel'">
        <div class="min-w-64 flex-1 p-4">
          <div class="flex items-center justify-between">
            <button type="button" class="rounded-md px-2 py-1 text-muted hover:bg-surface-2 hover:text-foreground" (click)="shiftMonth(-1)" aria-label="Previous month" [attr.data-testid]="testId() + '-prev'">‹</button>
            <span class="font-mono text-sm font-semibold tracking-[0.2em]" [attr.data-testid]="testId() + '-month'">{{ monthLabel() }}</span>
            <button type="button" class="rounded-md px-2 py-1 text-muted hover:bg-surface-2 hover:text-foreground" (click)="shiftMonth(1)" aria-label="Next month" [attr.data-testid]="testId() + '-next'">›</button>
          </div>

          <div class="mt-3 grid grid-cols-7 gap-1 text-center font-mono">
            @for (weekday of weekdays; track weekday) {
              <span class="pb-1 text-[10px] tracking-wider text-muted">{{ weekday }}</span>
            }
            @for (day of days(); track day.key) {
              <button type="button" class="relative h-8 rounded-md text-xs transition-colors" [class]="dayClass(day)"
                (click)="pickDay(day)" [attr.data-testid]="testId() + '-day-' + day.key">
                {{ day.day }}
                @if (isToday(day) && !isSelected(day)) {
                  <span class="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"></span>
                }
              </button>
            }
          </div>
        </div>

        <div class="flex w-full flex-col border-t border-line bg-surface-2/50 p-4 sm:w-52 sm:border-l sm:border-t-0">
          <p class="font-mono text-[10px] tracking-[0.2em] text-muted">ZULU TIME</p>

          <div class="mt-3 flex items-center justify-center gap-2 font-mono">
            <div class="flex flex-col items-center">
              <button type="button" class="px-3 text-muted hover:text-primary" (click)="adjust(60)" aria-label="Next hour" [attr.data-testid]="testId() + '-hour-up'">▲</button>
              <span class="text-3xl font-semibold" [attr.data-testid]="testId() + '-hours'">{{ hours() }}</span>
              <button type="button" class="px-3 text-muted hover:text-primary" (click)="adjust(-60)" aria-label="Previous hour">▼</button>
            </div>
            <span class="pb-1 text-3xl text-primary">:</span>
            <div class="flex flex-col items-center">
              <button type="button" class="px-3 text-muted hover:text-primary" (click)="adjust(1)" aria-label="Next minute" [attr.data-testid]="testId() + '-minute-up'">▲</button>
              <span class="text-3xl font-semibold" [attr.data-testid]="testId() + '-minutes'">{{ minutes() }}</span>
              <button type="button" class="px-3 text-muted hover:text-primary" (click)="adjust(-1)" aria-label="Previous minute" [attr.data-testid]="testId() + '-minute-down'">▼</button>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-4 gap-1 font-mono text-[11px]">
            @for (step of steps; track step) {
              <button type="button" class="rounded border border-line py-1 text-muted hover:border-primary hover:text-primary" (click)="adjust(step)">
                {{ step > 0 ? '+' : '−' }}{{ step < 0 ? -step : step }}
              </button>
            }
          </div>

          <label class="mt-3 block">
            <span class="font-mono text-[10px] tracking-[0.2em] text-muted">TYPE HHMM</span>
            <input class="sb-input mt-1 py-1.5 text-center font-mono tracking-[0.3em]" inputmode="numeric" maxlength="4" placeholder="1938"
              [value]="typed()" (input)="type($any($event.target).value)" [attr.data-testid]="testId() + '-typed'">
          </label>

          <p class="mt-3 font-mono text-[11px] text-muted" [attr.data-testid]="testId() + '-local'">{{ localLabel() }}</p>

          <div class="mt-auto flex gap-2 pt-4">
            <button type="button" class="sb-btn-secondary py-1.5 text-xs" (click)="now()" [attr.data-testid]="testId() + '-now'">Now</button>
            <button type="button" class="sb-btn-primary py-1.5 text-xs" (click)="close()" [attr.data-testid]="testId() + '-done'">Done</button>
          </div>
        </div>
      </div>
    }
  `
})
export class UtcDateTimeInput implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly testId = input('utc-datetime');
  readonly inputId = input<string | null>(null);

  protected readonly weekdays = WEEKDAYS;
  protected readonly steps = [-15, -5, 5, 15];
  protected readonly value = signal<Date | null>(null);
  protected readonly open = signal(false);
  protected readonly disabled = signal(false);
  protected readonly typed = signal('');
  protected readonly view = signal({ year: 2026, month: 0 });

  protected readonly monthLabel = computed(() => `${MONTHS[this.view().month]} ${this.view().year}`);
  protected readonly hours = computed(() => (this.value() ? pad(this.value()!.getUTCHours()) : '--'));
  protected readonly minutes = computed(() => (this.value() ? pad(this.value()!.getUTCMinutes()) : '--'));
  protected readonly localLabel = computed(() => {
    const date = this.value();
    if (!date) return '';
    const offset = -date.getTimezoneOffset() / 60;
    const sign = offset >= 0 ? '+' : '−';
    return `= ${pad(date.getHours())}:${pad(date.getMinutes())} local (UTC${sign}${Math.abs(offset)})`;
  });

  protected readonly days = computed<CalendarDay[]>(() => {
    const { year, month } = this.view();
    const first = new Date(Date.UTC(year, month, 1));
    const offset = (first.getUTCDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(Date.UTC(year, month, 1 - offset + index));
      return {
        key: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
        day: date.getUTCDate(),
        year: date.getUTCFullYear(),
        month: date.getUTCMonth(),
        inMonth: date.getUTCMonth() === month
      };
    });
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    const iso = value ? fromUtcInput(value) : null;
    const date = iso ? new Date(iso) : null;
    this.value.set(date);
    this.syncView(date ?? new Date());
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.close();
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.syncView(this.value() ?? new Date());
    this.typed.set('');
    this.open.set(true);
  }

  protected close(): void {
    this.open.set(false);
    this.onTouched();
  }

  protected shiftMonth(delta: number): void {
    this.view.update(({ year, month }) => {
      const date = new Date(Date.UTC(year, month + delta, 1));
      return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
    });
  }

  protected pickDay(day: CalendarDay): void {
    const current = this.value() ?? new Date();
    this.set(new Date(Date.UTC(day.year, day.month, day.day, current.getUTCHours(), current.getUTCMinutes())));
  }

  protected adjust(minutes: number): void {
    const current = this.value() ?? this.floorToMinute(new Date());
    this.set(new Date(current.getTime() + minutes * MINUTE));
  }

  protected type(text: string): void {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    this.typed.set(digits);
    if (digits.length !== 4) return;

    const hours = Number(digits.slice(0, 2));
    const minutes = Number(digits.slice(2));
    if (hours > 23 || minutes > 59) return;

    const current = this.value() ?? new Date();
    this.set(new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate(), hours, minutes)));
  }

  protected now(): void {
    this.set(this.floorToMinute(new Date()));
  }

  protected isSelected(day: CalendarDay): boolean {
    const date = this.value();
    return !!date && date.getUTCFullYear() === day.year && date.getUTCMonth() === day.month && date.getUTCDate() === day.day;
  }

  protected dayClass(day: CalendarDay): string {
    if (this.isSelected(day)) return 'bg-primary font-semibold text-primary-foreground';
    return day.inMonth ? 'hover:bg-surface-2' : 'text-muted opacity-50 hover:bg-surface-2';
  }

  protected isToday(day: CalendarDay): boolean {
    const today = new Date();
    return today.getUTCFullYear() === day.year && today.getUTCMonth() === day.month && today.getUTCDate() === day.day;
  }

  protected dateLabel(date: Date): string {
    return `${pad(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }

  protected timeLabel(date: Date): string {
    return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  }

  private set(date: Date): void {
    this.value.set(date);
    this.syncView(date);
    this.onChange(toUtcInput(date));
  }

  private syncView(date: Date): void {
    this.view.set({ year: date.getUTCFullYear(), month: date.getUTCMonth() });
  }

  private floorToMinute(date: Date): Date {
    return new Date(Math.floor(date.getTime() / MINUTE) * MINUTE);
  }
}