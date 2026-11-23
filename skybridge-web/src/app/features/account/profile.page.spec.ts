import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth.service';
import { ImageResizer } from '../../shared/images/image-resizer';
import { aUser } from '../../testing/users';
import { ProfilePage } from './profile.page';

describe('ProfilePage', () => {
  let fixture: ComponentFixture<ProfilePage>;
  let http: HttpTestingController;
  let auth: AuthService;
  const squareCrop = vi.fn();

  const query = <T extends HTMLElement>(selector: string) => fixture.nativeElement.querySelector(selector) as T | null;
  const byId = <T extends HTMLElement>(id: string) => query<T>(`[data-testid="${id}"]`);

  async function choose(file: File): Promise<void> {
    const input = byId<HTMLInputElement>('avatar-file')!;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    squareCrop.mockReset();
    squareCrop.mockResolvedValue(new Blob(['small'], { type: 'image/webp' }));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ImageResizer, useValue: { squareCrop } }]
    });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    auth.currentUser.set(aUser());
    fixture = TestBed.createComponent(ProfilePage);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('shows the default picture and fills the form', () => {
    expect(byId('profile-avatar')?.querySelector('img')?.getAttribute('src')).toBe('avatar-default.svg');
    expect(query<HTMLInputElement>('#firstName')?.value).toBe('Ana');
    expect(query<HTMLInputElement>('#lastName')?.value).toBe('Silva');
    expect(query<HTMLInputElement>('#email')?.disabled).toBe(true);
    expect(byId('remove-avatar')).toBeNull();
  });

  it('saves the name', async () => {
    const firstName = query<HTMLInputElement>('#firstName')!;
    firstName.value = 'Ana Clara';
    firstName.dispatchEvent(new Event('input'));
    query<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));

    const request = http.expectOne('/api/account/profile');
    expect(request.request.body).toEqual({ firstName: 'Ana Clara', lastName: 'Silva' });
    request.flush(aUser({ firstName: 'Ana Clara' }));
    await fixture.whenStable();

    expect(byId('profile-saved')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Ana Clara Silva');
  });

  it('does not save a blank name', async () => {
    const lastName = query<HTMLInputElement>('#lastName')!;
    lastName.value = '   ';
    lastName.dispatchEvent(new Event('input'));
    query<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    http.expectNone('/api/account/profile');
    expect(fixture.nativeElement.textContent).toContain('Enter your first and last name.');
  });

  it('crops and uploads a new photo', async () => {
    const file = new File(['photo'], 'me.jpg', { type: 'image/jpeg' });

    await choose(file);

    expect(squareCrop).toHaveBeenCalledWith(file);
    http.expectOne('/api/account/avatar').flush(aUser({ avatarUrl: '/api/users/1/avatar?v=2' }));
    await fixture.whenStable();

    expect(byId('profile-avatar')?.querySelector('img')?.getAttribute('src')).toBe('/api/users/1/avatar?v=2');
    expect(byId('remove-avatar')).not.toBeNull();
  });

  it('rejects files that are not pictures', async () => {
    await choose(new File(['gif'], 'me.gif', { type: 'image/gif' }));

    expect(squareCrop).not.toHaveBeenCalled();
    expect(byId('photo-error')?.textContent).toContain('JPG, PNG or WebP');
  });

  it('shows an error when the picture cannot be read', async () => {
    squareCrop.mockRejectedValue(new Error('broken'));

    await choose(new File(['photo'], 'me.png', { type: 'image/png' }));

    expect(byId('photo-error')?.textContent).toContain('Could not read the picture');
  });

  it('removes the photo', async () => {
    auth.currentUser.set(aUser({ avatarUrl: '/api/users/1/avatar?v=1' }));
    await fixture.whenStable();

    byId('remove-avatar')!.click();
    const request = http.expectOne('/api/account/avatar');
    expect(request.request.method).toBe('DELETE');
    request.flush(aUser());
    await fixture.whenStable();

    expect(byId('profile-avatar')?.querySelector('img')?.getAttribute('src')).toBe('avatar-default.svg');
  });
});