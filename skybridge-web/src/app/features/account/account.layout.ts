import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'sb-account-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="mx-auto max-w-3xl">
      <p class="font-mono text-xs tracking-[0.2em] text-primary">ACCOUNT</p>
      <h1 class="mt-1 font-display text-3xl font-bold">Settings</h1>

      <nav class="mt-6 flex gap-1 border-b border-line text-sm" data-testid="account-tabs">
        @for (tab of tabs; track tab.path) {
          <a [routerLink]="tab.path" routerLinkActive="!border-primary !text-foreground"
            class="-mb-px border-b-2 border-transparent px-4 py-2 text-muted transition-colors hover:text-foreground">{{ tab.label }}</a>
        }
      </nav>

      <div class="mt-6">
        <router-outlet />
      </div>
    </div>
  `
})
export class AccountLayout {
  protected readonly tabs = [
    { path: 'profile', label: 'Profile' },
    { path: 'security', label: 'Security' }
  ];
}