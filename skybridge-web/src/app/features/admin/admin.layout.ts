import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'sb-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <p class="font-mono text-xs tracking-[0.2em] text-primary">STAFF</p>
    <h1 class="mt-1 font-display text-3xl font-bold">Admin</h1>

    <nav class="mt-6 flex gap-1 border-b border-line text-sm" data-testid="admin-tabs">
      @for (tab of tabs; track tab.path) {
        <a [routerLink]="tab.path" routerLinkActive="!border-primary !text-foreground"
          class="-mb-px border-b-2 border-transparent px-4 py-2 text-muted transition-colors hover:text-foreground">{{ tab.label }}</a>
      }
    </nav>

    <div class="mt-6">
      <router-outlet />
    </div>
  `
})
export class AdminLayout {
  protected readonly tabs = [
    { path: 'categories', label: 'Categories' },
    { path: 'aircraft-types', label: 'Aircraft types' },
    { path: 'airlines', label: 'Airlines' },
    { path: 'airports', label: 'Airports' },
    { path: 'freelance', label: 'Freelance' }
  ];
}