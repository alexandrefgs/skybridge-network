import { HttpErrorResponse } from '@angular/common/http';

interface ProblemBody {
  title?: string;
  errors?: Record<string, string[]>;
}

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

export function problemMessages(error: unknown): string[] {
  if (!(error instanceof HttpErrorResponse)) return [GENERIC_MESSAGE];
  if (error.status === 0) return ['Cannot reach the server. Is the API running?'];

  const body = error.error as ProblemBody | null;
  const details = body?.errors ? Object.values(body.errors).flat() : [];
  if (details.length) return details;
  return [body?.title ?? GENERIC_MESSAGE];
}