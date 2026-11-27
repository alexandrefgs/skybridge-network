import { Component, signal } from '@angular/core';
import { DeleteAccountForm } from '../../shared/account/delete-account-form';

@Component({
  selector: 'sb-delete-account-section',
  imports: [DeleteAccountForm],
  template: `
    <div class="sb-card mt-6 border-primary/30" data-testid="delete-account">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">Delete account</h2>
          <p class="text-sm text-muted">Remove your account and every piece of data we keep about you, as the LGPD allows.</p>
        </div>
        @if (!open()) {
          <button type="button" class="sb-btn-secondary w-auto border-primary/50 px-5 text-primary" (click)="open.set(true)" data-testid="open-delete">Delete my account</button>
        }
      </div>
    </div>

    @if (open()) {
      <div class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/90 p-6 backdrop-blur" role="dialog" aria-modal="true" data-testid="delete-dialog">
        <div class="w-full max-w-lg rounded-2xl border border-line bg-surface p-8 shadow-2xl">
          <p class="font-mono text-xs tracking-[0.25em] text-primary">PERMANENT ACTION</p>
          <h2 class="mt-2 font-display text-2xl font-bold">Delete your account?</h2>
          <div class="mt-5">
            <sb-delete-account-form (cancelled)="open.set(false)" />
          </div>
        </div>
      </div>
    }
  `
})
export class DeleteAccountSection {
  protected readonly open = signal(false);
}