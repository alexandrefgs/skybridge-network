import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { signInAs } from '../../testing/jwt';
import { MobileMenu } from './mobile-menu';

@Component({ template: '' })
class Blank {}

describe('MobileMenu', () => {
  let fixture: ComponentFixture<MobileMenu>;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  async function render() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', component: Blank }])]
    });
    fixture = TestBed.createComponent(MobileMenu);
    fixture.componentRef.setInput('pilotItems', [{ label: 'Cockpit', link: '/cockpit', description: '' }]);
    fixture.componentRef.setInput('aboutItems', [{ label: 'Operations', link: '/operations', description: '' }]);
    await fixture.whenStable();
  }

  async function toggle() {
    query('mobile-menu-toggle')!.click();
    await fixture.whenStable();
  }

  beforeEach(() => localStorage.clear());

  it('opens the public links and the sign up buttons for guests', async () => {
    await render();
    expect(query('mobile-menu')).toBeNull();

    await toggle();

    expect(query('mobile-menu')!.textContent).toContain('Operations');
    expect(query('mobile-menu')!.textContent).toContain('Regulations');
    expect(query('m-register')!.getAttribute('href')).toBe('/register');
    expect(query('mobile-menu-toggle')!.getAttribute('aria-expanded')).toBe('true');
  });

  it('shows the pilot links, admin for staff and signs out', async () => {
    signInAs(['Staff', 'Pilot']);
    await render();
    TestBed.inject(AuthService).currentUser.set({
      id: '1', email: 'bia@skybridge.test', firstName: 'Bia', lastName: 'Costa', twoFactorEnabled: true, roles: ['Staff', 'Pilot'], avatarUrl: null
    });
    let signedOut = false;
    fixture.componentInstance.signedOut.subscribe(() => (signedOut = true));
    await toggle();

    expect(query('mobile-menu')!.textContent).toContain('Bia Costa');
    expect(query('mobile-menu')!.textContent).toContain('Cockpit');
    expect(query('m-admin')).not.toBeNull();

    query('m-logout')!.click();
    await fixture.whenStable();
    expect(signedOut).toBe(true);
    expect(query('mobile-menu')).toBeNull();
  });

  it('closes after navigating', async () => {
    await render();
    await toggle();

    await TestBed.inject(Router).navigateByUrl('/operations');
    await fixture.whenStable();

    expect(query('mobile-menu')).toBeNull();
  });
});