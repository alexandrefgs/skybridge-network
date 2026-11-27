import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Cockpit } from '../dashboard/cockpit';

@Component({
  selector: 'sb-home-page',
  imports: [RouterLink, Cockpit],
  template: `
    @if (auth.currentUser(); as user) {
      @if (!user.twoFactorEnabled) {
        <div class="sb-card mb-8 flex flex-wrap items-center justify-between gap-4 p-6" data-testid="two-factor-tip">
          <div>
            <p class="font-semibold">Protect your account</p>
            <p class="text-sm text-muted">Turn on two-factor authentication with an authenticator app.</p>
          </div>
          <a routerLink="/account/security" class="sb-btn-primary w-auto">Enable 2FA</a>
        </div>
      }
      <sb-cockpit [firstName]="user.firstName" />
    } @else {
      <section class="py-10">
        <p class="font-mono text-xs tracking-[0.2em] text-primary">FLY ANYTHING · ANYWHERE</p>
        <h1 class="mt-3 max-w-2xl font-display text-5xl font-bold leading-tight">Your sky. Your rules.</h1>
        <p class="mt-4 max-w-xl text-lg text-muted">
          Real airlines, freelance jobs and your own company, from a Cessna 172 to a 777.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a routerLink="/register" class="sb-btn-primary w-auto px-6">Start flying</a>
          <a routerLink="/login" class="sb-btn-secondary w-auto px-6">Sign in</a>
        </div>
      </section>
    }
  `
})
export class HomePage {
  protected readonly auth = inject(AuthService);
}