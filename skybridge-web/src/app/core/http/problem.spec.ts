import { HttpErrorResponse } from '@angular/common/http';
import { problemMessages } from './problem';

describe('problemMessages', () => {
  it('flattens validation errors', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { title: 'One or more validation errors occurred.', errors: { DuplicateEmail: ['Email is already taken.'], PasswordTooShort: ['Too short.'] } }
    });
    expect(problemMessages(error)).toEqual(['Email is already taken.', 'Too short.']);
  });

  it('falls back to the problem title', () => {
    const error = new HttpErrorResponse({ status: 401, error: { title: 'Invalid email or password.' } });
    expect(problemMessages(error)).toEqual(['Invalid email or password.']);
  });

  it('explains when the API is unreachable', () => {
    expect(problemMessages(new HttpErrorResponse({ status: 0 }))).toEqual(['Cannot reach the server. Is the API running?']);
  });
});