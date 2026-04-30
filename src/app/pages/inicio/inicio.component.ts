import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { BusquedaService } from '../../services/busqueda.service';
import { TarjetaPalabraComponent } from '../../components/tarjeta-palabra/tarjeta-palabra.component';
import { TouchTargetDirective } from '../../directives/touch-target.directive';
import { CATEGORIAS_CONFIG, Categoria } from '../../models/palabra.model';
import { PALABRAS_DATA } from '../../data/palabras.data';

import { TutorialComponent } from '../../components/tutorial/tutorial.component';

@Component({
  selector: 'li-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink, TarjetaPalabraComponent, TouchTargetDirective, TutorialComponent],
  template: `
    <main id="contenido-principal">

      <!-- ── Hero ── -->
      <section class="hero" aria-labelledby="hero-titulo">
        <div class="hero__contenido">
          <div class="hero__badge" role="note">
            <span aria-hidden="true">🎯</span>
            ODS 10 — Reducción de Desigualdades
          </div>
          <h1 id="hero-titulo" class="hero__titulo">{{ textos().titulo }}</h1>
          <p class="hero__subtitulo">{{ textos().subtitulo }}</p>

          <div class="hero__acciones">
            <a routerLink="/diccionario" class="btn-primario" liTouchTarget>
              <span aria-hidden="true">📖</span> {{ textos().btnBuscar }}
            </a>
            <a routerLink="/practica" class="btn-secundario" liTouchTarget>
              <span aria-hidden="true">🎮</span> {{ textos().btnCategorias }}
            </a>
          </div>

          <div class="hero__stats" aria-label="Estadísticas">
            <div class="hero__stat">
              <strong>86</strong>
              <span>{{ textos().statPalabras }}</span>
            </div>
            <div class="hero__stat">
              <strong>3</strong>
              <span>{{ textos().statIdiomas }}</span>
            </div>
            <div class="hero__stat">
              <strong>8</strong>
              <span>{{ textos().statCategorias }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Categorías ── -->
      <section class="categorias-section" aria-labelledby="categorias-titulo">
        <div class="contenedor">
          <div class="seccion-header">
            <h2 id="categorias-titulo" class="seccion-titulo">{{ textos().tituloCategorias }}</h2>
            <p class="seccion-subtitulo">{{ textos().subtituloCategorias }}</p>
          </div>
          <div class="categorias-grid" role="list">
            @for (cat of categorias(); track cat.id) {
              <a
                [routerLink]="['/diccionario']"
                [queryParams]="{ categoria: cat.id }"
                class="categoria-card"
                [style.--color-cat]="cat.colorActivo"
                role="listitem"
                [attr.aria-label]="cat.label + ': explorar palabras'"
                liTouchTarget
              >
                <span class="categoria-card__icono" aria-hidden="true">{{ cat.icono }}</span>
                <span class="categoria-card__label">{{ cat.label }}</span>
                <span class="categoria-card__count" [attr.aria-label]="contarPorCategoria(cat.id) + ' palabras'">
                  {{ contarPorCategoria(cat.id) }}
                </span>
              </a>
            }
          </div>
        </div>
      </section>

      <!-- ── Palabras destacadas ── -->
      <section class="destacadas-section" aria-labelledby="destacadas-titulo">
        <div class="contenedor">
          <div class="seccion-header">
            <h2 id="destacadas-titulo" class="seccion-titulo">{{ textos().tituloDestacadas }}</h2>
            <p class="seccion-subtitulo">{{ textos().subtituloDestacadas }}</p>
          </div>
          <div class="palabras-grid">
            @for (palabra of palabrasDestacadas(); track palabra.id) {
              <li-tarjeta-palabra [palabra]="palabra" />
            }
          </div>
          <div class="ver-mas">
            <a routerLink="/diccionario" class="btn-ver-mas" liTouchTarget>
              {{ textos().verMas }} →
            </a>
          </div>
        </div>
      </section>

      <!-- ── Features ── -->
      <section class="features-section" aria-labelledby="features-titulo">
        <div class="contenedor">
          <div class="seccion-header">
            <h2 id="features-titulo" class="seccion-titulo">{{ textos().tituloAccesibilidad }}</h2>
          </div>
          <div class="features-grid" role="list">
            @for (feature of features(); track feature.icono) {
              <div class="feature-card" role="listitem">
                <span class="feature-card__icono" aria-hidden="true">{{ feature.icono }}</span>
                <h3 class="feature-card__titulo">{{ feature.titulo }}</h3>
                <p class="feature-card__desc">{{ feature.descripcion }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ── ODS Banner ── -->
      <section class="ods-banner" aria-label="Objetivo de Desarrollo Sostenible 10">
        <div class="contenedor">
          <div class="ods-banner__badge">🌍 ODS 10</div>
          <h2 class="ods-banner__titulo">{{ textos().odsTitulo }}</h2>
          <p class="ods-banner__desc">{{ textos().odsDesc }}</p>
        </div>
      </section>

      <!-- Tutorial flotante -->
      <li-tutorial seccion="inicio" />

    </main>
  `,
  styleUrls: ['./inicio.component.scss'],
})
export class InicioComponent {
  readonly langService = inject(LanguageService);
  readonly busquedaService = inject(BusquedaService);

