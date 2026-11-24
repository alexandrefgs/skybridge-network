import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { problemMessages } from '../../core/http/problem';
import { PilotService } from '../../core/pilot/pilot.service';

@Component({
  selector: 'sb-simbrief-settings',
  imports: [ReactiveFormsModule],
  template: `
    <form class="sb-card mt-6 space-y-4" (submit)="save($event)" novalidate data-testid="simbrief-form">
      <div>
        <h2 class="text-lg font-semibold">SimBrief</h2>
        <p class="text-sm text-muted">We import your latest OFP before each leg. Find the Pilot ID in SimBrief → Account Settings.</p>
      </div>

      <div class="max-w-xs">
        <label class="sb-label" for="simbrief-id">SimBrief Pilot ID</label>
        <input id="simbrief-id" class="sb-input font-mono" inputmode="numeric" maxlength="7" placeholder="123456"
          [formControl]="pilotId" data-testid="simbrief-input">
      </div>
      @if (pilotId.invalid && pilotId.dirty) {
        <p class="sb-field-error !mt-2">The SimBrief Pilot ID has 1 to 7 digits.</p>
      }

      @for (error of errors(); track error) {
        <p class="sb-error" data-testid="simbrief-error">{{ error }}</p>
      }
      @if (saved()) {
        <p class="sb-success" data-testid="simbrief-saved">{{ linked() ? 'SimBrief Pilot ID saved.' : 'SimBrief Pilot ID removed.' }}</p>
      }

      <div class="flex flex-wrap gap-2">
        <button class="sb-btn-primary w-auto" type="submit" [disabled]="busy() || pilotId.invalid" data-testid="save-simbrief">Save Pilot ID</button>
        @if (linked()) {
          <button class="sb-btn-ghost w-auto" type="button" [disabled]="busy()" (click)="remove()" data-testid="remove-simbrief">Remove</button>
        }
      </div>
    </form>
  `
})
export class SimBriefSettings {
  private readonly pilots = inject(PilotService);

  protected readonly pilotId = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\s*\d{1,7}\s*$/)]
  });
  protected readonly linked = signal(false);
  protected readonly busy = signal(false);
  protected readonly saved = signal(false);
  protected readonly errors = signal<string[]>([]);

  constructor() {
    this.pilots.get().pipe(takeUntilDestroyed()).subscribe({
      next: pilot => this.show(pilot.simBriefPilotId),
      error: () => {}
    });
  }

  protected save(event: Event): void {
    event.preventDefault();
    if (this.pilotId.invalid) return;
    this.send(this.pilotId.value.trim());
  }

  protected remove(): void {
    this.send(null);
  }

  private send(value: string | null): void {
    this.busy.set(true);
    this.saved.set(false);
    this.errors.set([]);
    this.pilots.linkSimBrief(value).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: pilot => {
        this.show(pilot.simBriefPilotId);
        this.saved.set(true);
      },
      error: error => this.errors.set(problemMessages(error))
    });
  }

  private show(id: string | null): void {
    this.linked.set(id !== null);
    this.pilotId.reset(id ?? '');
  }
}