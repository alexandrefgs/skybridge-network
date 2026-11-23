import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NavDropdown, NavItem } from './nav-dropdown';

@Component({ template: '' })
class EmptyPage {}

describe('NavDropdown', () => {
  let fixture: ComponentFixture<NavDropdown>;
  const items: NavItem[] = [
    { label: 'Airports', link: '/airports' },
    { label: 'Aircraft', link: '/aircraft', description: 'Types and categories' }
  ];
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'airports', component: EmptyPage }, { path: 'aircraft', component: EmptyPage }, { path: 'freelance', component: EmptyPage }])]
    });
    fixture = TestBed.createComponent(NavDropdown);
    fixture.componentRef.setInput('label', 'About us');
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('testId', 'nav-about');
    await fixture.whenStable();
  });

  it('opens with the links and closes after choosing one', async () => {
    expect(query('nav-about-panel')).toBeNull();

    query('nav-about')!.click();
    await fixture.whenStable();

    expect(query('nav-about-airports')!.getAttribute('href')).toBe('/airports');
    expect(query('nav-about-aircraft')!.textContent).toContain('Types and categories');

    query('nav-about-aircraft')!.click();
    await fixture.whenStable();
    expect(query('nav-about-panel')).toBeNull();
  });

  it('closes when clicking outside or pressing Escape', async () => {
    query('nav-about')!.click();
    await fixture.whenStable();
    document.body.click();
    await fixture.whenStable();
    expect(query('nav-about-panel')).toBeNull();

    query('nav-about')!.click();
    await fixture.whenStable();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(query('nav-about-panel')).toBeNull();
  });

  it('highlights the button on one of its pages', async () => {
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/freelance');
    await fixture.whenStable();
    expect(query('nav-about')!.classList).not.toContain('text-primary');

    await router.navigateByUrl('/aircraft');
    await fixture.whenStable();
    expect(query('nav-about')!.classList).toContain('text-primary');
  });
});