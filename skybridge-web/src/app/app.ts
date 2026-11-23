import { Component, effect, inject, untracked } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';
import { NavDropdown, NavItem } from './shared/layout/nav-dropdown';
import { UserMenu } from './shared/layout/user-menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, UserMenu, NavDropdown],
  templateUrl: './app.html'
})
export class App {
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);
  protected readonly auth = inject(AuthService);

  protected readonly aboutItems: NavItem[] = [
    { label: 'Airports', link: '/airports', description: 'Every airport and its runways' },
    { label: 'Aircraft', link: '/aircraft', description: 'Types, categories and hours to unlock' }
  ];

  constructor() {
    effect(() => {
      if (this.auth.isSignedIn() && !untracked(this.auth.currentUser)) {
        this.auth.loadCurrentUser().subscribe({ error: () => undefined });
      }
    });
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}