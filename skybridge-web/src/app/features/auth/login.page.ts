import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { problemMessages } from '../../core/http/problem';

@Component({
  selector: 'sb-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-md">
      <div class="sb-card">
        @if (step() === 'credentials') {
          <h1 class="font-display text-2xl font-bold">Welcome back</h1>
          <p class="mt-1 text-sm text-muted">Sign in to continue flying.</p>

          <form class="mt-6 space-y-4" [formGroup]="credentials" (ngSubmit)="submitCredentials()" novalidate>
            <div>
              <label class="sb-label" for="email">Email</label>
              <input class="sb-input" id="email" type="email" autocomplete="email" formControlName="email">
              @if (credentials.controls.email.touched && credentials.controls.email.invalid) {
                <p class="sb-field-error">Enter a valid email.</p>
              }
            </div>
            <div>
              <label class="sb-label" for="password">Password</label>
              <input class="sb-input" id="password" type="password" autocomplete="current-password" formControlName="password">
              @if (credentials.controls.password.touched && credentials.controls.password.invalid) {
                <p class="sb-field-error">Enter your password.</p>
              }
            </div>

            @for (error of errors(); track error) {
              <p class="sb-error" data-testid="form-error">{{ error }}</p>
            }

            <button class="sb-btn-primary" type="submit" [disabled]="busy()">Sign in</button>
          </form>

          <p class="mt-6 text-center text-sm text-muted">
            New to SkyBridge?
            <a routerLink="/register" class="font-medium text-primary hover:underline">Create an account</a>
          </p>
        } @else {
          <h1 class="font-display text-2xl font-bold">Two-factor authentication</h1>
          <p class="mt-1 text-sm text-muted">Enter the 6-digit code from your authenticator app, or one of your recovery codes.</p>

          <form class="mt-6 space-y-4" [formGroup]="twoFactor" (ngSubmit)="submitTwoFactor()" novalidate data-testid="two-factor-form">
            <div>
              <label class="sb-label" for="code">Verification code</label>
              <input class="sb-input text-center font-mono text-lg tracking-[0.4em]" id="code" type="text"
                inputmode="numeric" autocomplete="one-time-code" maxlength="20" formControlName="code">
            </div>

            @for (error of errors(); track error) {
              <p class="sb-error" data-testid="form-error">{{ error }}</p>
            }

            <button class="sb-btn-primary" type="submit" [disabled]="busy()">Verify</button>
            <button class="sb-btn-ghost" type="button" (click)="backToCredentials()">Back to sign in</button>
          </form>
        }
      </div>
    </div>
  `
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private twoFactorToken = '';

  protected readonly step = signal<'credentials' | 'twoFactor'>('credentials');
  protected readonly errors = signal<string[]>([]);
  protected readonly busy = signal(false);

  protected readonly credentials = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  protected readonly twoFactor = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(20)]]
  });

  protected submitCredentials(): void {
    if (this.credentials.invalid) {
      this.credentials.markAllAsTouched();
      return;
    }
    const { email, password } = this.credentials.getRawValue();
    this.run(this.auth.login(email, password), response => {
      if (response.requiresTwoFactor && response.twoFactorToken) {
        this.twoFactorToken = response.twoFactorToken;
        this.step.set('twoFactor');
      } else {
        void this.router.navigateByUrl('/');
      }
    });
  }

  protected submitTwoFactor(): void {
    if (this.twoFactor.invalid) {
      this.twoFactor.markAllAsTouched();
      return;
    }
    this.run(this.auth.loginWithTwoFactor(this.twoFactorToken, this.twoFactor.getRawValue().code), () =>
      void this.router.navigateByUrl('/')
    );
  }

  protected backToCredentials(): void {
    this.twoFactor.reset();
    this.errors.set([]);
    this.step.set('credentials');
  }

  private run<T>(source: Observable<T>, onSuccess: (value: T) => void): void {
    this.busy.set(true);
    this.errors.set([]);
    source.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: onSuccess,
      error: error => this.errors.set(problemMessages(error))
    });
  }
}