import { ComponentFixture, TestBed } from '@angular/core/testing';
import { publicFlights } from '../../testing/public';
import { FlightCard } from './flight-card';

describe('FlightCard', () => {
  let fixture: ComponentFixture<FlightCard>;

  function render(flight = publicFlights[0]) {
    fixture = TestBed.createComponent(FlightCard);
    fixture.componentRef.setInput('flight', flight);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent!;
  }

  it('names the airline, the mission or plain freelance', () => {
    expect(render()).toContain('Gol Transportes Aéreos');
    expect(render(publicFlights[1])).toContain('MEDEVAC · freelance');
    const orphan = render({ ...publicFlights[1], mission: 'Freelance' });
    expect(orphan).toContain('Freelance');
    expect(orphan).not.toContain('· freelance');
  });
});