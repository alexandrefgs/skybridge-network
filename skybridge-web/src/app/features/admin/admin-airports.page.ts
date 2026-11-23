import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AdminService } from '../../core/admin/admin.service';
import { AirportCatalogImportResult } from '../../core/airports/airport.models';
import { problemMessages } from '../../core/http/problem';

@Component({
  selector: 'sb-admin-airports-page',
  imports: [DecimalPipe],
  template: `
    <div class="sb-card max-w-2xl">
      <h2 class="text-lg font-semibold">Import from OurAirports</h2>
      <p class="mt-1 text-sm text-muted">
        Downloads the latest airports.csv and runways.csv (about 17 MB) and updates the catalog. Existing airports and runways are updated,
        new ones are added and closed runways are removed. It can take up to a minute.
      </p>

      @if (error(); as message) {
        <p class="sb-error mt-4">{{ message }}</p>
      }

      @if (result(); as current) {
        <div class="mt-5 space-y-3" data-testid="import-result">
          <div class="rounded-lg bg-surface-2 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">Airports</p>
            <dl class="mt-2 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4" data-testid="airports-result">
              <div><dt class="text-xs text-muted">Added</dt><dd class="font-mono text-lg">{{ current.airports.added | number }}</dd></div>
              <div><dt class="text-xs text-muted">Updated</dt><dd class="font-mono text-lg">{{ current.airports.updated | number }}</dd></div>
              <div><dt class="text-xs text-muted">Unchanged</dt><dd class="font-mono text-lg">{{ current.airports.unchanged | number }}</dd></div>
              <div><dt class="text-xs text-muted">Total</dt><dd class="font-mono text-lg">{{ current.airports.total | number }}</dd></div>
            </dl>
          </div>
          <div class="rounded-lg bg-surface-2 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">Runways</p>
            <dl class="mt-2 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4" data-testid="runways-result">
              <div><dt class="text-xs text-muted">Added</dt><dd class="font-mono text-lg">{{ current.runways.added | number }}</dd></div>
              <div><dt class="text-xs text-muted">Updated</dt><dd class="font-mono text-lg">{{ current.runways.updated | number }}</dd></div>
              <div><dt class="text-xs text-muted">Removed</dt><dd class="font-mono text-lg">{{ current.runways.removed | number }}</dd></div>
              <div><dt class="text-xs text-muted">Airports</dt><dd class="font-mono text-lg">{{ current.runways.airportsWithRunways | number }}</dd></div>
            </dl>
          </div>
        </div>
      }

      <button type="button" class="sb-btn-primary mt-5 w-auto px-5" [disabled]="busy()" (click)="import()" data-testid="import">
        {{ busy() ? 'Importing…' : 'Import airports and runways' }}
      </button>
    </div>
  `
})
export class AdminAirportsPage {
  private readonly admin = inject(AdminService);

  protected readonly result = signal<AirportCatalogImportResult | null>(null);
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