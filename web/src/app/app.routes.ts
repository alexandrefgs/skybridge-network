import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/landing/landing').then(m => m.Landing) },
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'perfil', loadComponent: () => import('./features/perfil/perfil').then(m => m.Perfil) },
  { path: 'companhias', loadComponent: () => import('./features/companhias/companhias').then(m => m.Companhias) },
  { path: 'reportar-voo', loadComponent: () => import('./features/enviar-pirep/enviar-pirep').then(m => m.EnviarPirep) },
  { path: 'admin/companhias', loadComponent: () => import('./features/admin/companhias/companhias').then(m => m.AdminCompanhias) },
  { path: '**', redirectTo: '' },
];
