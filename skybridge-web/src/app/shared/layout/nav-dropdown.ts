import { Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';

export interface NavItem {
  label: string;
  link: string;
  description?: string;
}

@Component({
  selector: 'sb-nav-dropdown',
  imports: [RouterLink, RouterLinkActive],
  host: {
    class: 'relative',
    '(document:click)': 'closeOutside($event)',
    '(document:keydown.escape)': 'open.set(false)'
  },
  template: `
    <button
      type="button"
      (click)="open.set(!open())"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      [attr.data-testid]="testId()"
      [class.text-primary]="active()"
      [class.text-muted]="!active()"
      class="flex items-center gap-1 rounded-md px-3 py-1.5 transition-colors hover:text-foreground">
      {{ label() }}
      <svg class="h-3.5 w-3.5 transition-transform" [class.rotate-180]="open()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    @if (open()) {
      <div role="menu" [attr.data-testid]="testId() + '-panel'"
        class="absolute left-0 z-[1100] mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-xl shadow-black/30">
        @for (item of items(); track item.link) {
          <a role="menuitem" [routerLink]="item.link" routerLinkActive="!text-primary" [routerLinkActiveOptions]="{ exact: item.link === '/' }" (click)="open.set(false)"
            [attr.data-testid]="testId() + '-' + (item.link.replace('/', '') || 'home')"
            class="block rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-2">
            {{ item.label }}
            @if (item.description) {
              <span class="block text-xs text-muted">{{ item.description }}</span>
            }
          </a>
        }
      </div>
    }
  `
})
export class NavDropdown {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);

  readonly label = input.required<string>();
  readonly items = input.required<NavItem[]>();
  readonly testId = input('nav-dropdown');

  protected readonly open = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly active = computed(() => {
    const url = this.url();
    return this.items().some(item => url === item.link || url.startsWith(item.link + '/') || url.startsWith(item.link + '?'));
  });

  protected closeOutside(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }
}