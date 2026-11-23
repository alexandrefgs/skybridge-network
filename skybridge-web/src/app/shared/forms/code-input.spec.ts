import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CodeInput } from './code-input';

@Component({
  imports: [ReactiveFormsModule, CodeInput],
  template: `<sb-code-input [formControl]="code" (completed)="completed = $event" />`
})
class Host {
  readonly code = new FormControl('', { nonNullable: true });
  readonly input = viewChild.required(CodeInput);
  completed = '';
}

describe('CodeInput', () => {
  const render = async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const box = (i: number) => fixture.nativeElement.querySelector(`[data-testid="code-digit-${i}"]`) as HTMLInputElement;
    const type = (i: number, value: string) => {
      box(i).value = value;
      box(i).dispatchEvent(new Event('input'));
    };
    return { fixture, box, type };
  };

  it('moves to the next box while typing and reports the full code', async () => {
    const { fixture, box, type } = await render();

    '57518'.split('').forEach((digit, i) => type(i, digit));
    expect(document.activeElement).toBe(box(5));
    type(5, '3');

    expect(fixture.componentInstance.code.value).toBe('575183');
    expect(fixture.componentInstance.completed).toBe('575183');
  });

  it('ignores letters', async () => {
    const { fixture, box, type } = await render();

    type(0, 'a');

    expect(box(0).value).toBe('');
    expect(fixture.componentInstance.code.value).toBe('');
  });

  it('spreads a pasted or autofilled code over the boxes', async () => {
    const { fixture, box, type } = await render();

    type(0, '123 456');
    await fixture.whenStable();

    expect([0, 1, 2, 3, 4, 5].map(i => box(i).value).join('')).toBe('123456');
    expect(fixture.componentInstance.completed).toBe('123456');
  });

  it('goes back and clears the previous digit on backspace', async () => {
    const { fixture, box, type } = await render();
    type(0, '1');
    type(1, '2');

    box(2).dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    await fixture.whenStable();

    expect(fixture.componentInstance.code.value).toBe('1');
    expect(document.activeElement).toBe(box(1));
  });

  it('clears the boxes when the form is reset', async () => {
    const { fixture, box, type } = await render();
    type(0, '9');

    fixture.componentInstance.code.reset();
    await fixture.whenStable();

    expect(box(0).value).toBe('');
  });
});