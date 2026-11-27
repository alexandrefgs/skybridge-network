import { Component, inject, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { problemMessages } from '../../core/http/problem';
import { Pilot } from '../../core/pilot/pilot.models';
import { PilotService } from '../../core/pilot/pilot.service';
import { networkIdValidators, toNetworkId } from '../../shared/forms/network-ids';

export const NETWORK_PROMPT_KEY = 'sb-network-prompt';

@Component({
  selector: 'sb-network-prompt',
  imports: [ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-[1200] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="network-prompt-title" data-testid="network-prompt">
      <form class="sb-card w-full max-w-md p-6" (submit)="save($event)" novalidate>
        <p class="font-mono text-[10px] tracking-[0.2em] text-primary">WELCOME ON BOARD</p>
        <h2 id="network-prompt-title" class="mt-1 text-xl font-semibold">Do you fly on VATSIM or IVAO?</h2>
        <p class="mt-2 text-sm text-muted">Add your IDs so we can show you online on our Operations page. You can change them later in Settings.</p>

        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label class="sb-label" for="prompt-vatsim">VATSIM CID</label>
            <input id="prompt-vatsim" class="sb-input font-mono" inputmode="numeric" maxlength="8" [formControl]="vatsim" data-testid="prompt-vatsim">
          </div>
          <div>
            <label class="sb-label" for="prompt-ivao">IVAO VID</label>
            <input id="prompt-ivao" class="sb-input font-mono" inputmode="numeric" maxlength="8" [formControl]="ivao" data-testid="prompt-ivao">
          </div>
        </div>
        @if (vatsim.invalid || ivao.invalid) {
          <p class="sb-field-error mt-2">IDs have 1 to 8 digits.</p>
        }
        @for (error of errors(); track error) {
          <p class="sb-error mt-3">{{ error }}</p>
        }

        <div class="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" class="sb-btn-secondary w-auto px-5" (click)="later()" data-testid="prompt-later">I fly offline / later</button>
          <button type="submit" class="sb-btn-primary w-auto px-5" [disabled]="busy() || vatsim.invalid || ivao.invalid || (!vatsim.value.trim() && !ivao.value.trim())" data-testid="prompt-save">Save</button>
        </div>
      </form>
    </div>
  `
})
export class NetworkPrompt {
  private readonly pilots = inject(PilotService);

  readonly saved = output<Pilot>();
  readonly dismissed = output<void>();

  protected readonly vatsim = new FormControl('', { nonNullable: true, validators: networkIdValidators });
  protected readonly ivao = new FormControl('', { nonNullable: true, validators: networkIdValidators });
  protected readonly busy = signal(false);
  protected readonly errors = signal<string[]>([]);

  protected save(event: Event): void {
    event.preventDefault();
    if (this.vatsim.invalid || this.ivao.invalid) return;

    this.busy.set(true);
    this.errors.set([]);
    this.pilots.linkNetworks(toNetworkId(this.vatsim.value), toNetworkId(this.ivao.value))
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: pilot => this.saved.emit(pilot),
        error: error => this.errors.set(problemMessages(error))
      });
  }

  protected later(): void {
    try {
      localStorage.setItem(NETWORK_PROMPT_KEY, 'later');
    } catch {
      // storage can be unavailable; the prompt just shows again next time
    }
    this.dismissed.emit();
  }
}