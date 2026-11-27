import { DatePipe, UpperCasePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Regulations } from '../../core/account/account.models';
import { AccountService } from '../../core/account/account.service';
import { ClientConfigService } from '../../core/config/client-config.service';

export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

@Component({
  selector: 'sb-legal-document',
  imports: [DatePipe, UpperCasePipe],
  template: `
    <p class="font-mono text-xs tracking-[0.2em] text-primary">{{ eyebrow() }}</p>
    <h1 class="mt-2 font-display text-5xl font-bold tracking-tight">{{ title() }}</h1>
    <p class="mt-4 max-w-2xl text-muted">{{ intro() }}</p>
    @if (regulations(); as current) {
      <p class="mt-4 inline-flex rounded-full border border-line px-3 py-1 font-mono text-xs text-muted" data-testid="legal-version">
        VERSION {{ current.currentVersion }} · IN FORCE SINCE {{ current.history[current.history.length - 1].effectiveOn | date: 'd MMM yyyy' : 'UTC' | uppercase }}
      </p>
    }

    <div class="mt-12 grid gap-12 lg:grid-cols-[14rem_1fr]">
      <nav class="hidden lg:block" aria-label="Contents">
        <ol class="sticky top-24 space-y-2 border-l border-line text-sm">
          @for (section of sections(); track section.id; let i = $index) {
            <li><a [href]="'#' + section.id" class="-ml-px block border-l border-transparent pl-4 text-muted hover:border-primary hover:text-foreground">{{ i + 1 }}. {{ section.title }}</a></li>
          }
          <li><a href="#contact" class="-ml-px block border-l border-transparent pl-4 text-muted hover:border-primary hover:text-foreground">{{ sections().length + 1 }}. Contact</a></li>
        </ol>
      </nav>

      <article class="max-w-3xl space-y-12" data-testid="legal-sections">
        @for (section of sections(); track section.id; let i = $index) {
          <section [id]="section.id" class="scroll-mt-24">
            <h2 class="flex items-baseline gap-3 font-display text-2xl font-bold">
              <span class="font-mono text-sm text-primary">{{ (i + 1).toString().padStart(2, '0') }}</span>{{ section.title }}
            </h2>
            @for (paragraph of section.paragraphs ?? []; track paragraph) {
              <p class="mt-3 leading-relaxed text-muted">{{ paragraph }}</p>
            }
            @if (section.bullets?.length) {
              <ul class="mt-4 space-y-2">
                @for (bullet of section.bullets; track bullet) {
                  <li class="flex gap-3 leading-relaxed text-muted"><span class="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></span><span>{{ bullet }}</span></li>
                }
              </ul>
            }
          </section>
        }

        <section id="contact" class="scroll-mt-24 rounded-2xl border border-line bg-surface p-6" data-testid="legal-contact">
          <h2 class="flex items-baseline gap-3 font-display text-2xl font-bold">
            <span class="font-mono text-sm text-primary">{{ (sections().length + 1).toString().padStart(2, '0') }}</span>Contact
          </h2>
          @if (config.contactEmail(); as email) {
            <p class="mt-3 text-muted">Write to <a [href]="'mailto:' + email" class="text-primary underline">{{ email }}</a>.</p>
          } @else if (config.discordUrl(); as discord) {
            <p class="mt-3 text-muted">Talk to the staff on our <a [href]="discord" target="_blank" rel="noopener" class="text-primary underline">Discord server</a>.</p>
          } @else {
            <p class="mt-3 text-muted">Talk to the staff on our Discord server.</p>
          }
        </section>

        @if (showHistory() && regulations(); as current) {
          <section class="scroll-mt-24" data-testid="legal-history">
            <h2 class="font-display text-2xl font-bold">Change history</h2>
            <ol class="mt-4 space-y-4">
              @for (version of current.history.slice().reverse(); track version.version) {
                <li class="border-l-2 border-line pl-4">
                  <p class="font-mono text-xs text-muted">VERSION {{ version.version }} · {{ version.effectiveOn | date: 'd MMM yyyy' : 'UTC' }}</p>
                  <ul class="mt-1 list-disc pl-5 text-sm text-muted">
                    @for (change of version.changes; track change) {
                      <li>{{ change }}</li>
                    }
                  </ul>
                </li>
              }
            </ol>
          </section>
        }
      </article>
    </div>
  `
})
export class LegalDocument {
  protected readonly config = inject(ClientConfigService);

  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly intro = input.required<string>();
  readonly sections = input.required<LegalSection[]>();
  readonly showHistory = input(false);

  protected readonly regulations = signal<Regulations | null>(null);

  constructor() {
    inject(AccountService)
      .regulations()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: regulations => this.regulations.set(regulations), error: () => undefined });
  }
}