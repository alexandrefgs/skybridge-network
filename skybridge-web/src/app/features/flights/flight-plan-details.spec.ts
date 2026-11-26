import { ComponentFixture, TestBed } from '@angular/core/testing';
import { golOfpDetails } from '../../testing/freelance';
import { FlightPlanDetailsView } from './flight-plan-details';

describe('FlightPlanDetailsView', () => {
  let fixture: ComponentFixture<FlightPlanDetailsView>;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  async function render(details = golOfpDetails) {
    fixture = TestBed.createComponent(FlightPlanDetailsView);
    fixture.componentRef.setInput('details', details);
    await fixture.whenStable();
  }

  it('shows the airports with runway, transition and weather', async () => {
    await render();

    expect(query('plan-departure')!.textContent).toContain('SBFL');
    expect(query('plan-departure')!.textContent).toContain('TA 7,000 · TL 8,000 ft');
    expect(query('plan-departure')!.textContent).toContain('CAVOK');
    expect(query('plan-arrival')!.textContent).toContain('RWY 10L');
    expect(query('plan-arrival')!.textContent).toContain('TAF SBGR');
    expect(query('plan-alternate')!.textContent).toContain('SBKP');
    expect(query('plan-alternate')!.textContent).toContain('FL150 · 0:18 · 1,200 kg');
  });

  it('breaks down the fuel and the flight data', async () => {
    await render();

    expect(query('plan-fuel')!.textContent).toContain('CONTINGENCY');
    expect(query('plan-fuel')!.textContent).toContain('8,000');
    expect(query('plan-fuel')!.textContent).toContain('2,600 kg/h');
    expect(query('plan-performance')!.textContent).toContain('PUN04A · BUXUK1A');
    expect(query('plan-performance')!.textContent).toContain('452 kt TAS · M.78');
    expect(query('plan-performance')!.textContent).toContain('290/25 · HW 12');
    expect(query('plan-performance')!.textContent).toContain('+3 °C');
  });

  it('lists the navlog and highlights top of climb and descent', async () => {
    await render();

    expect(query('navlog')!.querySelectorAll('tbody tr').length).toBe(6);
    expect(query('fix-TOC')!.classList).toContain('text-primary');
    expect(query('fix-ENSUG')!.classList).not.toContain('text-primary');
    expect(query('fix-TOC')!.textContent).toContain('FL360');
    expect(query('fix-TOC')!.textContent).toContain('0:21');
    expect(query('fix-PAKOT')!.textContent).toContain('9,000 ft');
    expect(query('fix-PAKOT')!.textContent).toContain('+4');
  });

  it('copies the ATC flight plan', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await render();

    expect(query('atc-plan')!.textContent).toContain('(FPL-GLO1042-IS');
    query('copy-atc')!.click();
    await fixture.whenStable();

    expect(writeText).toHaveBeenCalledWith(golOfpDetails.atcFlightPlan);
    expect(query('copy-atc')!.textContent).toContain('Copied');
  });

  it('explains a plan without alternate or navlog', async () => {
    await render({ ...golOfpDetails, alternate: null, navlog: [], atcFlightPlan: null });

    expect(query('plan-alternate')!.textContent).toContain('No alternate planned.');
    expect(query('navlog')!.textContent).toContain('This OFP has no navlog.');
    expect(query('atc-plan')).toBeNull();
  });
});