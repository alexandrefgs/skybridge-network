import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrentUser } from '../../core/auth/auth.models';
import { Avatar } from '../avatar/avatar';

@Component({
  selector: 'sb-user-menu',
  imports: [RouterLink, Avatar],
  host: {
    class: 'relative',
    '(document:click)': 'closeOutside($event)',
    '(document:keydown.escape)': 'open.set(false)'
  },
  template: `
    <button
      type="button"
      data-testid="user-menu"
      (click)="open.set(!open())"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      [class.border-line]="open()"
      [class.text-foreground]="open()"
      class="flex items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-2.5 text-muted transition-colors hover:border-line hover:text-foreground">
      <sb-avatar class="h-8 w-8" [url]="user().avatarUrl" />
      <span class="hidden sm:inline" data-testid="user-name">{{ fullName() }}</span>
      <svg class="h-4 w-4 transition-transform" [class.rotate-180]="open()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    @if (open()) {
      <div role="menu" data-testid="user-menu-panel"
        class="absolute right-0 z-[1100] mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-xl shadow-black/30">
        <div class="flex items-center gap-3 border-b border-line px-4 py-3">
          <sb-avatar class="h-10 w-10" [url]="user().avatarUrl" />
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">{{ fullName() }}</p>
            <p class="truncate text-xs text-muted">{{ user().email }}</p>
          </div>
        </div>
        <div class="p-1.5">
          <a role="menuitem" routerLink="/account/profile" (click)="open.set(false)" data-testid="menu-settings"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
            Profile settings
          </a>
          <button role="menuitem" type="button" (click)="signOut()" data-testid="logout"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-primary/10 hover:text-primary">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    }
  `
})
export class UserMenu {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly user = input.required<CurrentUser>();
  readonly signedOut = output<void>();

  protected readonly open = signal(false);
  protected readonly fullName = computed(() => `${this.user().firstName} ${this.user().lastName}`);

  protected closeOutside(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  protected signOut(): void {
    this.open.set(false);
    this.signedOut.emit();
  }
}