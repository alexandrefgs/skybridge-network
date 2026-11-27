import { ValidatorFn, Validators } from '@angular/forms';

export const networkIdValidators: ValidatorFn[] = [Validators.pattern(/^\s*\d{1,8}\s*$/)];

export function toNetworkId(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}