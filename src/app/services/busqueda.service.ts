import { Injectable, signal, computed, inject } from '@angular/core';
import { Palabra, Categoria, Idioma } from '../models/palabra.model';
import { PALABRAS_DATA } from '../data/palabras.data';
import { LanguageService } from './language.service';

export interface ResultadoBusqueda {
  palabra: Palabra;
  relevancia: number;
  campoEncontrado: 'termino' | 'definicion' | 'etiqueta';
}

/**
 * Servicio de búsqueda reactiva multilingüe.
 * Filtra el dataset en los tres idiomas simultáneamente.
 */
@Injectable({ providedIn: 'root' })
export class BusquedaService {
  private readonly langService = inject(LanguageService);

  // ── Signals de estado de búsqueda ─────────────────────────────────────────
  private readonly _query = signal<string>('');
  private readonly _categoriaFiltro = signal<Categoria | null>(null);
  private readonly _nivelFiltro = signal<1 | 2 | 3 | null>(null);

  readonly query = this._query.asReadonly();
  readonly categoriaFiltro = this._categoriaFiltro.asReadonly();

  /** Resultados filtrados y ordenados por relevancia */
  readonly resultados = computed<ResultadoBusqueda[]>(() => {
    const q = this._query().trim().toLowerCase();
    const cat = this._categoriaFiltro();
    const nivel = this._nivelFiltro();

    let palabras = PALABRAS_DATA;

    // Filtro por categoría
    if (cat) {
      palabras = palabras.filter((p) => p.categoria === cat);
    }

    // Filtro por nivel
    if (nivel) {
      palabras = palabras.filter((p) => p.nivelDificultad === nivel);
    }

    // Sin query: devolver todo filtrado
    if (!q) {
      return palabras.map((p) => ({ palabra: p, relevancia: 1, campoEncontrado: 'termino' as const }));
    }

    // Búsqueda en los tres idiomas
    const resultados: ResultadoBusqueda[] = [];

    for (const palabra of palabras) {
      const resultado = this.calcularRelevancia(palabra, q);
      if (resultado) resultados.push(resultado);
    }

    // Ordenar por relevancia descendente
    return resultados.sort((a, b) => b.relevancia - a.relevancia);
  });

  /** Total de resultados */
  readonly totalResultados = computed(() => this.resultados().length);

  /** Indica si hay búsqueda activa */
  readonly hayBusqueda = computed(() => this._query().trim().length > 0);

  // ── Mutadores ──────────────────────────────────────────────────────────────

  setQuery(query: string): void {
    this._query.set(query);
  }

  setCategoria(categoria: Categoria | null): void {
    this._categoriaFiltro.set(categoria);
  }

  setNivel(nivel: 1 | 2 | 3 | null): void {
    this._nivelFiltro.set(nivel);
  }

  limpiarFiltros(): void {
    this._query.set('');
    this._categoriaFiltro.set(null);
    this._nivelFiltro.set(null);
  }

  // ── Helpers privados ───────────────────────────────────────────────────────

  private calcularRelevancia(palabra: Palabra, query: string): ResultadoBusqueda | null {
    const idiomas: Idioma[] = ['es', 'qu', 'ay'];
    let maxRelevancia = 0;
    let campoEncontrado: ResultadoBusqueda['campoEncontrado'] = 'termino';

    for (const idioma of idiomas) {
      const traduccion = palabra[idioma];

      // Coincidencia exacta en término (mayor relevancia)
      if (traduccion.termino.toLowerCase() === query) {
        return { palabra, relevancia: 100, campoEncontrado: 'termino' };
      }

      // Término empieza con la query
      if (traduccion.termino.toLowerCase().startsWith(query)) {
        if (90 > maxRelevancia) {
          maxRelevancia = 90;
          campoEncontrado = 'termino';
        }
      }

      // Término contiene la query
      if (traduccion.termino.toLowerCase().includes(query)) {
        if (70 > maxRelevancia) {
          maxRelevancia = 70;
          campoEncontrado = 'termino';
        }
      }

      // Definición contiene la query
      if (traduccion.definicion.toLowerCase().includes(query)) {
        if (40 > maxRelevancia) {
          maxRelevancia = 40;
          campoEncontrado = 'definicion';
        }
      }
    }

    // Búsqueda en etiquetas
    for (const etiqueta of palabra.etiquetas) {
      if (etiqueta.toLowerCase().includes(query)) {
        if (50 > maxRelevancia) {
          maxRelevancia = 50;
          campoEncontrado = 'etiqueta';
        }
      }
    }

    return maxRelevancia > 0 ? { palabra, relevancia: maxRelevancia, campoEncontrado } : null;
  }
}
