import { Component, inject, signal } from '@angular/core';
import { AdminService } from '../../core/admin/admin.service';
import { AircraftCategory, AircraftCategoryCode } from '../../core/aircraft/aircraft.models';
import { AircraftService } from '../../core/aircraft/aircraft.service';
import { problemMessages } from '../../core/http/problem';

interface CategoryRow {
  code: AircraftCategoryCode;
  name: string;
  requiredHours: number;
  saved: AircraftCategory;
}

@Component({
  selector: 'sb-admin-categories-page',
  template: `
    <p class="text-sm text-muted">Hours a pilot needs before flying each category. Changes apply immediately to every pilot.</p>

    @if (error(); as message) {
      <p class="sb-error mt-4">{{ message }}</p>
    }

    <div class="sb-card mt-4 overflow-x-auto p-0">
      <table class="w-full text-sm" data-testid="category-table">
        <thead class="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="px-4 py-3 font-medium">Code</th>
            <th class="px-4 py-3 font-medium">Name</th>
            <th class="px-4 py-3 font-medium">Required hours</th>
            <th class="w-28 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          @for (row of rows(); track row.code) {
            <tr>
              <td class="px-4 py-3 font-mono text-muted">{{ row.code }}</td>
              <td class="px-4 py-2">
                <input class="sb-input" maxlength="50" [value]="row.name" (input)="edit(row.code, { name: $any($event.target).value })"
                  [attr.data-testid]="'name-' + row.code">
              </td>
              <td class="px-4 py-2">
                <input class="sb-input w-28 font-mono" type="number" min="0" step="1" [value]="row.requiredHours"
                  (input)="edit(row.code, { requiredHours: $any($event.target).valueAsNumber })" [attr.data-testid]="'hours-' + row.code">
              </td>
              <td class="px-4 py-2 text-right">
                @if (isDirty(row)) {
                  <button type="button" class="sb-btn-primary w-auto px-4 py-1.5" [disabled]="!isValid(row) || savingCode() === row.code"
                    (click)="save(row)" [attr.data-testid]="'save-' + row.code">Save</button>
                } @else if (savedCode() === row.code) {
                  <span class="text-xs text-emerald-500" data-testid="saved">Saved</span>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class AdminCategoriesPage {
  private readonly admin = inject(AdminService);

  protected readonly rows = signal<CategoryRow[]>([]);
  protected readonly savingCode = signal<AircraftCategoryCode | null>(null);
  protected readonly savedCode = signal<AircraftCategoryCode | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    inject(AircraftService)
      .categories()
      .subscribe({
        next: categories => this.rows.set(categories.map(c => ({ ...c, saved: c }))),
        error: error => this.error.set(problemMessages(error)[0])
      });
  }

  protected edit(code: AircraftCategoryCode, change: Partial<Pick<CategoryRow, 'name' | 'requiredHours'>>): void {
    this.savedCode.set(null);
    this.rows.update(rows => rows.map(row => (row.code === code ? { ...row, ...change } : row)));
  }

  protected isDirty(row: CategoryRow): boolean {
    return row.name !== row.saved.name || row.requiredHours !== row.saved.requiredHours;
  }

  protected isValid(row: CategoryRow): boolean {
    return row.name.trim().length > 0 && Number.isInteger(row.requiredHours) && row.requiredHours >= 0;
  }

  protected save(row: CategoryRow): void {
    this.savingCode.set(row.code);
    this.error.set(null);
    this.admin.updateCategory(row.code, { name: row.name.trim(), requiredHours: row.requiredHours }).subscribe({
      next: saved => {
        this.rows.update(rows => rows.map(r => (r.code === saved.code ? { ...saved, saved } : r)));
        this.savingCode.set(null);
        this.savedCode.set(saved.code);
      },
      error: error => {
        this.savingCode.set(null);
        this.error.set(problemMessages(error)[0]);
      }
    });
  }
}