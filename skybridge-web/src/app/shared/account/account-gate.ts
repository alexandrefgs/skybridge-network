import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { AccountService } from '../../core/account/account.service';
import { AuthService } from '../../core/auth/auth.service';
import { problemMessages } from '../../core/http/problem';
import { DeleteAccountForm } from './delete-account-form';

const REACTIVATION_MS = 10 * 60 * 1000;

const PREPARATION_STEPS = [
  { label: 'Restoring logbook and flight hours', at: 0.1 },
  { label: 'Pre-flighting your aircraft', at: 0.35 },
  { label: 'Verifying licences and ratings', at: 0.6 },
  { label: 'Loading charts and NOTAMs', at: 0.85 },
  { label: 'Cleared for departure', at: 1 }
];

@Component({
  selector: 'sb-account-gate',
  imports: [DatePipe, DeleteAccountForm],
  styles: `
    .hud {
      background-image:
        linear-gradient(to right, color-mix(in srgb, var(--sb-foreground) 4%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--sb-foreground) 4%, transparent) 1px, transparent 1px);
      background-size: 24px 24px;
    }
    .tick { stroke: var(--sb-line); transition: stroke 0.4s; }
    .tick.lit { stroke: var(--sb-primary); }
    .spin { transform-origin: 120px 120px; animation: spin 8s linear infinite; }
    .blink { animation: blink 1s steps(2, start) infinite; }
    .scan { position: relative; }
    .scan::after {
      content: '';
      position: absolute;
      inset: 0;
      width: 30%;
      background: linear-gradient(90deg, transparent, var(--sb-primary), transparent);
      animation: scan 1.6s ease-in-out infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes blink { to { visibility: hidden; } }
    @keyframes scan { from { transform: translateX(-100%); } to { transform: translateX(340%); } }
    @media (prefers-reduced-motion: reduce) { .spin, .blink, .scan::after { animation: none; } }
  `,
  template: `
    @switch (view()) {
      @case ('inactive') {
        <div class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/95 p-6 backdrop-blur" data-testid="gate-inactive">
          <div class="w-full max-w-lg rounded-2xl border border-line bg-surface p-8 text-center shadow-2xl">
            <p class="font-mono text-xs tracking-[0.25em] text-primary">ACCOUNT INACTIVE</p>
            <h2 class="mt-3 font-display text-3xl font-bold">We missed you, Captain</h2>
            <p class="mt-3 text-muted">Your account was set to inactive after 60 days without activity. Your logbook, hours and wallet are safe. Reactivating is free and takes a few minutes.</p>
            @if (error(); as message) {
              <p class="sb-error mt-4">{{ message }}</p>
            }
            <button type="button" class="sb-btn-primary mt-6 w-auto px-8 py-3" [disabled]="busy()" (click)="reactivate()" data-testid="reactivate">Reactivate my account</button>
            <button type="button" class="mt-4 block w-full text-sm text-muted hover:text-foreground" (click)="signOut()">Sign out</button>
          </div>
        </div>
      }
      @case ('reactivating') {
        <div class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/95 p-6 backdrop-blur" data-testid="gate-reactivating">
          <div class="hud relative w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
            <div class="flex items-center justify-between border-b border-line px-6 py-3 font-mono text-[11px] tracking-[0.2em]">
              <span class="flex items-center gap-2 text-primary"><span class="h-2 w-2 animate-pulse rounded-full bg-primary"></span>ACCOUNT RECOVERY</span>
              <span class="text-muted">SEQ {{ currentStep() }}/{{ steps().length }}</span>
            </div>

            <div class="grid items-center gap-8 p-6 sm:grid-cols-[15rem_1fr] sm:p-8">
              <div class="relative mx-auto h-60 w-60">
                <svg class="h-full w-full" viewBox="0 0 240 240" aria-hidden="true">
                  @for (tick of ticks(); track tick.index) {
                    <line x1="120" y1="6" x2="120" [attr.y2]="tick.index % 5 === 0 ? 20 : 15" [attr.transform]="'rotate(' + tick.index * 6 + ' 120 120)'"
                      stroke-width="2" stroke-linecap="round" [attr.class]="tick.lit ? 'tick lit' : 'tick'" />
                  }
                  <circle cx="120" cy="120" r="88" fill="none" class="stroke-line" stroke-width="2" />
                  <circle cx="120" cy="120" r="88" fill="none" class="stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear" stroke-width="4" transform="rotate(-90 120 120)"
                    stroke-linecap="round" [attr.stroke-dasharray]="ring" [attr.stroke-dashoffset]="ring * (1 - progress())" />
                  <circle cx="120" cy="120" r="74" fill="none" class="spin stroke-primary/40" stroke-width="1.5" stroke-dasharray="4 10" />
                </svg>
                <div class="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p class="font-mono text-[10px] tracking-[0.3em] text-muted">T-MINUS</p>
                    <p class="font-mono text-5xl font-bold tabular-nums tracking-tight" data-testid="countdown">{{ countdown() }}</p>
                    <p class="mt-1 font-mono text-xs tabular-nums text-primary" data-testid="percent">{{ percent() }}%</p>
                  </div>
                </div>
              </div>

              <div class="min-w-0">
                <p class="font-mono text-[10px] tracking-[0.3em] text-muted">PREPARING YOUR ACCOUNT</p>
                <ol class="mt-4 space-y-2.5 font-mono text-xs sm:text-sm">
                  @for (step of steps(); track step.label) {
                    <li class="flex items-start gap-3" [class.text-muted]="!step.done && !step.current">
                      <span class="w-14 shrink-0 text-[11px]" [class.text-primary]="step.done || step.current">
                        @if (step.done) { [ OK ] } @else if (step.current) { [<span class="blink">..</span>] } @else { [ -- ] }
                      </span>
                      <span>{{ step.label }}</span>
                    </li>
                  }
                </ol>
                <div class="mt-6">
                  <div class="flex justify-between font-mono text-[10px] tracking-[0.2em] text-muted">
                    <span>SYNC WITH SKYBRIDGE OPS</span><span class="blink">▮</span>
                  </div>
                  <div class="scan mt-2 h-1 overflow-hidden rounded-full bg-surface-2"></div>
                </div>
                <p class="mt-6 text-xs text-muted">You can leave this page open. We will take you to your cockpit when it is ready.</p>
              </div>
            </div>
          </div>
        </div>
      }
      @case ('regulations') {
        <div class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/90 p-6 backdrop-blur" role="dialog" aria-modal="true" data-testid="gate-regulations">
          <div class="w-full max-w-xl rounded-2xl border border-line bg-surface p-8 shadow-2xl">
            @if (declining()) {
              <p class="font-mono text-xs tracking-[0.25em] text-primary">DECLINE THE REGULATIONS</p>
              <h2 class="mt-2 font-display text-2xl font-bold">Delete your account?</h2>
              <div class="mt-5">
                <sb-delete-account-form
                  reason="To fly with SkyBridge every pilot must accept the current Regulations and Privacy Policy. Declining them deletes your account."
                  cancelLabel="Back to the regulations"
                  (cancelled)="declining.set(false)" />
              </div>
            } @else {
              <p class="font-mono text-xs tracking-[0.25em] text-primary">{{ firstTime() ? 'BEFORE YOU FLY' : 'REGULATIONS UPDATED' }}</p>
              <h2 class="mt-2 font-display text-2xl font-bold">{{ firstTime() ? 'Welcome aboard' : 'Our regulations changed' }}</h2>
              <p class="mt-2 text-sm text-muted">
                {{ firstTime() ? 'Please read and accept our rules before your first flight.' : 'Please review what changed since you last accepted them.' }}
              </p>

              <ol class="mt-5 max-h-64 space-y-4 overflow-y-auto pr-1" data-testid="pending-changes">
                @for (version of pending(); track version.version) {
                  <li class="rounded-lg border border-line p-4">
                    <p class="font-mono text-xs text-muted">VERSION {{ version.version }} · {{ version.effectiveOn | date: 'd MMM yyyy' : 'UTC' }}</p>
                    <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
                      @for (change of version.changes; track change) {
                        <li>{{ change }}</li>
                      }
                    </ul>
                  </li>
                }
              </ol>

              <p class="mt-4 text-sm">
                Read the full <a href="/regulations" target="_blank" rel="noopener" class="text-primary underline">Regulations</a>
                and <a href="/privacy" target="_blank" rel="noopener" class="text-primary underline">Privacy Policy</a>.
              </p>
              <label class="mt-4 flex items-start gap-3 text-sm">
                <input type="checkbox" class="mt-0.5 accent-primary" [checked]="agreed()" (change)="agreed.set($any($event.target).checked)" data-testid="agree" />
                <span>I am 16 or older and I accept the Regulations and the Privacy Policy.</span>
              </label>
              @if (error(); as message) {
                <p class="sb-error mt-4">{{ message }}</p>
              }
              <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button type="button" class="text-sm text-muted hover:text-primary" (click)="declining.set(true)" data-testid="decline">Decline</button>
                <button type="button" class="sb-btn-primary w-auto px-6" [disabled]="!agreed() || busy()" (click)="accept()" data-testid="accept">Accept and continue</button>
              </div>
            }
          </div>
        </div>
      }
    }
  `
})
export class AccountGate {
  private readonly auth = inject(AuthService);
  private readonly account = inject(AccountService);
  private readonly router = inject(Router);

