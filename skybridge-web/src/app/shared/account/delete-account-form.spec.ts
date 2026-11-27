import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signInAs } from '../../testing/jwt';
import { DeleteAccountForm } from './delete-account-form';

describe('DeleteAccountForm', () => {
  let fixture: ComponentFixture<DeleteAccountForm>;
  let http: HttpTestingController;
  const query = <T extends HTMLElement>(id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as T;

  beforeEach(async () => {
    localStorage.clear();
    signInAs(['Pilot']);
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DeleteAccountForm);
    fixture.componentRef.setInput('reason', 'You declined the new regulations.');
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  async function fill(password: string, understood: boolean) {
    const input = query<HTMLInputElement>('delete-password');
    input.value = password;
    input.dispatchEvent(new Event('input'));
    const box = query<HTMLInputElement>('delete-understood');
    box.checked = understood;
    box.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  it('warns that the deletion is permanent and needs the password and the confirmation', async () => {
    expect(query('delete-warning').textContent).toContain('You declined the new regulations.');
    expect(query('delete-warning').textContent).toContain('cannot be undone');
    expect(query<HTMLButtonElement>('delete-confirm').disabled).toBe(true);

    await fill('secret', false);
    expect(query<HTMLButtonElement>('delete-confirm').disabled).toBe(true);
    await fill('secret', true);
    expect(query<HTMLButtonElement>('delete-confirm').disabled).toBe(false);
  });

  it('deletes the account and goes home', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    let deleted = false;
    fixture.componentInstance.deleted.subscribe(() => (deleted = true));
    await fill('secret', true);

    query<HTMLFormElement>('delete-form').dispatchEvent(new Event('submit'));
    http.expectOne({ method: 'DELETE', url: '/api/account' }).flush(null);
    await fixture.whenStable();

    expect(deleted).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/');
    expect(localStorage.getItem('sb-token')).toBeNull();
  });

  it('shows a wrong password', async () => {
    await fill('wrong', true);

    query<HTMLFormElement>('delete-form').dispatchEvent(new Event('submit'));
    http.expectOne('/api/account').flush(
      { title: 'One or more validation errors occurred.', errors: { Password: ['Wrong password.'] } },
      { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();

    expect(query('delete-error').textContent).toContain('Wrong password.');
    expect(localStorage.getItem('sb-token')).not.toBeNull();
  });
});