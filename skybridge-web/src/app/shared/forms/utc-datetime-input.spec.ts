import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UtcDateTimeInput } from './utc-datetime-input';

@Component({
  imports: [ReactiveFormsModule, UtcDateTimeInput],
  template: `<sb-utc-datetime-input testId="when" [formControl]="control" /><p data-testid="outside">outside</p>`
})
class Host {
  readonly control = new FormControl('2026-11-23T19:38', { nonNullable: true });
}

describe('UtcDateTimeInput', () => {
  let fixture: ComponentFixture<Host>;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
  const control = () => fixture.componentInstance.control;

  async function open() {
    query('when')!.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  it('shows the value as a UTC date and Zulu time', () => {
    expect(query('when')!.textContent).toContain('23 NOV 2026');
    expect(query('when')!.textContent).toContain('19:38');
    expect(query('when-panel')).toBeNull();
  });

  it('opens on the selected month and picks another day keeping the time', async () => {
    await open();
    expect(query('when-month')!.textContent).toContain('NOV 2026');

    query('when-day-2026-11-20')!.click();
    await fixture.whenStable();

    expect(control().value).toBe('2026-11-20T19:38');
  });

  it('moves between months, including across the year', async () => {
    await open();
    query('when-next')!.click();
    query('when-next')!.click();
    await fixture.whenStable();

    expect(query('when-month')!.textContent).toContain('JAN 2027');
  });

  it('steps hours and minutes, rolling over the day', async () => {
    control().setValue('2026-11-23T23:59');
    await open();

    query('when-minute-up')!.click();
    await fixture.whenStable();

    expect(control().value).toBe('2026-11-24T00:00');
    expect(query('when-hours')!.textContent).toContain('00');

    query('when-hour-up')!.click();
    query('when-minute-down')!.click();
    expect(control().value).toBe('2026-11-24T00:59');
  });

  it('accepts a typed HHMM time and ignores invalid ones', async () => {
    await open();
    const typed = query('when-typed') as HTMLInputElement;

    typed.value = '0745';
    typed.dispatchEvent(new Event('input'));
    expect(control().value).toBe('2026-11-23T07:45');

    typed.value = '2575';
    typed.dispatchEvent(new Event('input'));
    expect(control().value).toBe('2026-11-23T07:45');
  });

  it('sets the current UTC time with Now', async () => {
    await open();
    query('when-now')!.click();

    const value = new Date(`${control().value}:00Z`).getTime();
    expect(Math.abs(value - Date.now())).toBeLessThan(2 * 60_000);
  });

  it('closes with Done, Escape or a click outside', async () => {
    await open();
    query('when-done')!.click();
    await fixture.whenStable();
    expect(query('when-panel')).toBeNull();

    await open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(query('when-panel')).toBeNull();

    await open();
    query('outside')!.click();
    await fixture.whenStable();
    expect(query('when-panel')).toBeNull();
  });

  it('shows a placeholder when empty', async () => {
    control().setValue('');
    await fixture.whenStable();

    expect(query('when')!.textContent).toContain('--:--');
  });
});