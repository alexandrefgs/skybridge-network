import { Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from '../../core/account/account.service';
import { problemMessages } from '../../core/http/problem';

@Component({
  selector: 'sb-delete-account-form',
  template: `
    <div class="rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm" data-testid="delete-warning">
      @if (reason(); as text) {
        <p class="mb-2">{{ text }}</p>
      }
      <p class="font-semibold">This is permanent and cannot be undone.</p>
      <p class="mt-1 text-muted">Your profile, logbook, flights, PIREPs, wallet and staff role are deleted right away.</p>
    </div>

    <form class="mt-4 space-y-4" (submit)="submit($event)" data-testid="delete-form">
      <div>
        <label class="sb-label" for="delete-password">Confirm with your password</label>
        <input class="sb-input" id="delete-password" type="password" autocomplete="current-password" [value]="password()"
          (input)="password.set($any($event.target).value)" data-testid="delete-password" />
      </div>
      <label class="flex items-start gap-3 text-sm">
        <input type="checkbox" class="mt-0.5 accent-primary" [checked]="understood()" (change)="understood.set($any($event.target).checked)" data-testid="delete-understood" />
        <span>I understand my account will be deleted forever.</span>
      </label>

      @if (error(); as message) {
        <p class="sb-error" data-testid="delete-error">{{ message }}</p>
      }

      <div class="flex flex-wrap justify-end gap-3">
        <button type="button" class="sb-btn-secondary w-auto px-5" (click)="cancelled.emit()" data-testid="delete-cancel">{{ cancelLabel() }}</button>
        <button type="submit" class="sb-btn-primary w-auto px-5" [disabled]="!password() || !understood() || deleting()" data-testid="delete-confirm">
          Delete my account permanently
        </button>
      </div>
    </form>
  `
})
export class DeleteAccountForm {
  private readonly account = inject(AccountService);
  private readonly router = inject(Router);

  readonly reason = input<string | null>(null);
  readonly cancelLabel = input('Cancel');
  readonly cancelled = output<void>();
  readonly deleted = output<void>();

  protected readonly password = signal('');
  protected readonly understood = signal(false);
  protected readonly deleting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.password() || !this.understood()) return;
    this.deleting.set(true);
    this.error.set(null);
    this.account.deleteAccount(this.password()).subscribe({
      next: () => {
        this.deleted.emit();
        void this.router.navigateByUrl('/');
      },
      error: error => {
        this.deleting.set(false);
        this.error.set(problemMessages(error)[0]);
      }
    });
  }
}