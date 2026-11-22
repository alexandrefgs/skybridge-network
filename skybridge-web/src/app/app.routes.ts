import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: '',
    title: 'SkyBridge Network',
    loadComponent: () => import('./features/home/home.page').then(m => m.HomePage)
  },
  {
    path: 'airports',
    title: 'Airports · SkyBridge',
    canActivate: [authGuard],
    loadComponent: () => import('./features/airports/airports.page').then(m => m.AirportsPage)
  },
  {
    path: 'aircraft',
    title: 'Aircraft · SkyBridge',
    canActivate: [authGuard],
    loadComponent: () => import('./features/aircraft/aircraft.page').then(m => m.AircraftPage)
  },
  {
    path: 'login',
    title: 'Sign in · SkyBridge',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    title: 'Create account · SkyBridge',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'account/security',
    title: 'Security · SkyBridge',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/security.page').then(m => m.SecurityPage)
  },
  { path: '**', redirectTo: '' }
];