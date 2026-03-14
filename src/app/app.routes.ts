import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { PacientesList } from './features/admin/pacientes/pages/list/list';
import { PacienteCreate } from './features/admin/pacientes/pages/create/create';
import { FisioCreate } from './features/admin/fisioterapeutas/pages/create/create';
import { FisioterapeutasList } from './features/admin/fisioterapeutas/pages/list/list';
import { MisPacientes } from './features/fisioterapeuta/pacientes/pages/mis-pacientes/mis-pacientes';



export const routes: Routes = [

  // AUTH
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/pages/login/login')
        .then(m => m.Login)
  },

  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/pages/register/register')
        .then(m => m.Register)
  },

  // APP PROTEGIDA
  {
    path: '',
    loadComponent: () =>
      import('./shared/layouts/main-layout/main-layout')
        .then(m => m.MainLayout),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard')
            .then(m => m.Dashboard)
      },
      {
        path: 'paciente/mi-rutina',
        loadComponent: () =>
          import('./features/paciente/mi-rutina/mi-rutina')
            .then(m => m.MiRutina)
      },
      {
        path: 'fisioterapeuta/mis-pacientes',
        loadComponent: () =>
          import('./features/fisioterapeuta/pacientes/pages/mis-pacientes/mis-pacientes')
            .then(m => m.MisPacientes)
      },
      {
        path: 'fisioterapeuta/pacientes/:id',
        loadComponent: () =>
          import('./features/fisioterapeuta/pacientes/pages/detalle/detalle')
            .then(m => m.DetallePaciente)
      },
      {
        path: 'fisioterapeuta/pacientes/:id/asignar-rutina',
        loadComponent: () =>
          import('./features/fisioterapeuta/pacientes/pages/asignar-rutina/asignar-rutina')
            .then(m => m.AsignarRutina)
      },
      {
        path: 'admin/pacientes',
        component: PacientesList
      },
      {
        path: 'admin/pacientes/crear',
        component: PacienteCreate
      },
      {
        path: 'admin/fisioterapeutas',
        component: FisioterapeutasList
      },
      {
        path: 'admin/fisioterapeutas/crear',
        component: FisioCreate
      },
      {
        path: 'admin/patologias',
        loadComponent: () =>
          import('./features/admin/patologias/pages/list/list')
            .then(m => m.List)
      },
      {
        path: 'admin/patologias/crear',
        loadComponent: () =>
          import('./features/admin/patologias/pages/form/form')
            .then(m => m.Form)
      },
      {
        path: 'admin/patologias/editar/:id',
        loadComponent: () =>
          import('./features/admin/patologias/pages/form/form')
            .then(m => m.Form)
      },
      {
        path: 'admin/ejercicios',
        loadComponent: () =>
          import('./features/admin/ejercicios/pages/list/list')
            .then(m => m.List)
      },
      {
        path: 'admin/ejercicios/crear',
        loadComponent: () =>
          import('./features/admin/ejercicios/pages/form/form')
            .then(m => m.Form)
      },
      {
        path: 'admin/ejercicios/editar/:id',
        loadComponent: () =>
          import('./features/admin/ejercicios/pages/form/form')
            .then(m => m.Form)
      }
    ]
  },

  // DEFAULT
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  }

];
