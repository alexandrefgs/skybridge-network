import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FuelConverter, toKilograms } from './fuel-converter';

describe('toKilograms', () => {
  it('converts pounds and US gallons by fuel density', () => {
    expect(toKilograms(500, 'KG', 'JET')).toBe(500);
    expect(toKilograms(1000, 'LB', 'JET')).toBeCloseTo(453.59, 2);
    expect(toKilograms(100, 'GAL', 'JET')).toBeCloseTo(303.91, 2);
    expect(toKilograms(100, 'GAL', 'AVGAS')).toBeCloseTo(272.16, 2);
  });
});

describe('FuelConverter', () => {
  let fixture: ComponentFixture<FuelConverter>;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  beforeEach(async () => {
    fixture = TestBed.createComponent(FuelConverter);
    fixture.componentRef.setInput('testId', 'fc');
    await fixture.whenStable();
    query('fc')!.click();
    await fixture.whenStable();
  });

  async function enter(amount: string) {
    const input = query('fc-amount') as HTMLInputElement;
    input.value = amount;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  it('starts in pounds and shows the three units', async () => {
    await enter('1000');

    const result = query('fc-result')!.textContent!;
    expect(result).toContain('454');
    expect(result).toContain('1,000');
    expect(result).toContain('149.3');
  });

  it('converts gallons with the chosen density and emits kilograms', async () => {
    let used: number | null = null;
    fixture.componentInstance.use.subscribe(kg => (used = kg));

    query('fc-unit-GAL')!.click();
    query('fc-fuel-AVGAS')!.click();
    await enter('50');
    expect(query('fc-result')!.textContent).toContain('136');

    query('fc-use')!.click();
    await fixture.whenStable();

    expect(used).toBe(136);
    expect(query('fc-panel')).toBeNull();
  });

  it('starts with the fuel type it was given', async () => {
    fixture.componentRef.setInput('fuelType', 'AVGAS');
    query('fc-unit-GAL')!.click();
    await enter('10');

    expect(query('fc-result')!.textContent).toContain('27');
  });

  it('disables Use until there is an amount', () => {
    expect((query('fc-use') as HTMLButtonElement).disabled).toBe(true);
  });
});