  protected readonly now = signal(Date.now());
  protected readonly agreed = signal(false);
  protected readonly declining = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  private finishing = false;

  protected readonly view = computed(() => {
    const state = this.account.state();
    if (!state) return null;
    if (state.status === 'Inactive') return 'inactive';
    if (state.status === 'Reactivating') return 'reactivating';
    return state.pendingRegulations.length > 0 ? 'regulations' : null;
  });

  protected readonly pending = computed(() => this.account.state()?.pendingRegulations ?? []);
  protected readonly firstTime = computed(() => this.account.state()?.acceptedRegulationsVersion === null);

  protected readonly remainingMs = computed(() => {
    const ready = this.account.state()?.reactivationReadyAtUtc;
    return ready ? Math.max(0, Date.parse(ready) - this.now()) : 0;
  });

  protected readonly countdown = computed(() => {
    const seconds = Math.ceil(this.remainingMs() / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  });

  protected readonly progress = computed(() => Math.min(1, Math.max(0, 1 - this.remainingMs() / REACTIVATION_MS)));
  protected readonly steps = computed(() => {
    const progress = this.progress();
    const current = PREPARATION_STEPS.findIndex(step => progress < step.at);
    return PREPARATION_STEPS.map((step, index) => ({ label: step.label, done: progress >= step.at, current: index === current }));
  });

  protected readonly currentStep = computed(() => {
    const index = this.steps().findIndex(step => step.current);
    return index === -1 ? this.steps().length : index + 1;
  });

  protected readonly percent = computed(() => (this.progress() * 100).toFixed(1));
  protected readonly ticks = computed(() => Array.from({ length: 60 }, (_, index) => ({ index, lit: index < Math.round(this.progress() * 60) })));
  protected readonly ring = 2 * Math.PI * 88;

  constructor() {
    effect(() => {
      if (this.auth.isSignedIn()) {
        untracked(() => this.account.load().subscribe({ error: () => undefined }));
      } else {
        untracked(() => this.account.state.set(null));
      }
    });

    effect(() => {
      if (this.view() === 'reactivating' && this.remainingMs() === 0) untracked(() => this.finish());
    });

    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.now.set(Date.now());
        if (this.view() === 'reactivating' && this.remainingMs() === 0) this.finish();
      });
  }

  protected reactivate(): void {
    this.busy.set(true);
    this.error.set(null);
    this.now.set(Date.now());
    this.account.reactivate().subscribe({
      next: () => this.busy.set(false),
      error: error => {
        this.busy.set(false);
        this.error.set(problemMessages(error)[0]);
      }
    });
  }

  protected accept(): void {
    const state = this.account.state();
    if (!state || !this.agreed()) return;
    this.busy.set(true);
    this.error.set(null);
    this.account.acceptRegulations(state.currentRegulationsVersion).subscribe({
      next: () => {
        this.busy.set(false);
        this.agreed.set(false);
      },
      error: error => {
        this.busy.set(false);
        this.error.set(problemMessages(error)[0]);
      }
    });
  }

  protected signOut(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  private finish(): void {
    if (this.finishing) return;
    this.finishing = true;
    this.account.load().subscribe({
      next: state => {
        this.finishing = false;
        if (state.status === 'Active') void this.router.navigateByUrl('/cockpit');
      },
      error: () => (this.finishing = false)
    });
  }
}