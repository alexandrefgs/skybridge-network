import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { FreelanceJob } from '../../core/freelance/freelance.models';
import { hazardLabel } from './missions';

@Component({
  selector: 'sb-job-briefing',
  imports: [DecimalPipe],
  template: `
    @let job = this.job();
    <div class="space-y-5 text-sm" data-testid="briefing">
      <div class="flex flex-wrap gap-x-10 gap-y-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-muted">Client</p>
          <p class="mt-1 font-medium">{{ job.client ?? 'Not disclosed' }}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-muted">Total distance</p>
          <p class="mt-1 font-mono">{{ job.distanceNm | number }} nm · {{ job.legs.length }} {{ job.legs.length === 1 ? 'leg' : 'legs' }}</p>
        </div>
      </div>

      @if (job.briefing) {
        <div>
          <p class="text-xs uppercase tracking-wide text-muted">Briefing</p>
          <p class="mt-1 whitespace-pre-line leading-relaxed" data-testid="briefing-story">{{ job.briefing }}</p>
        </div>
      }

      @for (leg of job.legs; track leg.sequence) {
        <section class="rounded-lg border border-line p-4" [attr.data-testid]="'leg-' + leg.sequence">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <p class="font-semibold">
              <span class="mr-2 text-xs uppercase tracking-wide text-muted">Leg {{ leg.sequence }}</span>
              <span class="font-mono">{{ leg.origin }} → {{ leg.destination }}</span>
            </p>
            <p class="font-mono text-xs text-muted">{{ leg.distanceNm | number }} nm · {{ leg.passengerCount | number }} pax · {{ leg.cargoKg | number }} kg</p>
          </div>
          <p class="mt-0.5 text-xs text-muted">{{ leg.originName }} → {{ leg.destinationName }}</p>

          @if (leg.passengerNames.length) {
            <div class="mt-3">
              <p class="text-xs uppercase tracking-wide text-muted">Passenger manifest</p>
              <ul class="mt-1 grid gap-x-6 gap-y-1 sm:grid-cols-2" data-testid="manifest">
                @for (name of leg.passengerNames; track $index) {
                  <li class="flex gap-2"><span class="w-6 text-right font-mono text-xs text-muted">{{ $index + 1 }}</span>{{ name }}</li>
                }
              </ul>
              @if (leg.passengerCount > leg.passengerNames.length) {
                <p class="mt-1 text-xs text-muted">+ {{ leg.passengerCount - leg.passengerNames.length | number }} more passengers</p>
              }
            </div>
          }

          @if (leg.dangerousGoods.length) {
            <div class="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3" data-testid="dangerous-goods">
              <p class="text-xs font-semibold uppercase tracking-wide text-amber-500">Dangerous goods on board</p>
              <table class="mt-2 w-full">
                <tbody class="divide-y divide-amber-500/20">
                  @for (good of leg.dangerousGoods; track $index) {
                    <tr>
                      <td class="py-1.5 pr-3 font-mono text-xs">{{ good.unNumber ?? '—' }}</td>
                      <td class="py-1.5 pr-3">{{ good.name }}</td>
                      <td class="py-1.5 pr-3 text-muted">{{ hazard(good.class) }}</td>
                      <td class="py-1.5 text-right font-mono">{{ good.quantityKg | number }} kg</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="mt-3 text-xs text-muted" data-testid="no-dangerous-goods">No dangerous goods declared.</p>
          }
        </section>
      }

      @if (job.warnings.length) {
        <ul class="space-y-1 text-xs text-amber-500" data-testid="job-warnings">
          @for (warning of job.warnings; track warning) {
            <li>⚠ {{ warning }}</li>
          }
        </ul>
      }
    </div>
  `
})
export class JobBriefing {
  readonly job = input.required<FreelanceJob>();

  protected hazard = hazardLabel;
}