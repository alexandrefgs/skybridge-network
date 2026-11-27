import { Component, HostListener, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { NavItem } from './nav-dropdown';

@Component({
  selector: 'sb-mobile-menu',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <button type="button" class="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-primary hover:text-primary"
      [attr.aria-expanded]="open()" aria-controls="mobile-menu" [attr.aria-label]="open() ? 'Close menu' : 'Open menu'"
      (click)="open.set(!open())" data-testid="mobile-menu-toggle">
      <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        @if (open()) {
          <path d="M6 6l12 12M18 6 6 18" />
        } @else {
          <path d="M4 7h16M4 12h16M4 17h16" />
        }
      </svg>
    </button>

    @if (open()) {
      <nav id="mobile-menu" class="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-line bg-background px-6 pb-10 pt-6" aria-label="Main" data-testid="mobile-menu">
        @if (auth.currentUser(); as user) {
          <p class="text-sm text-muted">Signed in as <span class="font-medium text-foreground">{{ user.firstName }} {{ user.lastName }}</span></p>

          <p class="mt-6 font-mono text-[10px] tracking-[0.2em] text-primary">PILOT</p>
          <ul class="mt-2 divide-y divide-line border-y border-line">
            @for (item of pilotItems(); track item.link) {
              <li><a [routerLink]="item.link" routerLinkActive="text-primary" class="block py-3 text-lg font-medium" (click)="close()">{{ item.label }}</a></li>
            }
            <li><a routerLink="/freelance" routerLinkActive="text-primary" class="block py-3 text-lg font-medium" (click)="close()" data-testid="m-freelance">Freelance</a></li>
            <li><a routerLink="/airlines" routerLinkActive="text-primary" class="block py-3 text-lg font-medium" (click)="close()">Airlines</a></li>
            @if (auth.isStaff()) {
              <li><a routerLink="/admin" routerLinkActive="text-primary" class="block py-3 text-lg font-medium" (click)="close()" data-testid="m-admin">Admin</a></li>
            }
          </ul>

          <p class="mt-6 font-mono text-[10px] tracking-[0.2em] text-primary">ABOUT US</p>
          <ul class="mt-2 divide-y divide-line border-y border-line">
            @for (item of aboutItems(); track item.link) {
              <li><a [routerLink]="item.link" routerLinkActive="text-primary" class="block py-3 text-muted hover:text-foreground" (click)="close()">{{ item.label }}</a></li>
            }
          </ul>

          <div class="mt-8 grid grid-cols-2 gap-3">
            <a routerLink="/account/profile" class="sb-btn-secondary" (click)="close()" data-testid="m-settings">Settings</a>
            <button type="button" class="sb-btn-secondary" (click)="signOut()" data-testid="m-logout">Sign out</button>
          </div>
        } @else if (!auth.isSignedIn()) {
          <ul class="divide-y divide-line border-y border-line">
            @for (item of publicItems; track item.link) {
              <li><a [routerLink]="item.link" routerLinkActive="text-primary" class="block py-3 text-lg font-medium" (click)="close()">{{ item.label }}</a></li>
            }
          </ul>
          <div class="mt-8 grid gap-3">
            <a routerLink="/register" class="sb-btn-primary py-3" (click)="close()" data-testid="m-register">Create account</a>
            <a routerLink="/login" class="sb-btn-secondary py-3" (click)="close()" data-testid="m-login">Sign in</a>
          </div>
        }
      </nav>
    }
  `
})
export class MobileMenu {
  protected readonly auth = inject(AuthService);

  readonly aboutItems = input<NavItem[]>([]);
  readonly pilotItems = input<NavItem[]>([]);
  readonly signedOut = output<void>();

  protected readonly open = signal(false);
  protected readonly publicItems = [
    { label: 'About', link: '/about' },
    { label: 'Operations', link: '/operations' },
    { label: 'Flights', link: '/flights' },
    { label: 'Staff', link: '/staff' },
    { label: 'Regulations', link: '/regulations' }
  ];

  constructor() {
    inject(Router)
      .events.pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.open.set(false));
  }

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.open.set(false);
  }

  protected signOut(): void {
    this.open.set(false);
    this.signedOut.emit();
  }
}