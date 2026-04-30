import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusquedaService } from '../../services/busqueda.service';
import { LanguageService } from '../../services/language.service';
import { TarjetaPalabraComponent } from '../tarjeta-palabra/tarjeta-palabra.component';
import { AriaDinamicoDirective } from '../../directives/aria-dinamico.directive';
import { TouchTargetDirective } from '../../directives/touch-target.directive';
import { Categoria, CATEGORIAS_CONFIG } from '../../models/palabra.model';

@Component({
  selector: 'li-buscador',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TarjetaPalabraComponent,
    AriaDinamicoDirective,
    TouchTargetDirective,
  ],
  template: `
    <section class="buscador" aria-label="Buscador de palabras">

      <!-- Campo de búsqueda -->
      <div class="buscador__campo-wrapper">
        <label for="campo-busqueda" class="buscador__label">
          {{ labelBusqueda() }}
        </label>
        <div class="buscador__input-wrapper" role="search">
          <span class="buscador__icono-busqueda" aria-hidden="true">🔍</span>
          <input
            id="campo-busqueda"
            type="search"
            class="buscador__input"
            [placeholder]="placeholderBusqueda()"
            [ngModel]="busquedaService.query()"
            (ngModelChange)="onQueryChange($event)"
            (input)="onInput($event)"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
            aria-autocomplete="list"
            [attr.aria-controls]="'resultados-lista'"
            [attr.aria-expanded]="busquedaService.hayBusqueda()"
          />
          @if (busquedaService.hayBusqueda()) {
            <button
              class="buscador__btn-limpiar"
              (click)="limpiar()"
              liTouchTarget
              liAriaLabel="Limpiar búsqueda"
            >
              ✕
            </button>
          }
        </div>
      </div>

      <!-- Filtros por categoría -->
      <div class="buscador__filtros" role="group" aria-label="Filtrar por categoría">
        <button
          class="filtro-btn"
          [class.filtro-btn--activo]="!busquedaService.categoriaFiltro()"
          (click)="filtrarCategoria(null)"
          liTouchTarget
          liAriaLabel="Mostrar todas las categorías"
        >
          <span aria-hidden="true">📋</span>
          <span>{{ langService.idioma() === 'es' ? 'Todas' : langService.idioma() === 'qu' ? 'Llapan' : 'Taqini' }}</span>
        </button>

        @for (cat of categorias; track cat.id) {
          <button
            class="filtro-btn"
            [class.filtro-btn--activo]="busquedaService.categoriaFiltro() === cat.id"
            [style.--color-cat]="langService.getColorCategoria(cat.id)"
            (click)="filtrarCategoria(cat.id)"
            liTouchTarget
            [liAriaLabel]="'Filtrar por ' + langService.getLabelCategoriaById(cat.id)"
          >
            <span aria-hidden="true">{{ cat.icono }}</span>
            <span>{{ langService.getLabelCategoriaById(cat.id) }}</span>
          </button>
        }
      </div>

      <!-- Anuncio de resultados para lectores de pantalla -->
      <div
        class="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        @if (busquedaService.hayBusqueda()) {
          {{ busquedaService.totalResultados() }} resultados para "{{ busquedaService.query() }}"
        }
      </div>

      <!-- Resultados -->
      <div
        id="resultados-lista"
        class="buscador__resultados"
        role="region"
        aria-label="Resultados de búsqueda"
      >
        @if (busquedaService.totalResultados() === 0 && busquedaService.hayBusqueda()) {
          <div class="buscador__sin-resultados" role="status">
            <span aria-hidden="true">🔎</span>
            <p>{{ mensajeSinResultados() }}</p>
            <button class="btn-limpiar-filtros" (click)="limpiar()" liTouchTarget>
              Limpiar búsqueda
            </button>
          </div>
        } @else {
          <div class="buscador__grid">
            @for (resultado of busquedaService.resultados(); track resultado.palabra.id) {
              <li-tarjeta-palabra [palabra]="resultado.palabra" />
            }
          </div>
        }
      </div>
    </section>
  `,
  styleUrls: ['./buscador.component.scss'],
})
export class BuscadorComponent {
  readonly busquedaService = inject(BusquedaService);
  readonly langService = inject(LanguageService);

  readonly categorias = Object.values(CATEGORIAS_CONFIG);

  readonly labelBusqueda = () => {
    const idioma = this.langService.idioma();
    if (idioma === 'qu') return 'Maskay';
    if (idioma === 'ay') return 'Maskañataki';
    return 'Buscar palabra';
  };

  readonly placeholderBusqueda = () => {
    const idioma = this.langService.idioma();
    if (idioma === 'qu') return 'Imatam maskankichu...';
    if (idioma === 'ay') return 'Kunasa maskañataki...';
    return 'Escribe en español, quechua o aymara...';
  };

  readonly mensajeSinResultados = () => {
    const idioma = this.langService.idioma();
    if (idioma === 'qu') return 'Mana tarikusqachu. Waq simiwan maskaykuy.';
    if (idioma === 'ay') return 'Janiwa tarxkiti. Walja simiwa maskañataki.';
    return 'No se encontraron resultados. Intenta con otra palabra.';
  };

  onQueryChange(query: string): void {
    this.busquedaService.setQuery(query);
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.busquedaService.setQuery(input.value);
  }

  filtrarCategoria(categoria: Categoria | null): void {
    this.busquedaService.setCategoria(categoria);
  }

  limpiar(): void {
    this.busquedaService.limpiarFiltros();
  }
}
