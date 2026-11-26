import { DecimalPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { FlightPlanAirport, FlightPlanDetails, NavlogFix } from '../../core/bookings/booking.models';

@Component({
  selector: 'sb-flight-plan-details',
  imports: [DecimalPipe],
  template: `
    @let plan = details();
    <div class="space-y-6" data-testid="full-plan">
      <div class="grid gap-4 lg:grid-cols-3">
        @for (airport of [plan.departure, plan.arrival]; track $index) {
          <div class="rounded-lg border border-line p-4" [attr.data-testid]="$index === 0 ? 'plan-departure' : 'plan-arrival'">
            <p class="font-mono text-[10px] tracking-[0.2em] text-muted">{{ $index === 0 ? 'DEPARTURE' : 'ARRIVAL' }}</p>
            <p class="mt-1 font-mono text-lg font-semibold">{{ airport.code }}
              @if (airport.runway) { <span class="text-primary">RWY {{ airport.runway }}</span> }
            </p>
            <p class="text-xs text-muted">{{ airport.name }}</p>
            <p class="mt-2 font-mono text-xs text-muted">ELEV {{ airport.elevationFt | number }} ft · {{ transition(airport) }}</p>
            @if (airport.metar) {
              <p class="mt-2 break-words font-mono text-xs">{{ airport.metar }}</p>
            }
            @if (airport.taf) {
              <p class="mt-1 break-words font-mono text-xs text-muted">{{ airport.taf }}</p>
            }
          </div>
        }
        <div class="rounded-lg border border-line p-4" data-testid="plan-alternate">
          <p class="font-mono text-[10px] tracking-[0.2em] text-muted">ALTERNATE</p>
          @if (plan.alternate; as alternate) {
            <p class="mt-1 font-mono text-lg font-semibold">{{ alternate.code }}
              @if (alternate.runway) { <span class="text-primary">RWY {{ alternate.runway }}</span> }
            </p>
            <p class="text-xs text-muted">{{ alternate.name }}</p>
            <p class="mt-2 font-mono text-xs text-muted">
              {{ alternate.distanceNm | number }} nm · {{ level(alternate.cruiseAltitudeFt) }} · {{ clock(alternate.enrouteMinutes) }} · {{ alternate.burnKg | number }} kg
            </p>
            @if (alternate.route) {
              <p class="mt-2 break-words font-mono text-xs">{{ alternate.route }}</p>
            }
            @if (alternate.metar) {
              <p class="mt-1 break-words font-mono text-xs text-muted">{{ alternate.metar }}</p>
            }
          } @else {
            <p class="mt-2 text-sm text-muted">No alternate planned.</p>
          }
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-lg border border-line p-4">
          <p class="font-mono text-[10px] tracking-[0.2em] text-muted">FUEL (KG)</p>
          <dl class="mt-3 space-y-1.5 font-mono text-sm" data-testid="plan-fuel">
            @for (row of fuelRows(); track row.label) {
              <div class="flex justify-between gap-4" [class.border-t]="row.strong" [class.border-line]="row.strong" [class.pt-1.5]="row.strong">
                <dt [class.text-muted]="!row.strong">{{ row.label }}</dt>
                <dd [class.font-semibold]="row.strong" [class.text-primary]="row.label === 'BLOCK'">{{ row.kg | number }}</dd>
              </div>
            }
            <div class="flex justify-between gap-4 text-xs text-muted">
              <dt>AVG FLOW</dt>
              <dd>{{ plan.fuel.averageFlowKgPerHour | number }} kg/h</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-lg border border-line p-4">
          <p class="font-mono text-[10px] tracking-[0.2em] text-muted">FLIGHT DATA</p>
          <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-sm" data-testid="plan-performance">
            <div>
              <dt class="text-[10px] tracking-[0.2em] text-muted">SID · STAR</dt>
              <dd class="mt-0.5">{{ plan.performance.sid ?? '—' }} · {{ plan.performance.star ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-[10px] tracking-[0.2em] text-muted">COST INDEX</dt>
              <dd class="mt-0.5">{{ plan.performance.costIndex ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-[10px] tracking-[0.2em] text-muted">CRUISE</dt>
              <dd class="mt-0.5">{{ plan.performance.cruiseTasKts }} kt TAS@if (plan.performance.cruiseMach) { · M{{ mach(plan.performance.cruiseMach) }}}</dd>
            </div>
            <div>
              <dt class="text-[10px] tracking-[0.2em] text-muted">AVG WIND</dt>
              <dd class="mt-0.5">{{ wind(plan.performance.averageWindDirection, plan.performance.averageWindSpeedKts) }} · {{ component(plan.performance.averageWindComponentKts) }}</dd>
            </div>
            <div>
              <dt class="text-[10px] tracking-[0.2em] text-muted">ISA DEV</dt>
              <dd class="mt-0.5">{{ signed(plan.performance.averageTempDeviation) }} °C</dd>
            </div>
            <div>
              <dt class="text-[10px] tracking-[0.2em] text-muted">STEP CLIMBS</dt>
              <dd class="mt-0.5 break-words">{{ plan.performance.stepClimbs ?? '—' }}</dd>
            </div>
            @if (plan.performance.climbProfile || plan.performance.descentProfile) {
              <div class="col-span-2">
                <dt class="text-[10px] tracking-[0.2em] text-muted">CLIMB · CRUISE · DESCENT</dt>
                <dd class="mt-0.5">{{ plan.performance.climbProfile ?? '—' }} · {{ plan.performance.cruiseProfile ?? '—' }} · {{ plan.performance.descentProfile ?? '—' }}</dd>
              </div>
            }
          </dl>
        </div>
      </div>

      <div class="rounded-lg border border-line">
        <p class="px-4 pt-4 font-mono text-[10px] tracking-[0.2em] text-muted">NAVLOG · {{ plan.navlog.length }} FIXES</p>
        <div class="mt-3 overflow-x-auto">
          <table class="w-full whitespace-nowrap font-mono text-xs" data-testid="navlog">
            <thead class="border-y border-line text-left text-[10px] tracking-[0.15em] text-muted">
              <tr>
                <th class="px-4 py-2 font-medium">FIX</th>
                <th class="px-3 py-2 font-medium">VIA</th>
                <th class="px-3 py-2 text-right font-medium">ALT</th>
                <th class="px-3 py-2 text-right font-medium">WIND</th>
                <th class="px-3 py-2 text-right font-medium">OAT</th>
                <th class="px-3 py-2 text-right font-medium">TRK</th>
                <th class="px-3 py-2 text-right font-medium">GS</th>
                <th class="px-3 py-2 text-right font-medium">DIST</th>
                <th class="px-3 py-2 text-right font-medium">TIME</th>
                <th class="px-3 py-2 text-right font-medium">USED</th>
                <th class="px-4 py-2 text-right font-medium">FOB</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              @for (fix of plan.navlog; track $index) {
                <tr [class.text-primary]="isMarker(fix)" [attr.data-testid]="'fix-' + fix.ident">
                  <td class="px-4 py-2">
                    <span class="font-semibold">{{ fix.ident }}</span>
                    @if (fix.name && fix.name !== fix.ident) {
                      <span class="ml-2 text-muted">{{ fix.name }}</span>
                    }
                  </td>
                  <td class="px-3 py-2" [class.text-muted]="!fix.sidStar">{{ fix.airway ?? '' }}</td>
                  <td class="px-3 py-2 text-right">{{ level(fix.altitudeFt) }}</td>
                  <td class="px-3 py-2 text-right">{{ wind(fix.windDirection, fix.windSpeedKts) }}</td>
                  <td class="px-3 py-2 text-right">{{ signed(fix.oatC) }}</td>
                  <td class="px-3 py-2 text-right">{{ pad3(fix.trackMag) }}</td>
                  <td class="px-3 py-2 text-right">{{ fix.groundSpeedKts }}</td>
                  <td class="px-3 py-2 text-right">{{ fix.distanceNm }}</td>
                  <td class="px-3 py-2 text-right">{{ clock(fix.elapsedMinutes) }}</td>
                  <td class="px-3 py-2 text-right">{{ fix.fuelUsedKg | number }}</td>
                  <td class="px-4 py-2 text-right font-semibold">{{ fix.fuelOnboardKg | number }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="11" class="px-4 py-6 text-center text-muted">This OFP has no navlog.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (plan.atcFlightPlan; as atc) {
        <div class="rounded-lg border border-line p-4">
          <div class="flex items-center justify-between gap-3">
            <p class="font-mono text-[10px] tracking-[0.2em] text-muted">ATC FLIGHT PLAN</p>
            <button type="button" class="text-xs text-muted hover:text-primary" (click)="copy(atc)" data-testid="copy-atc">
              {{ copied() ? 'Copied' : 'Copy' }}
            </button>
          </div>
          <pre class="mt-3 whitespace-pre-wrap break-words font-mono text-xs" data-testid="atc-plan">{{ atc }}</pre>
        </div>
      }
    </div>
  `
})
export class FlightPlanDetailsView {
  readonly details = input.required<FlightPlanDetails>();

  protected readonly copied = signal(false);

  protected readonly fuelRows = computed(() => {
    const fuel = this.details().fuel;
    return [
      { label: 'TAXI', kg: fuel.taxiKg, strong: false },
      { label: 'TRIP', kg: fuel.tripKg, strong: false },
      { label: 'CONTINGENCY', kg: fuel.contingencyKg, strong: false },
      { label: 'ALTERNATE', kg: fuel.alternateKg, strong: false },
      { label: 'RESERVE', kg: fuel.reserveKg, strong: false },
      { label: 'EXTRA', kg: fuel.extraKg, strong: false },
      { label: 'BLOCK', kg: fuel.blockKg, strong: true },
      { label: 'MIN TAKEOFF', kg: fuel.minTakeoffKg, strong: false },
      { label: 'TAKEOFF', kg: fuel.takeoffKg, strong: false },
      { label: 'LANDING', kg: fuel.landingKg, strong: false }
    ];
  });

  protected transition(airport: FlightPlanAirport): string {
    if (!airport.transitionAltitudeFt && !airport.transitionLevelFt) return 'TA/TL —';
    return `TA ${airport.transitionAltitudeFt.toLocaleString('en-US')} · TL ${this.level(airport.transitionLevelFt)}`;
  }

  protected level(feet: number): string {
    return feet >= 10000 ? `FL${String(Math.round(feet / 100)).padStart(3, '0')}` : `${feet.toLocaleString('en-US')} ft`;
  }

  protected wind(direction: number, speed: number): string {
    return `${this.pad3(direction)}/${String(speed).padStart(2, '0')}`;
  }

  protected component(knots: number): string {
    if (knots === 0) return 'calm';
    return knots < 0 ? `HW ${-knots}` : `TW ${knots}`;
  }

  protected signed(value: number): string {
    return value > 0 ? `+${value}` : `${value}`;
  }

  protected mach(value: string): string {
    return value.replace(/^0(?=\.)/, '');
  }

  protected pad3(value: number): string {
    return String(value).padStart(3, '0');
  }

  protected clock(minutes: number): string {
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
  }

  protected isMarker(fix: NavlogFix): boolean {
    return fix.type === 'ltlg' && (fix.ident === 'TOC' || fix.ident === 'TOD');
  }

  protected copy(text: string): void {
    navigator.clipboard?.writeText(text).then(() => this.copied.set(true), () => {});
  }
}