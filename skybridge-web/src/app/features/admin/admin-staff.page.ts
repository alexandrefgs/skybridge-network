import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { problemMessages } from '../../core/http/problem';
import { STAFF_DEPARTMENTS, StaffCandidate, StaffDepartment, StaffMember } from '../../core/staff/staff.models';
import { StaffService } from '../../core/staff/staff.service';

interface Selected {
  userId: string;
  name: string;
  email: string;
}

@Component({
  selector: 'sb-admin-staff-page',
  imports: [ReactiveFormsModule],
  template: `
    <p class="text-sm text-muted">Who appears on the public Staff page. Panel access also lets the member manage airlines, freelance jobs and PIREPs here.</p>

    @if (error(); as message) {
      <p class="sb-error mt-4" data-testid="staff-error">{{ message }}</p>
    }

    <section class="sb-card mt-4 p-6">
      @if (selected(); as user) {
        <form [formGroup]="form" (ngSubmit)="save(user)" data-testid="member-form">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p><span class="font-semibold">{{ user.name }}</span> <span class="ml-1 text-sm text-muted">· {{ user.email }}</span></p>
            <button type="button" class="text-sm text-muted hover:text-primary" (click)="cancel()" data-testid="cancel">Choose another pilot</button>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr_7rem]">
            <div>
              <label class="sb-label" for="position">Position</label>
              <input class="sb-input" id="position" formControlName="position" maxlength="80" placeholder="Director of Operations" data-testid="position" />
            </div>
            <div>
              <label class="sb-label" for="department">Department</label>
              <select class="sb-input" id="department" formControlName="department" data-testid="department">
                @for (department of departments; track department.value) {
                  <option [value]="department.value">{{ department.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="sb-label" for="order">Order</label>
              <input class="sb-input font-mono" id="order" type="number" min="0" max="999" formControlName="sortOrder" data-testid="order" />
            </div>
          </div>
          <label class="mt-4 flex items-start gap-3 text-sm">
            <input type="checkbox" class="mt-0.5 accent-primary" formControlName="panelAccess" data-testid="panel-access" />
            <span>Panel access <span class="block text-muted">Applies the next time they sign in.</span></span>
          </label>
          <button type="submit" class="sb-btn-primary mt-5 w-auto px-6" [disabled]="form.invalid || saving()" data-testid="save">
            {{ isMember(user.userId) ? 'Save changes' : 'Add to staff' }}
          </button>
        </form>
      } @else {
        <form class="flex flex-wrap gap-3" (submit)="search($event)" data-testid="search-form">
          <input class="sb-input max-w-sm flex-1" type="search" name="search" placeholder="Search a pilot by name or e-mail" [value]="term()"
            (input)="term.set($any($event.target).value)" data-testid="search" />
          <button type="submit" class="sb-btn-secondary w-auto px-5" [disabled]="term().trim().length < 2">Search</button>
        </form>
        @if (candidates(); as found) {
          <ul class="mt-4 divide-y divide-line rounded-lg border border-line" data-testid="candidates">
            @for (candidate of found; track candidate.userId) {
              <li>
                <button type="button" class="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                  (click)="choose(candidate)" [attr.data-testid]="'candidate-' + candidate.userId">
                  <span><span class="font-medium">{{ candidate.name }}</span> <span class="ml-1 text-sm text-muted">· {{ candidate.email }}</span></span>
                  @if (candidate.isStaff) {
                    <span class="rounded bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">STAFF</span>
                  }
                </button>
              </li>
            } @empty {
              <li class="px-4 py-3 text-sm text-muted" data-testid="no-candidates">No pilot found.</li>
            }
          </ul>
        }
      }
    </section>

    <div class="sb-card mt-6 overflow-x-auto p-0">
      <table class="w-full text-sm" data-testid="staff-table">
        <thead class="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="px-4 py-3 font-medium">Dept.</th>
            <th class="px-4 py-3 font-medium">Member</th>
            <th class="px-4 py-3 font-medium">Position</th>
            <th class="px-4 py-3 font-medium">Order</th>
            <th class="px-4 py-3 font-medium">Panel</th>
            <th class="w-48 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          @for (member of members(); track member.userId) {
            <tr [attr.data-testid]="'member-' + member.userId">
              <td class="px-4 py-3 font-mono text-xs text-primary">{{ code(member.department) }}</td>
              <td class="px-4 py-3">{{ member.name }}<span class="block text-xs text-muted">{{ member.email }}</span></td>
              <td class="px-4 py-3">{{ member.position }}</td>
              <td class="px-4 py-3 font-mono">{{ member.sortOrder }}</td>
              <td class="px-4 py-3">{{ member.panelAccess ? 'Yes' : '—' }}</td>
              <td class="px-4 py-3 text-right">
                @if (confirming() === member.userId) {
                  <span class="text-xs text-muted">Remove?</span>
                  <button type="button" class="ml-2 text-sm font-semibold text-primary" (click)="remove(member)" [attr.data-testid]="'confirm-' + member.userId">Yes</button>
                  <button type="button" class="ml-2 text-sm text-muted" (click)="confirming.set(null)">No</button>
                } @else {
                  <button type="button" class="text-sm text-muted hover:text-foreground" (click)="edit(member)" [attr.data-testid]="'edit-' + member.userId">Edit</button>
                  <button type="button" class="ml-3 text-sm text-muted hover:text-primary" (click)="confirming.set(member.userId)" [attr.data-testid]="'remove-' + member.userId">Remove</button>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="px-4 py-6 text-center text-muted" data-testid="no-members">No staff yet. Search a pilot above to add the first one.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class AdminStaffPage {
  private readonly staff = inject(StaffService);

  protected readonly departments = STAFF_DEPARTMENTS;
  protected readonly members = signal<StaffMember[]>([]);
  protected readonly term = signal('');
  protected readonly candidates = signal<StaffCandidate[] | null>(null);
  protected readonly selected = signal<Selected | null>(null);
  protected readonly confirming = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    position: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    department: ['Executive' as StaffDepartment, Validators.required],
    sortOrder: [0, [Validators.required, Validators.min(0), Validators.max(999)]],
    panelAccess: [false]
  });

  constructor() {
    this.staff.list().subscribe({
      next: members => this.members.set(members),
      error: error => this.error.set(problemMessages(error)[0])
    });
  }

  protected code(department: StaffDepartment): string {
    return STAFF_DEPARTMENTS.find(d => d.value === department)?.code ?? department;
  }

  protected isMember(userId: string): boolean {
    return this.members().some(m => m.userId === userId);
  }

  protected search(event: Event): void {
    event.preventDefault();
    const term = this.term().trim();
    if (term.length < 2) return;
    this.error.set(null);
    this.staff.candidates(term).subscribe({
      next: found => this.candidates.set(found),
      error: error => this.error.set(problemMessages(error)[0])
    });
  }

  protected choose(candidate: StaffCandidate): void {
    const member = this.members().find(m => m.userId === candidate.userId);
    if (member) {
      this.edit(member);
      return;
    }
    this.form.reset({ position: '', department: 'Executive', sortOrder: 0, panelAccess: false });
    this.selected.set({ userId: candidate.userId, name: candidate.name, email: candidate.email });
  }

  protected edit(member: StaffMember): void {
    this.form.reset({ position: member.position, department: member.department, sortOrder: member.sortOrder, panelAccess: member.panelAccess });
    this.selected.set({ userId: member.userId, name: member.name, email: member.email });
  }

  protected cancel(): void {
    this.selected.set(null);
  }

  protected save(user: Selected): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.staff.save(user.userId, { ...value, position: value.position.trim() }).subscribe({
      next: saved => {
        this.members.update(members => sortMembers([...members.filter(m => m.userId !== saved.userId), saved]));
        this.saving.set(false);
        this.selected.set(null);
        this.candidates.set(null);
        this.term.set('');
      },
      error: error => {
        this.saving.set(false);
        this.error.set(problemMessages(error)[0]);
      }
    });
  }

  protected remove(member: StaffMember): void {
    this.error.set(null);
    this.staff.remove(member.userId).subscribe({
      next: () => {
        this.members.update(members => members.filter(m => m.userId !== member.userId));
        this.confirming.set(null);
      },
      error: error => {
        this.confirming.set(null);
        this.error.set(problemMessages(error)[0]);
      }
    });
  }
}

function sortMembers(members: StaffMember[]): StaffMember[] {
  const order = (department: StaffDepartment) => STAFF_DEPARTMENTS.findIndex(d => d.value === department);
  return members.sort((a, b) => order(a.department) - order(b.department) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}