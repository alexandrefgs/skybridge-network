import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { aUser } from '../../testing/users';
import { UserMenu } from './user-menu';

describe('UserMenu', () => {
  let fixture: ComponentFixture<UserMenu>;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(UserMenu);
    fixture.componentRef.setInput('user', aUser({ avatarUrl: '/api/users/1/avatar?v=1' }));
    fixture.detectChanges();
  });

  it('shows the name and the picture on the button', () => {
    expect(query('user-name')?.textContent).toContain('Ana Silva');
    expect(query('user-menu')?.querySelector('img')?.getAttribute('src')).toBe('/api/users/1/avatar?v=1');
    expect(query('user-menu-panel')).toBeNull();
  });

  it('opens the menu with settings and sign out', () => {
    query('user-menu')?.click();
    fixture.detectChanges();

    expect(query('user-menu-panel')?.textContent).toContain('ana@skybridge.test');
    expect(query('menu-settings')?.getAttribute('href')).toBe('/account/profile');
    expect(query('logout')).not.toBeNull();
    expect(query('user-menu')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes when clicking outside', () => {
    query('user-menu')?.click();
    fixture.detectChanges();

    document.body.click();
    fixture.detectChanges();

    expect(query('user-menu-panel')).toBeNull();
  });

  it('closes with Escape', () => {
    query('user-menu')?.click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(query('user-menu-panel')).toBeNull();
  });

  it('emits sign out and closes', () => {
    const signedOut = vi.fn();
    fixture.componentInstance.signedOut.subscribe(signedOut);
    query('user-menu')?.click();
    fixture.detectChanges();

    query('logout')?.click();
    fixture.detectChanges();

    expect(signedOut).toHaveBeenCalled();
    expect(query('user-menu-panel')).toBeNull();
  });
});