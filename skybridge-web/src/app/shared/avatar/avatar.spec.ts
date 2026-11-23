import { TestBed } from '@angular/core/testing';
import { Avatar, DEFAULT_AVATAR } from './avatar';

describe('Avatar', () => {
  function render(url: string | null) {
    const fixture = TestBed.createComponent(Avatar);
    fixture.componentRef.setInput('url', url);
    fixture.detectChanges();
    return fixture;
  }

  const image = (element: HTMLElement) => element.querySelector('img') as HTMLImageElement;

  it('shows the default picture when the user has none', () => {
    const fixture = render(null);

    expect(image(fixture.nativeElement).getAttribute('src')).toBe(DEFAULT_AVATAR);
  });

  it('shows the user picture', () => {
    const fixture = render('/api/users/1/avatar?v=1');

    expect(image(fixture.nativeElement).getAttribute('src')).toBe('/api/users/1/avatar?v=1');
  });

  it('falls back to the default picture when the image fails to load', () => {
    const fixture = render('/api/users/1/avatar?v=1');

    image(fixture.nativeElement).dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(image(fixture.nativeElement).getAttribute('src')).toBe(DEFAULT_AVATAR);
  });

  it('tries again when the picture changes', () => {
    const fixture = render('/api/users/1/avatar?v=1');
    image(fixture.nativeElement).dispatchEvent(new Event('error'));
    fixture.detectChanges();

    fixture.componentRef.setInput('url', '/api/users/1/avatar?v=2');
    fixture.detectChanges();

    expect(image(fixture.nativeElement).getAttribute('src')).toBe('/api/users/1/avatar?v=2');
  });
});