import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Cockpit } from './cockpit';

@Component({
  selector: 'sb-cockpit-page',
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
    }
  `
})
export class CockpitPage {
  protected readonly auth = inject(AuthService);
}