import { Routes } from '@angular/router';
import { authGuard, guestGuard, staffGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'SkyBridge Network',
    loadComponent: () => import('./features/public/landing.page').then(m => m.LandingPage)
  },
  {
    path: 'about',
    title: 'About · SkyBridge',
    loadComponent: () => import('./features/public/about.page').then(m => m.AboutPage)
  },
  {
    path: 'staff',
    title: 'Staff · SkyBridge',
    loadComponent: () => import('./features/public/staff.page').then(m => m.StaffPage)
  },
  {
    path: 'regulations',
    title: 'Regulations · SkyBridge',
    loadComponent: () => import('./features/legal/regulations.page').then(m => m.RegulationsPage)
  },
  {
    path: 'privacy',
    title: 'Privacy · SkyBridge',
    loadComponent: () => import('./features/legal/privacy.page').then(m => m.PrivacyPage)
  },
  {
    path: 'operations',
    title: 'Operations · SkyBridge',
    loadComponent: () => import('./features/public/operations.page').then(m => m.OperationsPage)
  },
  {
    path: 'flights',
    title: 'Flights · SkyBridge',
    loadComponent: () => import('./features/public/flights.page').then(m => m.FlightsPage)
  },
  {
    path: 'cockpit',
    title: 'Cockpit · SkyBridge',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/cockpit.page').then(m => m.CockpitPage)
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
    path: 'freelance',
    title: 'Freelance · SkyBridge',
    canActivate: [authGuard],
    loadComponent: () => import('./features/freelance/freelance.page').then(m => m.FreelancePage)
  },
  {
    path: 'logbook',
    title: 'Logbook · SkyBridge',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/logbook.page').then(m => m.LogbookPage)
  },
  {
    path: 'wallet',
    title: 'Wallet · SkyBridge',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/wallet.page').then(m => m.WalletPage)
  },
  {
    path: 'flight',
    title: 'My flight · SkyBridge',
    canActivate: [authGuard],
    loadComponent: () => import('./features/flights/my-flight.page').then(m => m.MyFlightPage)
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
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/account.layout').then(m => m.AccountLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profile' },
      {
        path: 'profile',
        title: 'Profile · SkyBridge',
        loadComponent: () => import('./features/account/profile.page').then(m => m.ProfilePage)
      },
      {
        path: 'security',
        title: 'Security · SkyBridge',
        loadComponent: () => import('./features/account/security.page').then(m => m.SecurityPage)
      }
    ]
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
      },
      {
        path: 'freelance',
        loadComponent: () => import('./features/admin/admin-freelance.page').then(m => m.AdminFreelancePage)
      },
      {
        path: 'pireps',
        loadComponent: () => import('./features/admin/admin-pireps.page').then(m => m.AdminPirepsPage)
      },
      {
        path: 'staff',
        loadComponent: () => import('./features/admin/admin-staff.page').then(m => m.AdminStaffPage)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];