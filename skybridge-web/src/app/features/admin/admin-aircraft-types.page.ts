import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { AdminService } from '../../core/admin/admin.service';
import { AircraftCategory, AircraftCategoryCode, AircraftType, AircraftTypeQuery, EngineType } from '../../core/aircraft/aircraft.models';
import { AircraftService } from '../../core/aircraft/aircraft.service';
import { PagedResult } from '../../core/http/paged-result';
import { problemMessages } from '../../core/http/problem';

const PAGE_SIZE = 10;

@Component({
  selector: 'sb-admin-aircraft-types-page',
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <input class="sb-input w-72" type="search" placeholder="Search ICAO, manufacturer, model or family" [formControl]="searchControl" data-testid="search">
        <select class="sb-input w-56" [formControl]="categoryControl" data-testid="category-filter">
          <option value="">All categories</option>
          @for (category of categories(); track category.code) {
            <option [value]="category.code">{{ category.name }}</option>
          }
        </select>
      </div>
      <button type="button" class="sb-btn-primary w-auto px-4" (click)="startCreate()" data-testid="new-type">New aircraft type</button>
    </div>

    @if (editing()) {
      <form class="sb-card mt-6 p-6" [formGroup]="form" (ngSubmit)="save()" novalidate data-testid="type-form">
        <h2 class="text-lg font-semibold">{{ editing() === 'new' ? 'New aircraft type' : 'Edit ' + editing() }}</h2>

        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="sb-label" for="icaoCode">ICAO code</label>
            <input class="sb-input font-mono uppercase" id="icaoCode" maxlength="4" formControlName="icaoCode">
            @if (fieldError('icaoCode'); as message) {
              <p class="sb-field-error" data-testid="error-icaoCode">{{ message }}</p>
            }
          </div>
          <div>
            <label class="sb-label" for="manufacturer">Manufacturer</label>
            <input class="sb-input" id="manufacturer" maxlength="60" formControlName="manufacturer">
            @if (fieldError('manufacturer'); as message) {
              <p class="sb-field-error" data-testid="error-manufacturer">{{ message }}</p>
            }
          </div>
          <div class="lg:col-span-2">
            <label class="sb-label" for="model">Model</label>
            <input class="sb-input" id="model" maxlength="60" formControlName="model">
            @if (fieldError('model'); as message) {
              <p class="sb-field-error" data-testid="error-model">{{ message }}</p>
            }
          </div>
          <div class="lg:col-span-2">
            <label class="sb-label" for="family">Family</label>
            <input class="sb-input" id="family" maxlength="40" placeholder="Boeing 737" formControlName="family" data-testid="family">
            <p class="mt-1 text-xs text-muted">Airline routes accept any fleet aircraft of the same family.</p>
            @if (fieldError('family'); as message) {
              <p class="sb-field-error" data-testid="error-family">{{ message }}</p>
            }
          </div>
          <div>
            <label class="sb-label" for="category">Category</label>
            <select class="sb-input" id="category" formControlName="category">
              @for (category of categories(); track category.code) {
                <option [value]="category.code">{{ category.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="sb-label" for="engineType">Engine type</label>
            <select class="sb-input" id="engineType" formControlName="engineType">
              @for (engine of engineTypes; track engine) {
                <option [value]="engine">{{ engine }}</option>
              }
            </select>
          </div>
          <div>
            <label class="sb-label" for="engineCount">Engines</label>
            <input class="sb-input font-mono" id="engineCount" type="number" min="1" max="8" formControlName="engineCount">
            @if (fieldError('engineCount'); as message) {
              <p class="sb-field-error" data-testid="error-engineCount">{{ message }}</p>
            }
          </div>
          <div>
            <label class="sb-label" for="rangeNm">Range (nm)</label>
            <input class="sb-input font-mono" id="rangeNm" type="number" min="1" formControlName="rangeNm">
            @if (fieldError('rangeNm'); as message) {
              <p class="sb-field-error" data-testid="error-rangeNm">{{ message }}</p>
            }
          </div>
          <div>
            <label class="sb-label" for="cruiseSpeedKts">Cruise (kt)</label>
            <input class="sb-input font-mono" id="cruiseSpeedKts" type="number" min="1" formControlName="cruiseSpeedKts">
            @if (fieldError('cruiseSpeedKts'); as message) {
              <p class="sb-field-error" data-testid="error-cruiseSpeedKts">{{ message }}</p>
            }
          </div>
          <div>
            <label class="sb-label" for="serviceCeilingFt">Ceiling (ft)</label>
            <input class="sb-input font-mono" id="serviceCeilingFt" type="number" min="1" max="60000" step="100" formControlName="serviceCeilingFt">
            @if (fieldError('serviceCeilingFt'); as message) {
              <p class="sb-field-error" data-testid="error-serviceCeilingFt">{{ message }}</p>
            }
          </div>
          <div>
            <label class="sb-label" for="seats">Seats</label>
            <input class="sb-input font-mono" id="seats" type="number" min="1" formControlName="seats">
            @if (fieldError('seats'); as message) {
              <p class="sb-field-error" data-testid="error-seats">{{ message }}</p>
            }
          </div>
          <div>
            <label class="sb-label" for="maxCargoKg">Cargo (kg)</label>
            <input class="sb-input font-mono" id="maxCargoKg" type="number" min="0" formControlName="maxCargoKg">
            @if (fieldError('maxCargoKg'); as message) {
              <p class="sb-field-error" data-testid="error-maxCargoKg">{{ message }}</p>
            }
          </div>
          <div>
            <label class="sb-label" for="minRunwayFt">Min runway (ft)</label>
            <input class="sb-input font-mono" id="minRunwayFt" type="number" min="500" max="15000" step="100" formControlName="minRunwayFt">
            @if (fieldError('minRunwayFt'); as message) {
              <p class="sb-field-error" data-testid="error-minRunwayFt">{{ message }}</p>
            }
          </div>
          <label class="flex items-center gap-2 self-end pb-2.5 text-sm">
            <input type="checkbox" class="accent-primary" formControlName="requiresPavedRunway" data-testid="requires-paved">
            Needs a paved runway
          </label>
        </div>

        @for (message of formErrors(); track message) {
          <p class="sb-error mt-4" data-testid="form-error">{{ message }}</p>
        }

        <div class="mt-5 flex gap-3">
          <button type="submit" class="sb-btn-primary w-auto px-5" [disabled]="saving()">Save</button>
          <button type="button" class="sb-btn-secondary w-auto px-5" (click)="cancel()">Cancel</button>
        </div>
      </form>
    }

    @if (notice(); as message) {
      <p class="sb-success mt-4" data-testid="notice">{{ message }}</p>
    }

    @if (error(); as message) {
      <p class="sb-error mt-4">{{ message }}</p>
    }

    <div class="sb-card mt-6 overflow-x-auto p-0">
      <table class="w-full text-sm" data-testid="types">
        <thead class="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="px-4 py-3 font-medium">ICAO</th>
            <th class="px-4 py-3 font-medium">Aircraft</th>
            <th class="px-4 py-3 font-medium">Category</th>
            <th class="px-4 py-3 text-right font-medium">Range</th>
            <th class="px-4 py-3 text-right font-medium">Ceiling</th>
            <th class="px-4 py-3 text-right font-medium">Min runway</th>
            <th class="px-4 py-3 text-right font-medium">Seats</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          @for (type of result()?.items ?? []; track type.icaoCode) {
            <tr>
              <td class="px-4 py-3 font-mono font-semibold">{{ type.icaoCode }}</td>
              <td class="px-4 py-3">
                <span class="text-muted">{{ type.manufacturer }}</span> {{ type.model }}
                @if (type.family) {
                  <span class="block text-xs text-muted">{{ type.family }} family</span>
                }
              </td>
              <td class="px-4 py-3 text-muted">{{ categoryName(type.category) }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ type.rangeNm | number }} nm</td>
              <td class="px-4 py-3 text-right font-mono">{{ type.serviceCeilingFt | number }} ft</td>
              <td class="whitespace-nowrap px-4 py-3 text-right font-mono" [attr.data-testid]="'runway-' + type.icaoCode">
                {{ type.minRunwayFt | number }} ft@if (!type.requiresPavedRunway) {<span class="ml-1 text-xs text-muted" title="Can use unpaved runways">· any</span>}
              </td>
              <td class="px-4 py-3 text-right font-mono">{{ type.seats }}</td>
              <td class="whitespace-nowrap px-4 py-2 text-right">
                @if (confirmingDelete() === type.icaoCode) {
                  <span class="mr-2 text-xs text-muted">Delete {{ type.icaoCode }}?</span>
                  <button type="button" class="sb-btn-danger px-3 py-1" (click)="delete(type.icaoCode)" data-testid="confirm-delete">Delete</button>
                  <button type="button" class="ml-2 text-muted hover:text-foreground" (click)="confirmingDelete.set(null)">Cancel</button>
                } @else {
                  <button type="button" class="text-muted transition-colors hover:text-primary" (click)="startEdit(type)" [attr.data-testid]="'edit-' + type.icaoCode">Edit</button>
                  <button type="button" class="ml-4 text-muted transition-colors hover:text-primary" (click)="confirmingDelete.set(type.icaoCode)" [attr.data-testid]="'delete-' + type.icaoCode">Delete</button>
                }
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="8" class="px-4 py-10 text-center text-muted">No aircraft found.</td>
            </tr>
          }
        </tbody>
      </table>

      @if (totalPages() > 1) {
        <div class="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
          <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="query().page <= 1" (click)="goToPage(query().page - 1)">← Previous</button>
          <span class="text-muted">Page {{ query().page }} of {{ totalPages() }}</span>
          <button type="button" class="text-muted transition-colors hover:text-primary disabled:opacity-40" [disabled]="query().page >= totalPages()" (click)="goToPage(query().page + 1)">Next →</button>
        </div>
      }
    </div>
  `
})
export class AdminAircraftTypesPage {
  private readonly aircraft = inject(AircraftService);
  private readonly admin = inject(AdminService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly engineTypes: EngineType[] = ['Piston', 'Turboprop', 'Jet'];
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly categoryControl = new FormControl('', { nonNullable: true });

  protected readonly categories = signal<AircraftCategory[]>([]);
  protected readonly query = signal<AircraftTypeQuery>({ category: null, search: '', page: 1, pageSize: PAGE_SIZE });
  protected readonly result = signal<PagedResult<AircraftType> | null>(null);
  protected readonly totalPages = computed(() => Math.ceil((this.result()?.totalCount ?? 0) / PAGE_SIZE));
  protected readonly editing = signal<string | null>(null);
  protected readonly confirmingDelete = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly formErrors = signal<string[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected readonly form = this.fb.group({
    icaoCode: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{2,4}$/)]],
    manufacturer: ['', [Validators.required, Validators.maxLength(60)]],
    model: ['', [Validators.required, Validators.maxLength(60)]],
    category: ['SinglePiston' as AircraftCategoryCode, Validators.required],
    engineType: ['Piston' as EngineType, Validators.required],
    engineCount: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(8)]),
    rangeNm: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(20000)]),
    cruiseSpeedKts: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(1000)]),
    serviceCeilingFt: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(60000)]),
    seats: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(1000)]),
    maxCargoKg: this.fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(200000)]),
    minRunwayFt: this.fb.control<number | null>(null, [Validators.required, Validators.min(500), Validators.max(15000)]),
    requiresPavedRunway: [false],
    family: ['', Validators.maxLength(40)]
  });

  constructor() {
    this.aircraft.categories().pipe(takeUntilDestroyed()).subscribe(categories => this.categories.set(categories));

    this.searchControl.valueChanges
      .pipe(debounceTime(300), map(value => value.trim()), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(search => this.query.update(q => ({ ...q, search, page: 1 })));

    this.categoryControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(value => this.query.update(q => ({ ...q, category: (value || null) as AircraftCategoryCode | null, page: 1 })));

    toObservable(this.query)
      .pipe(
        switchMap(query =>
          this.aircraft.types(query).pipe(
            catchError(error => {
              this.error.set(problemMessages(error)[0]);
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe(result => {
        if (result) this.result.set(result);
      });
  }

  protected startCreate(): void {
    this.form.reset();
    this.formErrors.set([]);
    this.notice.set(null);
    this.editing.set('new');
  }

  protected startEdit(type: AircraftType): void {
    this.form.setValue({
      icaoCode: type.icaoCode,
      manufacturer: type.manufacturer,
      model: type.model,
      category: type.category,
      engineType: type.engineType,
      engineCount: type.engineCount,
      rangeNm: type.rangeNm,
      cruiseSpeedKts: type.cruiseSpeedKts,
      serviceCeilingFt: type.serviceCeilingFt,
      seats: type.seats,
      maxCargoKg: type.maxCargoKg,
      minRunwayFt: type.minRunwayFt,
      requiresPavedRunway: type.requiresPavedRunway,
      family: type.family ?? ''
    });
    this.formErrors.set([]);
    this.notice.set(null);
    this.editing.set(type.icaoCode);
  }

  protected cancel(): void {
    this.editing.set(null);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const editing = this.editing();
    const raw = this.form.getRawValue();
    const value = { ...raw, family: raw.family.trim() || null } as AircraftType;
    const request$ = editing === 'new' ? this.admin.createType(value) : this.admin.updateType(editing!, value);

    this.saving.set(true);
    this.formErrors.set([]);
    request$.subscribe({
      next: saved => {
        this.saving.set(false);
        this.editing.set(null);
        this.notice.set(`${saved.icaoCode} ${editing === 'new' ? 'created' : 'updated'}.`);
        this.reload();
      },
      error: error => {
        this.saving.set(false);
        this.formErrors.set(problemMessages(error));
      }
    });
  }

  protected delete(icaoCode: string): void {
    this.admin.deleteType(icaoCode).subscribe({
      next: () => {
        this.confirmingDelete.set(null);
        this.notice.set(`${icaoCode} deleted.`);
        this.reload();
      },
      error: error => this.error.set(problemMessages(error)[0])
    });
  }

  protected goToPage(page: number): void {
    this.query.update(q => ({ ...q, page }));
  }

  protected fieldError(name: keyof typeof this.form.controls): string | null {
    const control: AbstractControl = this.form.controls[name];
    if (!control.touched || !control.errors) return null;
    const errors = control.errors;
    if (errors['required']) return 'Required.';
    if (errors['pattern']) return 'Use 2 to 4 letters or digits.';
    if (errors['min']) return `Must be at least ${errors['min'].min}.`;
    if (errors['max']) return `Must be at most ${errors['max'].max}.`;
    if (errors['maxlength']) return `Use at most ${errors['maxlength'].requiredLength} characters.`;
    return 'Invalid value.';
  }

  protected categoryName(code: AircraftCategoryCode): string {
    return this.categories().find(c => c.code === code)?.name ?? code;
  }

  private reload(): void {
    this.query.update(q => ({ ...q }));
  }
}