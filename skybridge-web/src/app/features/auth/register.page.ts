import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { problemMessages } from '../../core/http/problem';

@Component({
  selector: 'sb-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-md">
      <div class="sb-card">
        <h1 class="font-display text-2xl font-bold">Create your account</h1>
        <p class="mt-1 text-sm text-muted">Free and open to everyone. Pick a plane and go.</p>

        <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="sb-label" for="firstName">First name</label>
              <input class="sb-input" id="firstName" autocomplete="given-name" formControlName="firstName">
            </div>
            <div>
              <label class="sb-label" for="lastName">Last name</label>
              <input class="sb-input" id="lastName" autocomplete="family-name" formControlName="lastName">
            </div>
          </div>
          @if (nameInvalid()) {
            <p class="sb-field-error">Enter your first and last name.</p>
          }

          <div>
            <label class="sb-label" for="email">Email</label>
            <input class="sb-input" id="email" type="email" autocomplete="email" formControlName="email">
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <p class="sb-field-error">Enter a valid email.</p>
            }
          </div>

          <div>
            <label class="sb-label" for="password">Password</label>
            <input class="sb-input" id="password" type="password" autocomplete="new-password" formControlName="password">
            <p class="mt-1.5 text-xs text-muted">At least 8 characters, with upper and lower case letters, a number and a symbol.</p>
          </div>

          @for (error of errors(); track error) {
            <p class="sb-error" data-testid="form-error">{{ error }}</p>
          }

          <button class="sb-btn-primary" type="submit" [disabled]="busy()">Create account</button>
        </form>

        <p class="mt-6 text-center text-sm text-muted">
          Already flying with us?
          <a routerLink="/login" class="font-medium text-primary hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  `
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly errors = signal<string[]>([]);
  protected readonly busy = signal(false);

  protected readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    password: ['', Validators.required]
  });

  protected nameInvalid(): boolean {
    const { firstName, lastName } = this.form.controls;
    return (firstName.touched && firstName.invalid) || (lastName.touched && lastName.invalid);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.errors.set([]);
    this.auth
      .register(this.form.getRawValue())
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/cockpit'),
        error: error => this.errors.set(problemMessages(error))
      });
  }
}