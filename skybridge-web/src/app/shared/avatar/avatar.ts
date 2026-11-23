import { Component, computed, input, linkedSignal } from '@angular/core';

export const DEFAULT_AVATAR = 'avatar-default.svg';

@Component({
  selector: 'sb-avatar',
  host: { class: 'inline-block shrink-0 overflow-hidden rounded-full bg-surface-2 ring-1 ring-line' },
  template: `<img [src]="source()" [alt]="alt()" class="h-full w-full object-cover" (error)="failed.set(true)" />`
})
export class Avatar {
  readonly url = input<string | null | undefined>(null);
  readonly alt = input('');

  protected readonly failed = linkedSignal({ source: this.url, computation: () => false });
  protected readonly source = computed(() => (!this.failed() && this.url()) || DEFAULT_AVATAR);
}