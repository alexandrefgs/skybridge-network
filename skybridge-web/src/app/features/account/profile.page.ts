import { Component, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, finalize } from 'rxjs';
import { ProfileService } from '../../core/account/profile.service';
import { AuthService } from '../../core/auth/auth.service';
import { problemMessages } from '../../core/http/problem';
import { Avatar } from '../../shared/avatar/avatar';
import { ImageResizer } from '../../shared/images/image-resizer';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

@Component({
  selector: 'sb-profile-page',
  imports: [ReactiveFormsModule, Avatar],
  template: `
    @if (auth.currentUser(); as user) {
      <section class="overflow-hidden rounded-xl border border-line bg-surface">
        <div class="relative h-32 bg-gradient-to-br from-primary/40 via-surface-2 to-surface" data-testid="cover">
          <span class="absolute right-3 top-3 rounded-full border border-line bg-surface/80 px-2.5 py-1 text-xs text-muted">Cover photo coming soon</span>
        </div>

        <div class="flex flex-wrap items-end gap-5 px-6 pb-6">
          <sb-avatar class="relative -mt-12 h-28 w-28 ring-4 !ring-surface" [url]="user.avatarUrl" [alt]="user.firstName" data-testid="profile-avatar" />
          <div class="min-w-0 flex-1 pb-1">
            <p class="truncate font-display text-2xl font-bold">{{ user.firstName }} {{ user.lastName }}</p>
            <p class="truncate text-sm text-muted">{{ user.email }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <label class="sb-btn-secondary w-auto cursor-pointer" [class.pointer-events-none]="uploading()" [class.opacity-60]="uploading()">
              {{ uploading() ? 'Uploading…' : 'Change photo' }}
              <input class="sr-only" type="file" accept="image/png,image/jpeg,image/webp" (change)="choosePhoto($event)" data-testid="avatar-file" />
            </label>
            @if (user.avatarUrl) {
              <button class="sb-btn-ghost w-auto" type="button" (click)="removePhoto()" [disabled]="uploading()" data-testid="remove-avatar">Remove</button>
            }
          </div>
        </div>

        <div class="space-y-3 px-6 pb-6">
          <p class="text-xs text-muted">JPG, PNG or WebP. We crop it to a square.</p>
          @for (error of photoErrors(); track error) {
            <p class="sb-error" data-testid="photo-error">{{ error }}</p>
          }
        </div>
      </section>

      <form class="sb-card mt-6 space-y-5" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div>
          <h2 class="text-lg font-semibold">Personal details</h2>
          <p class="text-sm text-muted">This is how other pilots see you on SkyBridge.</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="sb-label" for="firstName">First name</label>
            <input class="sb-input" id="firstName" autocomplete="given-name" formControlName="firstName" />
          </div>
          <div>
            <label class="sb-label" for="lastName">Last name</label>
            <input class="sb-input" id="lastName" autocomplete="family-name" formControlName="lastName" />
          </div>
        </div>
        @if (nameInvalid()) {
          <p class="sb-field-error !mt-2">Enter your first and last name.</p>
        }

        <div>
          <label class="sb-label" for="email">Email</label>
          <input class="sb-input cursor-not-allowed opacity-70" id="email" [value]="user.email" disabled />
        </div>

        @for (error of errors(); track error) {
          <p class="sb-error">{{ error }}</p>
        }
        @if (saved()) {
          <p class="sb-success" data-testid="profile-saved">Profile saved.</p>
        }

        <button class="sb-btn-primary w-auto" type="submit" [disabled]="busy()">Save changes</button>
      </form>
    }
  `
})
export class ProfilePage {
  protected readonly auth = inject(AuthService);
  private readonly profiles = inject(ProfileService);
  private readonly resizer = inject(ImageResizer);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly busy = signal(false);
  protected readonly saved = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly uploading = signal(false);
  protected readonly photoErrors = signal<string[]>([]);
  private readonly submitted = signal(false);

  protected readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]]
  });

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user && this.form.pristine) this.form.reset({ firstName: user.firstName, lastName: user.lastName });
    });
  }

  protected save(): void {
    this.saved.set(false);
    this.submitted.set(true);
    if (this.form.invalid) return;

    this.busy.set(true);
    this.errors.set([]);
    this.profiles.update(this.form.getRawValue()).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: user => {
        this.form.reset({ firstName: user.firstName, lastName: user.lastName });
        this.submitted.set(false);
        this.saved.set(true);
      },
      error: error => this.errors.set(problemMessages(error))
    });
  }

  protected async choosePhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.photoErrors.set([]);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.photoErrors.set(['Use a JPG, PNG or WebP picture.']);
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      this.photoErrors.set(['Choose a picture up to 10 MB.']);
      return;
    }

    this.uploading.set(true);
    try {
      const image = await this.resizer.squareCrop(file);
      this.runPhoto(this.profiles.uploadAvatar(image));
    } catch {
      this.uploading.set(false);
      this.photoErrors.set(['Could not read the picture. Try another one.']);
    }
  }

  protected nameInvalid(): boolean {
    return this.submitted() && this.form.invalid;
  }

  protected removePhoto(): void {
    this.photoErrors.set([]);
    this.uploading.set(true);
    this.runPhoto(this.profiles.removeAvatar());
  }

  private runPhoto(source: Observable<unknown>): void {
    source.pipe(finalize(() => this.uploading.set(false))).subscribe({
      error: error => this.photoErrors.set(problemMessages(error))
    });
  }
}