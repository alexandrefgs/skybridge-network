import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, finalize } from 'rxjs';
import { renderSVG } from 'uqr';
import { TwoFactorSetup } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { problemMessages } from '../../core/http/problem';
import { CodeInput } from '../../shared/forms/code-input';
import { DeleteAccountSection } from './delete-account-section';

@Component({
  selector: 'sb-security-page',
  imports: [ReactiveFormsModule, CodeInput, DeleteAccountSection],
  template: `
    <div>
      <p class="text-muted">Manage how you sign in to SkyBridge.</p>

      <div class="sb-card mt-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold">Two-factor authentication</h2>
            <p class="text-sm text-muted">Use an authenticator app (Google Authenticator, Microsoft Authenticator, Authy…).</p>
          </div>
          @if (enabled()) {
            <span class="sb-badge-on" data-testid="two-factor-status">Enabled</span>
          } @else {
            <span class="sb-badge-off" data-testid="two-factor-status">Disabled</span>
          }
        </div>

        <div class="mt-6 border-t border-line pt-6">
          @if (recoveryCodes(); as codes) {
            <h3 class="font-semibold">Save your recovery codes</h3>
            <p class="mt-1 text-sm text-muted">
              Each code works once, if you lose access to your authenticator app. Keep them somewhere safe. They won't be shown again.
            </p>
            <ul class="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-surface-2 p-4 font-mono text-sm sm:grid-cols-5" data-testid="recovery-codes">
              @for (code of codes; track code) {
                <li class="text-center">{{ code }}</li>
              }
            </ul>
            <div class="mt-4 flex flex-wrap gap-3">
              <button class="sb-btn-secondary w-auto" type="button" (click)="copyCodes(codes)">{{ copied() ? 'Copied' : 'Copy codes' }}</button>
              <button class="sb-btn-primary w-auto" type="button" (click)="recoveryCodes.set(null)">I've saved them</button>
            </div>
          } @else if (enabled()) {
            <form class="space-y-4" [formGroup]="codeForm" (ngSubmit)="disable()" novalidate>
              <p class="text-sm text-muted">To turn off two-factor authentication, enter a code from your authenticator app.</p>
              <div class="max-w-xs">
                <span class="sb-label">Verification code</span>
                <sb-code-input formControlName="code" [invalid]="errors().length > 0" data-testid="disable-code" />
              </div>
              @for (error of errors(); track error) {
                <p class="sb-error">{{ error }}</p>
              }
              <button class="sb-btn-danger" type="submit" [disabled]="busy()">Disable two-factor</button>
            </form>
          } @else if (setup(); as current) {
            <div class="grid gap-6 sm:grid-cols-[auto_1fr]">
              <div class="h-48 w-48 rounded-lg bg-white p-2 [&>svg]:h-full [&>svg]:w-full" [innerHTML]="qrCode()" data-testid="qr-code"></div>
              <div>
                <p class="text-sm"><span class="font-semibold">1.</span> Scan the QR code with your authenticator app.</p>
                <p class="mt-2 text-sm text-muted">Can't scan it? Enter this key manually:</p>
                <p class="mt-1 select-all rounded-md bg-surface-2 px-3 py-2 font-mono text-sm" data-testid="shared-key">{{ current.sharedKey }}</p>

                <form class="mt-5 space-y-4" [formGroup]="codeForm" (ngSubmit)="enable()" novalidate>
                  <div>
                    <span class="sb-label"><span class="font-semibold">2.</span> Enter the 6-digit code from the app</span>
                    <sb-code-input class="max-w-xs" formControlName="code" [invalid]="errors().length > 0" data-testid="enable-code" />
                  </div>
                  @for (error of errors(); track error) {
                    <p class="sb-error">{{ error }}</p>
                  }
                  <button class="sb-btn-primary w-auto" type="submit" [disabled]="busy()">Verify and enable</button>
                </form>
              </div>
            </div>
          } @else {
            <p class="text-sm text-muted">Add a second step to your sign-in. Even if someone gets your password, they won't get in.</p>
            @for (error of errors(); track error) {
              <p class="sb-error mt-4">{{ error }}</p>
            }
            <button class="sb-btn-primary mt-4 w-auto" type="button" (click)="startSetup()" [disabled]="busy()" data-testid="start-setup">
              Set up authenticator
            </button>
          }
        </div>
      </div>

      <sb-delete-account-section />
    </div>
  `
})
export class SecurityPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly setup = signal<TwoFactorSetup | null>(null);
  protected readonly recoveryCodes = signal<string[] | null>(null);
  protected readonly errors = signal<string[]>([]);
  protected readonly busy = signal(false);
  protected readonly copied = signal(false);
  protected readonly enabled = computed(() => this.auth.currentUser()?.twoFactorEnabled ?? false);

  protected readonly qrCode = computed<SafeHtml | null>(() => {
    const current = this.setup();
    if (!current) return null;
    const svg = renderSVG(current.authenticatorUri, { pixelSize: 5, border: 1, blackColor: '#0a0a0b', whiteColor: '#ffffff' });
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  });

  protected readonly codeForm = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(20)]]
  });

  ngOnInit(): void {
    if (!this.auth.currentUser()) this.auth.loadCurrentUser().subscribe({ error: () => undefined });
  }

  protected startSetup(): void {
    this.run(this.auth.setupTwoFactor(), setup => this.setup.set(setup));
  }

  protected enable(): void {
    if (this.codeForm.invalid) return;
    this.run(this.auth.enableTwoFactor(this.codeForm.getRawValue().code), result => {
      this.setup.set(null);
      this.codeForm.reset();
      this.recoveryCodes.set(result.recoveryCodes);
    });
  }

  protected disable(): void {
    if (this.codeForm.invalid) return;
    this.run(this.auth.disableTwoFactor(this.codeForm.getRawValue().code), () => this.codeForm.reset());
  }

  protected copyCodes(codes: string[]): void {
    void navigator.clipboard?.writeText(codes.join('\n')).then(() => this.copied.set(true));
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