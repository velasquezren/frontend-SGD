import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canMatch: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
    title: 'Iniciar sesión — SGD Montalvo',
  },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('./layout/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
        title: 'Inicio — SGD Montalvo',
      },

      // Departamentos
      {
        path: 'departamentos',
        loadComponent: () => import('./features/departments/department-list.page').then((m) => m.DepartmentListPage),
        title: 'Departamentos — SGD Montalvo',
      },
      {
        // Matches both `/departamentos/nuevo` (id === 'nuevo' -> create) and
        // `/departamentos/<uuid>` (edit) — one component handles both, see
        // `DepartmentFormPage.isEdit`. No separate static 'nuevo' route.
        // Same pattern for documentos/usuarios below. No /roles route: see
        // core/auth/roles.ts — roles are fixed, assigned as a plain field
        // right on the Usuarios form.
        path: 'departamentos/:id',
        loadComponent: () => import('./features/departments/department-form.page').then((m) => m.DepartmentFormPage),
        title: 'Departamento — SGD Montalvo',
      },

      // Documentos
      {
        path: 'documentos',
        loadComponent: () => import('./features/documents/document-list.page').then((m) => m.DocumentListPage),
        title: 'Documentos — SGD Montalvo',
      },
      {
        path: 'documentos/:id',
        loadComponent: () => import('./features/documents/document-form.page').then((m) => m.DocumentFormPage),
        title: 'Documento — SGD Montalvo',
      },

      // Usuarios
      {
        path: 'usuarios',
        loadComponent: () => import('./features/users/user-list.page').then((m) => m.UserListPage),
        title: 'Usuarios — SGD Montalvo',
      },
      {
        path: 'usuarios/:id',
        loadComponent: () => import('./features/users/user-form.page').then((m) => m.UserFormPage),
        title: 'Usuario — SGD Montalvo',
      },
    ],
  },
];
