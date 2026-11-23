import { Component, ElementRef, booleanAttribute, forwardRef, input, output, signal, viewChildren } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'sb-code-input',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CodeInput), multi: true }],
  host: { class: 'block' },
  template: `
    <div class="flex justify-between gap-2" role="group" [attr.aria-label]="label()" (paste)="paste($event)">
      @for (digit of digits(); track $index) {
        <input #box
          class="h-14 w-full min-w-0 max-w-12 rounded-lg border border-line bg-surface-2 text-center font-mono text-2xl font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
          [class.border-primary]="invalid()"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          [attr.autocomplete]="$index === 0 ? 'one-time-code' : 'off'"
          [attr.aria-label]="'Digit ' + ($index + 1)"
          [attr.data-testid]="'code-digit-' + $index"
          [value]="digit"
          [disabled]="disabled()"
          (input)="typed($index, $any($event.target))"
          (keydown)="key($index, $event)"
          (focus)="$any($event.target).select()"
          (blur)="touched()">
      }
    </div>
  `
})
export class CodeInput implements ControlValueAccessor {
  readonly length = input(6);
  readonly label = input('Verification code');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly completed = output<string>();

  protected readonly digits = signal<string[]>(Array(6).fill(''));
  protected readonly disabled = signal(false);
  private readonly boxes = viewChildren<ElementRef<HTMLInputElement>>('box');

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    const chars = (value ?? '').replace(/\D/g, '').slice(0, this.length()).split('');
    const digits = Array.from({ length: this.length() }, (_, i) => chars[i] ?? '');
    this.digits.set(digits);
    this.boxes().forEach((box, i) => (box.nativeElement.value = digits[i] ?? ''));
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

  focus(): void {
    const first = this.digits().findIndex(d => !d);
    this.focusBox(first === -1 ? this.length() - 1 : first);
  }

  protected typed(index: number, box: HTMLInputElement): void {
    const value = box.value.replace(/\D/g, '');
    if (value.length > 1) {
      this.fill(index, value);
      return;
    }
    box.value = value;
    this.set(index, value);
    if (value) this.focusBox(index + 1);
  }

  protected key(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      event.preventDefault();
      this.set(index - 1, '');
      this.focusBox(index - 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.focusBox(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.focusBox(index + 1);
    }
  }

  protected paste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!/\d/.test(text)) return;
    event.preventDefault();
    const start = this.boxes().findIndex(box => box.nativeElement === document.activeElement);
    this.fill(Math.max(start, 0), text.replace(/\D/g, ''));
  }

  protected touched(): void {
    this.onTouched();
  }

  private fill(start: number, value: string): void {
    const next = [...this.digits()];
    for (let i = 0; i < value.length && start + i < this.length(); i++) next[start + i] = value[i];
    this.update(next);
    this.focusBox(Math.min(start + value.length, this.length() - 1));
  }

  private set(index: number, value: string): void {
    const next = [...this.digits()];
    next[index] = value;
    this.update(next);
  }

  private update(next: string[]): void {
    this.digits.set(next);
    const code = next.join('');
    this.onChange(code);
    if (code.length === this.length()) this.completed.emit(code);
  }

  private focusBox(index: number): void {
    this.boxes()[Math.max(0, Math.min(index, this.length() - 1))]?.nativeElement.focus();
  }
}