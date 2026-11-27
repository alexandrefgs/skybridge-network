import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signInAs } from '../../testing/jwt';
import { AdminLayout } from './admin.layout';

describe('AdminLayout', () => {
  let fixture: ComponentFixture<AdminLayout>;
  const tabs = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="admin-tabs"] a')).map(a => a.textContent!.trim());

  async function render(roles: string[]) {
    localStorage.clear();
    signInAs(roles);
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(AdminLayout);
    await fixture.whenStable();
  }

  it('shows the staff tab to admins', async () => {
    await render(['Admin']);

    expect(tabs()).toContain('Staff');
  });

  it('hides the staff tab from staff members', async () => {
    await render(['Staff']);

    expect(tabs()).toContain('PIREPs');
    expect(tabs()).not.toContain('Staff');
  });
});