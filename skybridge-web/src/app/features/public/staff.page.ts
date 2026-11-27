import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClientConfigService } from '../../core/config/client-config.service';
import { PublicStaffMember, STAFF_DEPARTMENTS } from '../../core/staff/staff.models';
import { StaffService } from '../../core/staff/staff.service';

@Component({
  selector: 'sb-staff-page',
  imports: [DatePipe],
  styles: `
    .barcode {
      background: repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 4px, currentColor 4px 5px, transparent 5px 8px, currentColor 8px 11px, transparent 11px 13px);
    }
  `,
  template: `
    <div class="flex flex-wrap items-end justify-between gap-6">
      <div>
        <p class="font-mono text-xs tracking-[0.2em] text-primary">STAFF</p>
        <h1 class="mt-2 font-display text-5xl font-bold tracking-tight">The crew behind the crew</h1>
        <p class="mt-4 max-w-xl text-muted">Pilots like you who keep SkyBridge flying: they build the schedules, review the flights, train newcomers and run the events.</p>
      </div>
      @if (config.discordUrl(); as discord) {
        <a [href]="discord" target="_blank" rel="noopener" class="border-b border-foreground pb-1 text-sm font-medium hover:border-primary hover:text-primary" data-testid="staff-discord">Want to help? Talk to us on Discord ↗</a>
      }
    </div>

    @if (failed()) {
      <p class="sb-error mt-10" data-testid="staff-error">We could not load the staff right now. Try again in a moment.</p>
    } @else if (loaded() && groups().length === 0) {
      <p class="mt-10 text-muted" data-testid="staff-empty">Our staff is being assembled. Check back soon.</p>
    }

    @for (group of groups(); track group.value) {
      <section class="mt-14" [attr.data-testid]="'department-' + group.value">
        <div class="flex items-baseline gap-4 border-b border-line pb-3">
          <span class="font-mono text-sm font-semibold text-primary">{{ group.code }}</span>
          <h2 class="font-display text-2xl font-bold">{{ group.label }}</h2>
          <p class="hidden text-sm text-muted sm:block">{{ group.description }}</p>
        </div>

        <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (member of group.members; track member.userId) {
            <article class="group relative overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 motion-reduce:transform-none"
              [attr.data-testid]="'staff-' + member.userId">
              <div class="flex items-center justify-between bg-surface-2 px-5 py-2.5">
                <span class="font-mono text-[10px] tracking-[0.25em] text-muted">SKYBRIDGE CREW</span>
                <span class="h-1.5 w-10 rounded-full bg-background" aria-hidden="true"></span>
                <span class="rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary-foreground">{{ group.code }}</span>
              </div>

              <div class="flex items-center gap-4 px-5 pt-5">
                @if (member.avatarUrl) {
                  <img [src]="member.avatarUrl" [alt]="member.name" class="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-line" />
                } @else {
                  <span class="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-primary/15 font-display text-xl font-bold text-primary" data-testid="initials">{{ initials(member.name) }}</span>
                }
                <div class="min-w-0">
                  <p class="truncate font-display text-xl font-bold">{{ member.name }}</p>
                  <p class="truncate text-sm text-muted">{{ member.position }}</p>
                </div>
              </div>

              <dl class="mt-5 grid grid-cols-3 border-y border-line text-center">
                <div class="py-3">
                  <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">FLIGHTS</dt>
                  <dd class="mt-0.5 font-display text-lg font-bold tabular-nums" data-testid="flights">{{ member.flights.toLocaleString('en-US') }}</dd>
                </div>
                <div class="border-x border-line py-3">
                  <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">HOURS</dt>
                  <dd class="mt-0.5 font-display text-lg font-bold tabular-nums" data-testid="hours">{{ hours(member.flightMinutes) }}</dd>
                </div>
                <div class="py-3">
                  <dt class="font-mono text-[10px] tracking-[0.2em] text-muted">SINCE</dt>
                  <dd class="mt-0.5 font-display text-lg font-bold">{{ member.joinedAtUtc | date: 'MMM yyyy' : 'UTC' }}</dd>
                </div>
              </dl>

              <div class="flex items-center justify-between gap-4 px-5 py-3">
                <span class="barcode h-5 w-28 text-foreground/25 transition-colors group-hover:text-primary/60" aria-hidden="true"></span>
                <span class="font-mono text-[10px] tracking-widest text-muted">{{ badge(member) }}</span>
              </div>
            </article>
          }
        </div>
      </section>
    }
  `
})
export class StaffPage {
  protected readonly config = inject(ClientConfigService);
  protected readonly members = signal<PublicStaffMember[]>([]);
  protected readonly loaded = signal(false);
  protected readonly failed = signal(false);

  protected readonly groups = computed(() =>
    STAFF_DEPARTMENTS.map(department => ({
      ...department,
      members: this.members().filter(member => member.department === department.value)
    })).filter(group => group.members.length > 0)
  );

  constructor() {
    inject(StaffService)
      .publicList()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: members => {
          this.members.set(members);
          this.loaded.set(true);
        },
        error: () => this.failed.set(true)
      });
  }

  protected initials(name: string): string {
    const parts = name.split(' ').filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  protected hours(minutes: number): string {
    return (minutes / 60).toLocaleString('en-US', { maximumFractionDigits: 1 });
  }

  protected badge(member: PublicStaffMember): string {
    const index = this.members().indexOf(member) + 1;
    return `SKB-${String(index).padStart(3, '0')}`;
  }
}