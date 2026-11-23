import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { AdminAirlinesService } from '../../core/admin/admin-airlines.service';
import { AircraftService } from '../../core/aircraft/aircraft.service';
import { AirlineDetail, AirlineInput, AirlineRoute, RouteImportResult, RouteInput } from '../../core/airlines/airline.models';
import { AirlinesService } from '../../core/airlines/airlines.service';
import { problemMessages } from '../../core/http/problem';
import { RouteList } from '../../shared/routes/route-list';
import { AirlineForm } from './airline-form';
import { RouteForm } from './route-form';

@Component({
  selector: 'sb-admin-airline-page',
  imports: [RouterLink, DatePipe, DecimalPipe, AirlineForm, RouteForm, RouteList],
  template: `
    <a routerLink="/admin/airlines" class="text-sm text-muted transition-colors hover:text-primary">← Airlines</a>

    @if (error(); as message) {
      <p class="sb-error mt-4" data-testid="page-error">{{ message }}</p>
    }

    @if (notice(); as message) {
      <p class="sb-success mt-4" data-testid="notice">{{ message }}</p>
    }

    @if (airline(); as a) {
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h2 class="font-display text-2xl font-bold" data-testid="airline-name">
          <span class="font-mono text-primary">{{ a.icaoCode ?? '—' }}</span> {{ a.name }}
        </h2>
        <div class="flex items-center gap-3">
          <a [routerLink]="['/airlines', a.id]" class="text-sm text-muted transition-colors hover:text-primary">Public page</a>
          @if (confirmingDeleteAirline()) {
            <span class="text-xs text-muted">Delete {{ a.name }} and its {{ a.routeCount | number }} routes?</span>
            <button type="button" class="sb-btn-danger px-3 py-1" (click)="deleteAirline()" data-testid="confirm-delete-airline">Delete</button>
            <button type="button" class="text-sm text-muted hover:text-foreground" (click)="confirmingDeleteAirline.set(false)">Cancel</button>
          } @else {
            <button type="button" class="text-sm text-muted transition-colors hover:text-primary" (click)="confirmingDeleteAirline.set(true)" data-testid="delete-airline">Delete airline</button>
          }
        </div>
      </div>

      <section class="sb-card mt-6 p-6">
        <h3 class="mb-4 text-lg font-semibold">Details</h3>
        <sb-airline-form [airline]="a" [errors]="airlineErrors()" [saving]="saving()" [cancellable]="false" (saved)="saveAirline($event)" />
      </section>

      <section class="sb-card mt-6 p-6" aria-label="Fleet">
        <h3 class="text-lg font-semibold">Fleet</h3>
        <div class="mt-4 flex flex-wrap items-center gap-2" data-testid="fleet">
          @for (type of a.fleet; track type.icaoCode) {
            <span class="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm">
              <span class="font-mono font-semibold">{{ type.icaoCode }}</span>
              <span class="text-muted">{{ type.model }}</span>
              <button type="button" class="text-muted transition-colors hover:text-primary" (click)="removeFromFleet(type.icaoCode)" [attr.aria-label]="'Remove ' + type.icaoCode" [attr.data-testid]="'remove-' + type.icaoCode">×</button>
            </span>
          } @empty {
            <p class="text-sm text-muted">No aircraft in the fleet yet.</p>
          }
          <select class="sb-input w-48 py-1.5 text-sm" (change)="addToFleet($any($event.target))" data-testid="add-to-fleet">
            <option value="">Add aircraft…</option>
            @for (code of notInFleet(); track code) {
              <option [value]="code">{{ code }}</option>
            }
          </select>
        </div>
      </section>

      <section class="sb-card mt-6 p-6" aria-label="Route tools">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold">Routes</h3>
            <p class="mt-1 text-sm text-muted" data-testid="last-sync">
              @if (a.routesUpdatedAtUtc) {
                Last update {{ a.routesUpdatedAtUtc | date: 'd MMM y, HH:mm' }} · {{ a.routesSource }}
                @if (a.routesEdition) {
                  · edition {{ a.routesEdition | date: 'd MMM y' }}
                }
              } @else {
                Never synced. Routes came from OpenFlights or were added by hand.
              }
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            @if (a.icaoCode) {
              <button type="button" class="sb-btn-secondary w-auto px-4" [disabled]="busy()" (click)="syncFromCgna()" data-testid="sync-cgna">
                {{ busy() === 'sync' ? 'Syncing…' : 'Sync from CGNA' }}
              </button>
            }
            <button type="button" class="sb-btn-secondary w-auto px-4" [disabled]="busy()" (click)="fileInput.click()" data-testid="import-file">
              {{ busy() === 'import' ? 'Importing…' : 'Import file' }}
            </button>
            <input #fileInput type="file" accept=".csv,.txt,text/csv,text/plain" class="hidden" (change)="importFile(fileInput)" data-testid="file-input">
            <button type="button" class="sb-btn-primary w-auto px-4" (click)="startAddRoute()" data-testid="add-route">Add route</button>
          </div>
        </div>

        <p class="mt-3 text-xs text-muted">
          CSV header: <span class="font-mono">origin,destination,aircraft,route,fl</span> · aircraft separated by spaces · or the CGNA RPL text file.
        </p>

        @if (importResult(); as r) {
          <div class="mt-4 rounded-lg border border-line bg-surface-2 p-4 text-sm" data-testid="import-result">
            <p>
              <span class="font-semibold">{{ r.format }}</span>
              @if (r.edition) {
                <span class="text-muted"> · edition {{ r.edition | date: 'd MMM y' }}</span>
              }
              · <span class="text-foreground">{{ r.added }} added</span>
              · {{ r.updated }} updated
              · {{ r.unchanged }} unchanged
              · {{ r.skipped }} skipped
            </p>
            @if (r.fleetAdded.length) {
              <p class="mt-1 text-muted">Added to the fleet: <span class="font-mono">{{ r.fleetAdded.join(' ') }}</span></p>
            }
            @if (r.issues.length) {
              <ul class="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-muted" data-testid="import-issues">
                @for (issue of r.issues; track $index) {
                  <li><span class="font-mono">line {{ issue.line }}</span> · {{ issue.message }}</li>
                }
              </ul>
            }
          </div>
        }

        @if (editingRoute() !== undefined) {
          <div class="mt-6 border-t border-line pt-6">
            <h4 class="mb-4 font-semibold">{{ editingRoute() ? 'Edit ' + editingRoute()!.origin + '–' + editingRoute()!.destination : 'New route' }}</h4>
            <sb-route-form [route]="editingRoute() ?? null" [fleet]="fleetCodes()" [catalog]="catalog()" [errors]="routeErrors()" [saving]="saving()"
              (saved)="saveRoute($event)" (cancelled)="editingRoute.set(undefined)" />
          </div>
        }

        <div class="mt-6 flex justify-end">
          @if (confirmingDeleteAll()) {
            <span class="mr-2 self-center text-xs text-muted">Delete all {{ a.routeCount | number }} routes of {{ a.name }}?</span>
            <button type="button" class="sb-btn-danger px-3 py-1" (click)="deleteAllRoutes()" data-testid="confirm-delete-all">Delete all</button>
            <button type="button" class="ml-2 text-sm text-muted hover:text-foreground" (click)="confirmingDeleteAll.set(false)">Cancel</button>
          } @else {
            <button type="button" class="text-sm text-muted transition-colors hover:text-primary" [disabled]="!a.routeCount" (click)="confirmingDeleteAll.set(true)" data-testid="delete-all-routes">Delete all routes</button>
          }
        </div>
      </section>

      <section class="mt-8">
        <sb-route-list [airlineId]="a.id" [editable]="true" [refresh]="refresh()" (edit)="startEditRoute($event)" (delete)="deleteRoute($event)" />
      </section>
    }
  `
})
export class AdminAirlinePage {
  private readonly airlines = inject(AirlinesService);
  private readonly admin = inject(AdminAirlinesService);
  private readonly aircraft = inject(AircraftService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly airline = signal<AirlineDetail | null>(null);
  protected readonly catalog = signal<string[]>([]);
  protected readonly refresh = signal(0);
  protected readonly editingRoute = signal<AirlineRoute | null | undefined>(undefined);
  protected readonly importResult = signal<RouteImportResult | null>(null);
  protected readonly busy = signal<'sync' | 'import' | null>(null);
  protected readonly saving = signal(false);
  protected readonly confirmingDeleteAirline = signal(false);
  protected readonly confirmingDeleteAll = signal(false);
  protected readonly airlineErrors = signal<string[]>([]);
  protected readonly routeErrors = signal<string[]>([]);
  protected readonly notice = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly fleetCodes = computed(() => this.airline()?.fleet.map(f => f.icaoCode) ?? []);
  protected readonly notInFleet = computed(() => this.catalog().filter(code => !this.fleetCodes().includes(code)));

  constructor() {
    this.aircraft
      .types({ category: null, search: '', page: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed())
      .subscribe(result => this.catalog.set(result.items.map(t => t.icaoCode).sort()));

    toObservable(this.id)
      .pipe(
        switchMap(id =>
          this.airlines.get(Number(id)).pipe(
            catchError(error => {
              this.error.set(error?.status === 404 ? 'Airline not found.' : problemMessages(error)[0]);
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe(airline => this.airline.set(airline));
  }

  protected saveAirline(input: AirlineInput): void {
    this.saving.set(true);
    this.airlineErrors.set([]);
    this.admin.update(this.airlineId(), input).subscribe({
      next: airline => {
        this.saving.set(false);
        this.airline.set(airline);
        this.showNotice(`${airline.name} updated.`);
      },
      error: error => {
        this.saving.set(false);
        this.airlineErrors.set(problemMessages(error));
      }
    });
  }

  protected deleteAirline(): void {
    this.admin.delete(this.airlineId()).subscribe({
      next: () => this.router.navigate(['/admin/airlines']),
      error: error => this.error.set(problemMessages(error)[0])
    });
  }

  protected addToFleet(select: HTMLSelectElement): void {
    const code = select.value;
    select.value = '';
    if (code) this.saveFleet([...this.fleetCodes(), code]);
  }

  protected removeFromFleet(code: string): void {
    this.saveFleet(this.fleetCodes().filter(c => c !== code));
  }

  protected syncFromCgna(): void {
    this.runImport('sync', this.admin.syncFromCgna(this.airlineId()));
  }

  protected importFile(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (file) this.runImport('import', this.admin.importRoutes(this.airlineId(), file));
  }

  protected startAddRoute(): void {
    this.routeErrors.set([]);
    this.editingRoute.set(null);
  }

  protected startEditRoute(route: AirlineRoute): void {
    this.routeErrors.set([]);
    this.editingRoute.set(route);
  }

  protected saveRoute(input: RouteInput): void {
    const editing = this.editingRoute();
    const request$ = editing
      ? this.admin.updateRoute(this.airlineId(), editing.id, { aircraft: input.aircraft, atsRoute: input.atsRoute, flightLevel: input.flightLevel })
      : this.admin.addRoute(this.airlineId(), input);

    this.saving.set(true);
    this.routeErrors.set([]);
    request$.subscribe({
      next: route => {
        this.saving.set(false);
        this.editingRoute.set(undefined);
        this.showNotice(`Route ${route.origin}–${route.destination} ${editing ? 'updated' : 'added'}.`);
        this.reload();
      },
      error: error => {
        this.saving.set(false);
        this.routeErrors.set(problemMessages(error));
      }
    });
  }

  protected deleteRoute(route: AirlineRoute): void {
    this.admin.deleteRoute(this.airlineId(), route.id).subscribe({
      next: () => {
        this.showNotice(`Route ${route.origin}–${route.destination} deleted.`);
        this.reload();
      },
      error: error => this.error.set(problemMessages(error)[0])
    });
  }

  protected deleteAllRoutes(): void {
    this.admin.deleteAllRoutes(this.airlineId()).subscribe({
      next: result => {
        this.confirmingDeleteAll.set(false);
        this.showNotice(`${result.deleted} routes deleted.`);
        this.reload();
      },
      error: error => this.error.set(problemMessages(error)[0])
    });
  }

  private runImport(kind: 'sync' | 'import', request$: ReturnType<AdminAirlinesService['syncFromCgna']>): void {
    this.busy.set(kind);
    this.error.set(null);
    this.notice.set(null);
    this.importResult.set(null);
    request$.subscribe({
      next: result => {
        this.busy.set(null);
        this.importResult.set(result);
        this.reload();
      },
      error: error => {
        this.busy.set(null);
        this.error.set(problemMessages(error)[0]);
      }
    });
  }

  private saveFleet(codes: string[]): void {
    this.admin.setFleet(this.airlineId(), codes).subscribe({
      next: airline => this.airline.set(airline),
      error: error => this.error.set(problemMessages(error)[0])
    });
  }

  private reload(): void {
    this.refresh.update(value => value + 1);
    this.airlines.get(this.airlineId()).subscribe(airline => this.airline.set(airline));
  }

  private showNotice(message: string): void {
    this.error.set(null);
    this.notice.set(message);
  }

  private airlineId(): number {
    return Number(this.id());
  }
}