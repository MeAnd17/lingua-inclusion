import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BusquedaService } from '../../services/busqueda.service';
import { LanguageService } from '../../services/language.service';
import { TarjetaPalabraComponent } from '../../components/tarjeta-palabra/tarjeta-palabra.component';
import { AnunciarFocoDirective } from '../../directives/anunciar-foco.directive';
import { TouchTargetDirective } from '../../directives/touch-target.directive';
import { TutorialComponent } from '../../components/tutorial/tutorial.component';
import { Categoria, CATEGORIAS_CONFIG } from '../../models/palabra.model';

@Component({
  selector: 'li-diccionario',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TarjetaPalabraComponent,
    AnunciarFocoDirective, TouchTargetDirective,
    TutorialComponent,
  ],
  template: `
    <main id="contenido-principal" class="diccionario-page">

      <!-- Cabecera de página -->
      <div class="diccionario-hero">
        <div class="contenedor">
          <div class="diccionario-hero__texto">
            <h1 class="diccionario-hero__titulo">{{ t().titulo }}</h1>
            <p class="diccionario-hero__desc">{{ t().desc }}</p>
          </div>
        </div>
      </div>

      <div class="contenedor diccionario-contenido">

        <!-- Buscador -->
        <section class="buscar-seccion" aria-labelledby="buscar-titulo">
          <label id="buscar-titulo" for="campo-busqueda" class="buscar-label">
            {{ t().labelBuscar }}
          </label>
          <div class="buscar-wrapper" role="search">
            <span class="buscar-icono" aria-hidden="true">🔍</span>
            <input
              id="campo-busqueda"
              type="search"
              class="buscar-input"
              [placeholder]="t().placeholder"
              [ngModel]="busquedaService.query()"
              (ngModelChange)="busquedaService.setQuery($event)"
              autocomplete="off"
              spellcheck="false"
              [liAnunciarFoco]="t().labelBuscar"
              [attr.aria-label]="t().labelBuscar"
              aria-autocomplete="list"
              aria-controls="resultados"
            />
            @if (busquedaService.hayBusqueda()) {
              <button class="buscar-limpiar" (click)="busquedaService.limpiarFiltros()"
                      [liAnunciarFoco]="t().limpiar" aria-label="Limpiar búsqueda">
                ✕
              </button>
            }
          </div>
        </section>

        <!-- Filtros de categoría -->
        <section class="filtros-seccion" aria-labelledby="filtros-titulo">
          <h2 id="filtros-titulo" class="filtros-titulo">{{ t().categorias }}</h2>
          <div class="filtros-grid" role="group" [attr.aria-label]="t().categorias">
            <button
              class="filtro-chip"
              [class.filtro-chip--activo]="!busquedaService.categoriaFiltro()"
              (click)="busquedaService.setCategoria(null)"
              [liAnunciarFoco]="t().todas"
              liTouchTarget
            >
              <span aria-hidden="true">🌐</span> {{ t().todas }}
            </button>
            @for (cat of categorias; track cat.id) {
              <button
                class="filtro-chip"
                [class.filtro-chip--activo]="busquedaService.categoriaFiltro() === cat.id"
                [style.--color-cat]="langService.getColorCategoria(cat.id)"
                (click)="busquedaService.setCategoria(cat.id)"
                [liAnunciarFoco]="langService.getLabelCategoriaById(cat.id)"
                liTouchTarget
              >
                <span aria-hidden="true">{{ cat.icono }}</span>
                {{ langService.getLabelCategoriaById(cat.id) }}
              </button>
            }
          </div>
        </section>

        <!-- Contador de resultados -->
        <div class="resultados-meta" aria-live="polite" aria-atomic="true">
          <span class="resultados-count">
            {{ busquedaService.totalResultados() }} {{ t().palabras }}
          </span>
          @if (busquedaService.hayBusqueda()) {
            <span class="resultados-query">
              "{{ busquedaService.query() }}"
            </span>
          }
        </div>

        <!-- Grid de resultados -->
        <section id="resultados" aria-label="Resultados" aria-live="polite">
          @if (busquedaService.totalResultados() === 0 && busquedaService.hayBusqueda()) {
            <div class="sin-resultados" role="status">
              <span aria-hidden="true">🔎</span>
              <p>{{ t().sinResultados }}</p>
              <button class="btn-limpiar" (click)="busquedaService.limpiarFiltros()"
                      [liAnunciarFoco]="t().limpiar" liTouchTarget>
                {{ t().limpiar }}
              </button>
            </div>
          } @else {
            <div class="resultados-grid">
              @for (r of busquedaService.resultados(); track r.palabra.id) {
                <li-tarjeta-palabra [palabra]="r.palabra" />
              }
            </div>
          }
        </section>

      </div>
    </main>
    <li-tutorial seccion="diccionario" />
  `,
  styleUrls: ['./diccionario.component.scss'],
})
export class DiccionarioComponent implements OnInit {
  readonly busquedaService = inject(BusquedaService);
  readonly langService = inject(LanguageService);
  private readonly route = inject(ActivatedRoute);

  readonly categorias = Object.values(CATEGORIAS_CONFIG);

  readonly t = computed(() => {
    const i = this.langService.idioma();
    return {
      es: {
        titulo: '📖 Diccionario',
        desc: 'Busca palabras en español, quechua y aymara. Filtra por categoría.',
        labelBuscar: 'Buscar palabra',
        placeholder: 'Escribe en cualquier idioma...',
        categorias: 'Categorías',
        todas: 'Todas',
        palabras: 'palabras',
        sinResultados: 'No se encontraron resultados. Intenta con otra palabra.',
        limpiar: 'Limpiar búsqueda',
      },
      qu: {
        titulo: '📖 Simikunap Qillqan',
        desc: 'Español, quechua, aymarapiwan simikunata maskay.',
        labelBuscar: 'Simita maskay',
        placeholder: 'Imatam maskankichu...',
        categorias: 'Runaykuna',
        todas: 'Llapan',
        palabras: 'simikunam',
        sinResultados: 'Mana tarikusqachu. Waq simiwan maskaykuy.',
        limpiar: 'Pichay',
      },
      ay: {
        titulo: '📖 Siminakana Qillqa',
        desc: 'Español, quechua, aymararu siminaka maskañataki.',
        labelBuscar: 'Simiña maskañataki',
        placeholder: 'Kunasa maskañataki...',
        categorias: 'Runanaka',
        todas: 'Taqini',
        palabras: 'siminaka',
        sinResultados: 'Janiwa tarxkiti. Walja simiwa maskañataki.',
        limpiar: 'Pichañataki',
      },
    }[i];
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['categoria']) this.busquedaService.setCategoria(params['categoria'] as Categoria);
      if (params['q'])         this.busquedaService.setQuery(params['q']);
    });
  }
}