  readonly categorias = this.langService.categoriasConfig;

  readonly palabrasDestacadas = computed(() =>
    PALABRAS_DATA.filter((p) => p.nivelDificultad === 1).slice(0, 6)
  );

  readonly textos = computed(() => {
    const idioma = this.langService.idioma();
    const textosPorIdioma = {
      es: {
        titulo: 'Lingua-Inclusion',
        subtitulo: 'Acceso a la información en tu idioma: Español, Quechua y Aymara',
        btnBuscar: 'Buscar palabras',
        btnCategorias: 'Ver categorías',
        statPalabras: 'Palabras',
        statIdiomas: 'Idiomas',
        statCategorias: 'Categorías',
        tituloCategorias: 'Explorar por categoría',
        subtituloCategorias: 'Elige un tema para ver sus palabras',
        tituloDestacadas: 'Palabras esenciales',
        subtituloDestacadas: 'Las más importantes para el día a día',
        tituloAccesibilidad: '¿Cómo te ayudamos?',
        verMas: 'Ver todas las palabras',
        odsTitulo: 'Comprometidos con la igualdad',
        odsDesc: 'Lingua-Inclusion nace del ODS 10 para garantizar que ninguna persona quede excluida por su idioma o capacidad.',
      },
      qu: {
        titulo: 'Lingua-Inclusion',
        subtitulo: 'Simiykipi willakuykuna: Español, Quechua, Aymara',
        btnBuscar: 'Simikunata maskay',
        btnCategorias: 'Runakunata qhaway',
        statPalabras: 'Simikunam',
        statIdiomas: 'Simikuna',
        statCategorias: 'Runaykuna',
        tituloCategorias: 'Runakunapi maskay',
        subtituloCategorias: 'Huk runayta akllay simikunata rikunapaq',
        tituloDestacadas: 'Allin simikunam',
        subtituloDestacadas: 'Sapa punchaw necesario simikunam',
        tituloAccesibilidad: 'Imaynatataq yanapasunki?',
        verMas: 'Llapan simikunata qhaway',
        odsTitulo: 'Kikin kausaypaq llamkanchik',
        odsDesc: 'Lingua-Inclusion ODS 10manta paqarisqa llapan runakuna simikunanpi yachaykunata chaskikunankupaq.',
      },
      ay: {
        titulo: 'Lingua-Inclusion',
        subtitulo: 'Simiruxa yatiyañanaka: Español, Quechua, Aymara',
        btnBuscar: 'Siminaka maskañataki',
        btnCategorias: 'Runanaka uñt\'aña',
        statPalabras: 'Siminaka',
        statIdiomas: 'Siminaka',
        statCategorias: 'Runanaka',
        tituloCategorias: 'Runanakampi maskañataki',
        subtituloCategorias: 'Huk runaña akllaña siminaka uñt\'añataki',
        tituloDestacadas: 'Alwa siminaka',
        subtituloDestacadas: 'Sapa uru necesario siminaka',
        tituloAccesibilidad: 'Kunjamatisa yanapt\'añataki?',
        verMas: 'Taqini siminaka uñt\'aña',
        odsTitulo: 'Kikin kawsañataki lurañataki',
        odsDesc: 'Lingua-Inclusion ODS 10manta jutiri taqini jaqi simirunxa yatiyañanaka chaskiñataki.',
      },
    };
    return textosPorIdioma[idioma];
  });

  readonly features = computed(() => {
    const idioma = this.langService.idioma();
    const lista = [
      {
        icono: '🔊',
        titulo: idioma === 'es' ? 'Audio en 3 idiomas' : idioma === 'qu' ? 'Kimsa simip audio' : 'Kimsa simiru audio',
        descripcion: idioma === 'es'
          ? 'Escucha la pronunciación correcta en español, quechua y aymara.'
          : idioma === 'qu'
          ? 'Español, quechua, aymarapiwan simikunata uyariy.'
          : 'Español, quechua, aymararu siminaka uyañataki.',
      },
      {
        icono: '🖼️',
        titulo: idioma === 'es' ? 'Pictogramas' : 'Pictogramas',
        descripcion: idioma === 'es'
          ? 'Imágenes y símbolos para facilitar la comprensión.'
          : 'Imakunata rikuchinapaq.',
      },
      {
        icono: '◑',
        titulo: idioma === 'es' ? 'Alto contraste' : idioma === 'qu' ? 'Hatun contraste' : 'Jach\'a contraste',
        descripcion: idioma === 'es'
          ? 'Modo de alto contraste para personas con baja visión (WCAG AA).'
          : 'Rikuyta yanapaq contraste.',
      },
      {
        icono: '📶',
        titulo: idioma === 'es' ? 'Funciona sin internet' : 'Internet sinchi',
        descripcion: idioma === 'es'
          ? 'Disponible offline gracias a la tecnología PWA.'
          : 'Internet illasqanpipas llamkán.',
      },
    ];
    return lista;
  });

  contarPorCategoria(categoria: Categoria): number {
    return PALABRAS_DATA.filter((p) => p.categoria === categoria).length;
  }
}
