import { Component, input } from '@angular/core';
import { PirepStatus } from '../../core/pireps/pirep.models';

@Component({
  selector: 'sb-pirep-status',
  template: `
    <span class="inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      [class.border-amber-500]="status() === 'Pending'" [class.text-amber-500]="status() === 'Pending'"
      [class.border-primary]="status() === 'Rejected'" [class.text-primary]="status() === 'Rejected'"
      [class.border-line]="status() === 'Accepted'" [class.text-muted]="status() === 'Accepted'">{{ status() }}</span>
  `
})
export class PirepStatusBadge {
  readonly status = input.required<PirepStatus>();
}