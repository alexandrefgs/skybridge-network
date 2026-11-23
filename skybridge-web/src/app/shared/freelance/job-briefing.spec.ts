import { TestBed } from '@angular/core/testing';
import { executiveTour, medevac } from '../../testing/freelance';
import { JobBriefing } from './job-briefing';

describe('JobBriefing', () => {
  function render(job = medevac) {
    const fixture = TestBed.createComponent(JobBriefing);
    fixture.componentRef.setInput('job', job);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the story, the manifest and the dangerous goods', () => {
    const element = render();

    expect(element.textContent).toContain('Hospital Santa Catarina');
    expect(element.textContent).toContain('1 leg');
    expect(element.querySelector('[data-testid="briefing-story"]')!.textContent).toContain('burn patient');
    expect(element.querySelector('[data-testid="manifest"]')!.textContent).toContain('Maria Souza');
    expect(element.textContent).toContain('+ 1 more passengers');
    const goods = element.querySelector('[data-testid="dangerous-goods"]')!.textContent;
    expect(goods).toContain('UN1072');
    expect(goods).toContain('Class 2 · Gases');
  });

  it('shows every leg and the warnings', () => {
    const element = render(executiveTour);

    expect(element.textContent).toContain('3 legs');
    expect(element.querySelector('[data-testid="leg-2"]')!.textContent).toContain('SBGR → SBRJ');
    expect(element.querySelector('[data-testid="leg-2"]')!.textContent).toContain('6 pax');
    expect(element.querySelectorAll('[data-testid="no-dangerous-goods"]').length).toBe(3);
    expect(element.querySelector('[data-testid="job-warnings"]')!.textContent).toContain('B738 needs 4,300 ft');
  });
});