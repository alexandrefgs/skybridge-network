import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { problemMessages } from '../../core/http/problem';
import { Pilot } from '../../core/pilot/pilot.models';
import { PilotService } from '../../core/pilot/pilot.service';
import { networkIdValidators, toNetworkId } from '../../shared/forms/network-ids';

@Component({
  selector: 'sb-network-settings',
  imports: [ReactiveFormsModule],
  template: `
    <form class="sb-card mt-6 space-y-4" (submit)="save($event)" novalidate data-testid="network-form">
      <div>
        <h2 class="text-lg font-semibold">Online networks</h2>
        <p class="text-sm text-muted">Your VATSIM CID and IVAO VID. We use them only to count SkyBridge pilots online. Leave empty if you fly offline.</p>
      </div>

      <div class="grid max-w-md gap-4 sm:grid-cols-2">
        <div>
          <label class="sb-label" for="vatsim-id">VATSIM CID</label>
          <input id="vatsim-id" class="sb-input font-mono" inputmode="numeric" maxlength="8" placeholder="1234567" [formControl]="vatsim" data-testid="vatsim-input">
        </div>
        <div>
          <label class="sb-label" for="ivao-id">IVAO VID</label>
          <input id="ivao-id" class="sb-input font-mono" inputmode="numeric" maxlength="8" placeholder="654321" [formControl]="ivao" data-testid="ivao-input">
        </div>
      </div>
      @if ((vatsim.invalid && vatsim.dirty) || (ivao.invalid && ivao.dirty)) {
        <p class="sb-field-error !mt-2">IDs have 1 to 8 digits.</p>
      }

      @for (error of errors(); track error) {
        <p class="sb-error" data-testid="network-error">{{ error }}</p>
      }
      @if (saved()) {
        <p class="sb-success" data-testid="network-saved">Online networks saved.</p>
      }

      <button class="sb-btn-primary w-auto" type="submit" [disabled]="busy() || vatsim.invalid || ivao.invalid" data-testid="save-networks">Save networks</button>
    </form>
  `
})
export class NetworkSettings {
  private readonly pilots = inject(PilotService);

  protected readonly vatsim = new FormControl('', { nonNullable: true, validators: networkIdValidators });
  protected readonly ivao = new FormControl('', { nonNullable: true, validators: networkIdValidators });
  protected readonly busy = signal(false);
  protected readonly saved = signal(false);
  protected readonly errors = signal<string[]>([]);

  constructor() {
    this.pilots.get().pipe(takeUntilDestroyed()).subscribe({ next: pilot => this.show(pilot), error: () => undefined });
  }

  protected save(event: Event): void {
    event.preventDefault();
    if (this.vatsim.invalid || this.ivao.invalid) return;

    this.busy.set(true);
    this.saved.set(false);
    this.errors.set([]);
    this.pilots.linkNetworks(toNetworkId(this.vatsim.value), toNetworkId(this.ivao.value))
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: pilot => {
          this.show(pilot);
          this.saved.set(true);
        },
        error: error => this.errors.set(problemMessages(error))
      });
  }

  private show(pilot: Pilot): void {
    this.vatsim.reset(pilot.vatsimId?.toString() ?? '');
    this.ivao.reset(pilot.ivaoId?.toString() ?? '');
  }
}