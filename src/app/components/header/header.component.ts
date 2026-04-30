import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { AnunciarFocoDirective } from '../../directives/anunciar-foco.directive';
import { Idioma, PerfilAccesibilidad } from '../../models/palabra.model';

@Component({
  selector: 'li-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AnunciarFocoDirective],
  template: `
    <header class="header" role="banner">
      <div class="header__container">

        <!-- Skip link (primer elemento Tab) -->
        <a href="#contenido-principal" class="skip-link">
          {{ labelSaltar() }}
        </a>

        <!-- Logo -->
        <a routerLink="/" class="header__brand"
           [liAnunciarFoco]="'Lingua-Inclusion, ' + labelInicio()"
           [attr.aria-label]="'Lingua-Inclusion — ' + labelInicio()">
          <span class="header__logo" aria-hidden="true">🌐</span>
          <span class="header__titulo">Lingua-Inclusion</span>
        </a>

        <!-- Nav principal — siempre visible, colapsa en móvil -->
        <nav class="header__nav" role="navigation" aria-label="Navegación principal"
             [class.header__nav--abierto]="menuAbierto()">
          @for (item of navItems(); track item.ruta) {
            <a
              [routerLink]="item.ruta"
              routerLinkActive="nav__enlace--activo"
              [routerLinkActiveOptions]="{ exact: item.ruta === '/' }"
              class="nav__enlace"
              [liAnunciarFoco]="item.label"
              [attr.aria-label]="item.label"
              (click)="cerrarMenu()"
            >
              <span class="nav__icono" aria-hidden="true">{{ item.icono }}</span>
              <span class="nav__texto">{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- Controles derecha -->
        <div class="header__controles" role="toolbar" aria-label="Controles de accesibilidad">

          <!-- Selector de idioma -->
          <div class="header__idiomas" role="group" [attr.aria-label]="labelIdioma()">
            @for (idioma of idiomas; track idioma.codigo) {
              <button
                class="btn-idioma"
                [class.btn-idioma--activo]="langService.idioma() === idioma.codigo"
                (click)="cambiarIdioma(idioma.codigo)"
                [liAnunciarFoco]="'Cambiar a ' + idioma.nombre"
                [attr.aria-label]="'Cambiar a ' + idioma.nombre"
                [attr.aria-pressed]="langService.idioma() === idioma.codigo"
                [attr.data-announce-lang]="idioma.codigo"
                [attr.data-announce-text]="idioma.anuncio"
              >
                {{ idioma.bandera }} {{ idioma.codigo.toUpperCase() }}
              </button>
            }
          </div>

          <!-- Selector de perfil -->
          <div class="header__perfiles" role="group" [attr.aria-label]="labelAccesibilidad()">
            @for (perfil of perfiles(); track perfil.id) {
              <button
                class="btn-perfil"
                [class.btn-perfil--activo]="langService.perfil() === perfil.id"
                (click)="cambiarPerfil(perfil.id)"
                [liAnunciarFoco]="perfil.labelActual()"
                [attr.aria-label]="perfil.labelActual()"
                [attr.aria-pressed]="langService.perfil() === perfil.id"
                [attr.data-announce-lang]="langService.idioma()"
                [attr.data-announce-text]="perfil.labelActual()"
                [title]="perfil.labelActual()"
              >
                <span aria-hidden="true">{{ perfil.icono }}</span>
              </button>
            }
          </div>

          <!-- Hamburguesa — solo móvil -->
          <button
            class="btn-hamburguesa"
            [class.btn-hamburguesa--abierto]="menuAbierto()"
            (click)="toggleMenu()"
            [liAnunciarFoco]="menuAbierto() ? labelCerrarMenu() : labelAbrirMenu()"
            [attr.aria-label]="menuAbierto() ? labelCerrarMenu() : labelAbrirMenu()"
            [attr.aria-expanded]="menuAbierto()"
            aria-controls="header-nav"
          >
            <span class="hamburguesa-linea" aria-hidden="true"></span>
            <span class="hamburguesa-linea" aria-hidden="true"></span>
            <span class="hamburguesa-linea" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  readonly langService = inject(LanguageService);
  readonly menuAbierto = signal(false);

  readonly idiomas: { codigo: Idioma; nombre: string; bandera: string; anuncio: string }[] = [
    { codigo: 'es', nombre: 'Español', bandera: '🇵🇪', anuncio: 'Cambiar a Español' },
    { codigo: 'qu', nombre: 'Quechua', bandera: '🏔️',  anuncio: 'Quechua simipi tikray' },
    { codigo: 'ay', nombre: 'Aymara',  bandera: '🌄',  anuncio: 'Aymara simiru tikraña' },
  ];

  readonly perfiles = computed(() => {
    const i = this.langService.idioma();
    const labels: Record<string, Record<string, string>> = {
      estandar:        { es: 'Modo estándar',      qu: 'Lliw rikuy',         ay: 'Lliw uñt\'aña'      },
      'alto-contraste':{ es: 'Alto contraste',      qu: 'Hatun contraste',    ay: 'Jach\'a contraste'  },
      'solo-audio':    { es: 'Solo audio',           qu: 'Uyariy kama',        ay: 'Uyañataki kama'     },
      pictogramas:     { es: 'Modo pictogramas',     qu: 'Rikuchiy rikuy',     ay: 'Uñt\'ayiri uñaña'  },
    };
    return [
      { id: 'estandar'        as PerfilAccesibilidad, icono: '👁️', labelActual: () => labels['estandar'][i]         },
      { id: 'alto-contraste'  as PerfilAccesibilidad, icono: '◑',  labelActual: () => labels['alto-contraste'][i]   },
      { id: 'solo-audio'      as PerfilAccesibilidad, icono: '🔊', labelActual: () => labels['solo-audio'][i]       },
      { id: 'pictogramas'     as PerfilAccesibilidad, icono: '🖼️', labelActual: () => labels['pictogramas'][i]      },
    ];
  });

  readonly navItems = computed(() => {
    const i = this.langService.idioma();
    const t = {
      es: { inicio: 'Inicio', dic: 'Diccionario', practica: 'Práctica', acerca: 'Acerca de' },
      qu: { inicio: 'Qallariy', dic: 'Simikunap Qillqan', practica: 'Yachay Pukllay', acerca: 'Imamanta' },
      ay: { inicio: 'Qalltaña', dic: 'Siminakana Qillqa', practica: 'Yatiqaña Pukaraña', acerca: 'Kunmanta' },
    }[i];
    return [
      { ruta: '/',           label: t.inicio,    icono: '🏠' },
      { ruta: '/diccionario',label: t.dic,       icono: '📖' },
      { ruta: '/practica',   label: t.practica,  icono: '🎮' },
      { ruta: '/acerca',     label: t.acerca,    icono: 'ℹ️' },
    ];
  });

  readonly labelIdioma      = computed(() => ({ es: 'Idioma', qu: 'Simi', ay: 'Simi' }[this.langService.idioma()]));
  readonly labelAccesibilidad = computed(() => ({ es: 'Accesibilidad', qu: 'Yanapay', ay: 'Yanapt\'aña' }[this.langService.idioma()]));
  readonly labelInicio      = computed(() => ({ es: 'Inicio', qu: 'Qallariy', ay: 'Qalltaña' }[this.langService.idioma()]));
  readonly labelSaltar      = computed(() => ({ es: 'Saltar al contenido', qu: 'Contenidoman riy', ay: 'Contenidoru saraña' }[this.langService.idioma()]));
  readonly labelAbrirMenu   = computed(() => ({ es: 'Abrir menú', qu: 'Menuta kichariy', ay: 'Menú kichañataki' }[this.langService.idioma()]));
  readonly labelCerrarMenu  = computed(() => ({ es: 'Cerrar menú', qu: 'Menuta wichʼuy', ay: 'Menú wichʼuña' }[this.langService.idioma()]));

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.menuAbierto()) this.cerrarMenu();
  }

  cambiarIdioma(idioma: Idioma): void   { this.langService.setIdioma(idioma); }
  cambiarPerfil(p: PerfilAccesibilidad): void { this.langService.setPerfil(p); }

  toggleMenu(): void {
    this.menuAbierto.update((v) => !v);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = this.menuAbierto() ? 'hidden' : '';
    }
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  }
}
