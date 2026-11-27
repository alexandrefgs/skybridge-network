import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DeleteAccountSection } from './delete-account-section';

describe('DeleteAccountSection', () => {
  let fixture: ComponentFixture<DeleteAccountSection>;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    fixture = TestBed.createComponent(DeleteAccountSection);
    await fixture.whenStable();
  });

  it('opens a confirmation dialog warning that the deletion is permanent', async () => {
    expect(query('delete-dialog')).toBeNull();

    query('open-delete')!.click();
    await fixture.whenStable();

    expect(query('delete-dialog')!.textContent).toContain('PERMANENT ACTION');
    expect(query('delete-warning')!.textContent).toContain('cannot be undone');
  });

  it('closes the dialog when the pilot gives up', async () => {
    query('open-delete')!.click();
    await fixture.whenStable();
    query('delete-cancel')!.click();
    await fixture.whenStable();

    expect(query('delete-dialog')).toBeNull();
  });
});