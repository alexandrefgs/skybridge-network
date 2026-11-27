import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { PagedResult } from '../../core/http/paged-result';
import { problemMessages } from '../../core/http/problem';
import { Pilot, PilotTransaction } from '../../core/pilot/pilot.models';
import { PilotService } from '../../core/pilot/pilot.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'sb-wallet-page',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <p class="font-mono text-xs tracking-[0.2em] text-primary">PILOT</p>
    <h1 class="mt-1 font-display text-3xl font-bold">Wallet</h1>
    <p class="mt-1 text-muted">What you were paid for each flight and every other change to your balance.</p>

    @if (error(); as message) {
      <p class="sb-error mt-6" data-testid="wallet-error">{{ message }}</p>
    }

    <section class="sb-card mt-6 flex flex-wrap items-end justify-between gap-4 p-6">
      <div>
        <p class="font-mono text-[10px] tracking-[0.2em] text-muted">BALANCE</p>
        <p class="mt-1 font-mono text-4xl font-bold text-primary" data-testid="balance">{{ (pilot()?.balance ?? 0) | currency: 'USD' : 'symbol' : '1.0-0' }}</p>
      </div>
      <p class="text-sm text-muted">Spend it on your own aircraft and company — coming soon.</p>
    </section>

    <div class="sb-card mt-6 overflow-x-auto p-0">
      <table class="w-full text-sm" data-testid="transactions">
        <thead class="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="px-4 py-3 font-medium">Date</th>
            <th class="px-4 py-3 font-medium">Description</th>
            <th class="px-4 py-3 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          @for (transaction of result()?.items ?? []; track transaction.id) {
            <tr [attr.data-testid]="'transaction-' + transaction.id">
              <td class="whitespace-nowrap px-4 py-3 font-mono text-muted">{{ transaction.createdAtUtc | date: 'dd MMM yyyy HH:mm' : 'UTC' }}Z</td>
              <td class="px-4 py-3">{{ transaction.description }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold" [class.text-primary]="transaction.amount > 0">
                {{ transaction.amount > 0 ? '+' : '−' }}{{ abs(transaction.amount) | currency: 'USD' : 'symbol' : '1.0-0' }}
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="3" class="px-4 py-10 text-center text-muted" data-testid="no-transactions">
                Nothing here yet. Your first payment arrives after your first flight.
                <a routerLink="/freelance" class="ml-1 text-primary hover:underline">Find a job</a>
              </td>
            </tr>
          }
        </tbody>
      </table>

      @if (totalPages() > 1) {
        <div class="flex items-center justify-between border-t border-line px-4 py-3 text-sm" data-testid="pager">
          <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="page() <= 1" (click)="page.set(page() - 1)">← Previous</button>
          <span class="text-muted">Page {{ page() }} of {{ totalPages() }}</span>
          <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="page() >= totalPages()" (click)="page.set(page() + 1)" data-testid="next-page">Next →</button>
        </div>
      }
    </div>
  `
})
export class WalletPage {
  private readonly pilots = inject(PilotService);

  protected readonly pilot = signal<Pilot | null>(null);
  protected readonly page = signal(1);
  protected readonly result = signal<PagedResult<PilotTransaction> | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly totalPages = computed(() => Math.ceil((this.result()?.totalCount ?? 0) / PAGE_SIZE));
  protected readonly abs = Math.abs;

  constructor() {
    this.pilots.get().pipe(takeUntilDestroyed()).subscribe({
      next: pilot => this.pilot.set(pilot),
      error: error => this.error.set(problemMessages(error)[0])
    });

    toObservable(this.page)
      .pipe(
        switchMap(page =>
          this.pilots.transactions(page, PAGE_SIZE).pipe(
            catchError(error => {
              this.error.set(problemMessages(error)[0]);
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe(result => {
        if (result) this.result.set(result);
      });
  }
}