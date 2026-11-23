import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AdminService } from '../../core/admin/admin.service';
import { AirportImportResult } from '../../core/airports/airport.models';
import { problemMessages } from '../../core/http/problem';

@Component({
  selector: 'sb-admin-airports-page',
  imports: [DecimalPipe],
  template: `
    <div class="sb-card max-w-2xl">
      <h2 class="text-lg font-semibold">Import from OurAirports</h2>
      <p class="mt-1 text-sm text-muted">
        Downloads the latest airports.csv (about 12 MB) and updates the catalog. Existing airports are updated, new ones are added.
        It can take up to a minute.
      </p>

      @if (error(); as message) {
        <p class="sb-error mt-4">{{ message }}</p>
      }

      @if (result(); as current) {
        <dl class="mt-5 grid grid-cols-2 gap-4 rounded-lg bg-surface-2 p-4 text-sm sm:grid-cols-4" data-testid="import-result">
          <div><dt class="text-xs text-muted">Added</dt><dd class="font-mono text-lg">{{ current.added | number }}</dd></div>
          <div><dt class="text-xs text-muted">Updated</dt><dd class="font-mono text-lg">{{ current.updated | number }}</dd></div>
          <div><dt class="text-xs text-muted">Unchanged</dt><dd class="font-mono text-lg">{{ current.unchanged | number }}</dd></div>
          <div><dt class="text-xs text-muted">Total</dt><dd class="font-mono text-lg">{{ current.total | number }}</dd></div>
        </dl>
      }

      <button type="button" class="sb-btn-primary mt-5 w-auto px-5" [disabled]="busy()" (click)="import()" data-testid="import">
        {{ busy() ? 'Importing…' : 'Import airports' }}
      </button>
    </div>
  `
})
export class AdminAirportsPage {
  private readonly admin = inject(AdminService);

  protected readonly result = signal<AirportImportResult | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected import(): void {
    this.busy.set(true);
    this.error.set(null);
    this.admin.importAirports().subscribe({
      next: result => {
        this.result.set(result);
        this.busy.set(false);
      },
      error: error => {
        this.error.set(problemMessages(error)[0]);
        this.busy.set(false);
      }
    });
  }
}