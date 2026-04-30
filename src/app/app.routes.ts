import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/inicio/inicio.component').then((m) => m.InicioComponent),
    title: 'Lingua-Inclusion — Inicio',
  },
  {
    path: 'diccionario',
    loadComponent: () =>
      import('./pages/diccionario/diccionario.component').then((m) => m.DiccionarioComponent),
    title: 'Lingua-Inclusion — Diccionario',
  },
  // Redirigir rutas antiguas
  { path: 'buscar',     redirectTo: 'diccionario', pathMatch: 'full' },
  { path: 'categorias', redirectTo: 'diccionario', pathMatch: 'full' },
  {
    path: 'practica',
    loadComponent: () =>
      import('./pages/practica/practica.component').then((m) => m.PracticaComponent),
    title: 'Lingua-Inclusion — Práctica',
  },
  {
    path: 'acerca',
    loadComponent: () =>
      import('./pages/acerca/acerca.component').then((m) => m.AcercaComponent),
    title: 'Lingua-Inclusion — Acerca de',
  },
  { path: '**', redirectTo: '' },
];
