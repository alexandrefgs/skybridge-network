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
  { label: 'Finding your logbook in the archive', at: 0.1 },
  { label: 'Refuelling and pre-flighting your aircraft', at: 0.35 },
  { label: 'Checking your licences and ratings', at: 0.6 },
  { label: 'Updating charts and NOTAMs', at: 0.85 },
  { label: 'Cleared for departure', at: 1 }
];

@Component({
  selector: 'sb-account-gate',
  imports: [DatePipe, DeleteAccountForm],
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
          <div class="w-full max-w-lg rounded-2xl border border-line bg-surface p-8 shadow-2xl">
            <p class="font-mono text-xs tracking-[0.25em] text-primary">PREPARING YOUR ACCOUNT</p>
            <p class="mt-4 font-mono text-6xl font-bold tabular-nums" data-testid="countdown">{{ countdown() }}</p>
            <div class="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
              <div class="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear" [style.width.%]="progress() * 100"></div>
            </div>
            <ol class="mt-6 space-y-2 text-sm">
              @for (step of steps(); track step.label) {
                <li class="flex items-center gap-3" [class.text-muted]="!step.done">
                  <span class="grid h-5 w-5 place-items-center rounded-full border text-[10px]"
                    [class]="step.done ? 'border-primary bg-primary text-primary-foreground' : 'border-line'">{{ step.done ? '✓' : '' }}</span>
                  {{ step.label }}
                </li>
              }
            </ol>
            <p class="mt-6 text-xs text-muted">You can leave this page open. We will take you to your cockpit when it is ready.</p>
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
  protected readonly steps = computed(() => PREPARATION_STEPS.map(step => ({ label: step.label, done: this.progress() >= step.at })));

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