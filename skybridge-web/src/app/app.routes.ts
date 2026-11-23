import { Routes } from '@angular/router';
import { authGuard, guestGuard, staffGuard } from './core/auth/auth.guards';

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
    path: 'airlines',
    title: 'Airlines · SkyBridge',
    canActivate: [authGuard],
    loadComponent: () => import('./features/airlines/airlines.page').then(m => m.AirlinesPage)
  },
  {
    path: 'airlines/:id',
    title: 'Airline · SkyBridge',
    canActivate: [authGuard],
    loadComponent: () => import('./features/airlines/airline.page').then(m => m.AirlinePage)
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
  {
    path: 'admin',
    title: 'Admin · SkyBridge',
    canActivate: [authGuard, staffGuard],
    loadComponent: () => import('./features/admin/admin.layout').then(m => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'categories' },
      {
        path: 'categories',
        loadComponent: () => import('./features/admin/admin-categories.page').then(m => m.AdminCategoriesPage)
      },
      {
        path: 'aircraft-types',
        loadComponent: () => import('./features/admin/admin-aircraft-types.page').then(m => m.AdminAircraftTypesPage)
      },
      {
        path: 'airlines',
        loadComponent: () => import('./features/admin/admin-airlines.page').then(m => m.AdminAirlinesPage)
      },
      {
        path: 'airlines/:id',
        loadComponent: () => import('./features/admin/admin-airline.page').then(m => m.AdminAirlinePage)
      },
      {
        path: 'airports',
        loadComponent: () => import('./features/admin/admin-airports.page').then(m => m.AdminAirportsPage)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];