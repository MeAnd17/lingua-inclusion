import { Injectable, signal, computed, effect } from '@angular/core';
import {
  Idioma,
  PerfilAccesibilidad,
  EstadoApp,
  Categoria,
  CATEGORIAS_CONFIG,
  CategoriaConfig,
} from '../models/palabra.model';

const STORAGE_KEY = 'lingua-inclusion-estado';

const ESTADO_INICIAL: EstadoApp = {
  idioma: 'es',
  perfil: 'estandar',
  volumenAudio: 0.8,
  velocidadTTS: 1.0,
  tamanoFuente: 'normal',
};

/**
 * Servicio central de estado global usando Angular Signals.
 * Gestiona idioma, perfil de accesibilidad y preferencias del usuario.
 * Persiste automáticamente en localStorage.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  // ── Signals privados (fuente de verdad) ────────────────────────────────────
  private readonly _idioma = signal<Idioma>(this.cargarEstado().idioma);
  private readonly _perfil = signal<PerfilAccesibilidad>(this.cargarEstado().perfil);
  private readonly _volumen = signal<number>(this.cargarEstado().volumenAudio);
  private readonly _velocidadTTS = signal<number>(this.cargarEstado().velocidadTTS);
  private readonly _tamanoFuente = signal<EstadoApp['tamanoFuente']>(
    this.cargarEstado().tamanoFuente
  );

  // ── Signals públicos de solo lectura ───────────────────────────────────────
  readonly idioma = this._idioma.asReadonly();
  readonly perfil = this._perfil.asReadonly();
  readonly volumen = this._volumen.asReadonly();
  readonly velocidadTTS = this._velocidadTTS.asReadonly();
  readonly tamanoFuente = this._tamanoFuente.asReadonly();

  // ── Computed signals ───────────────────────────────────────────────────────

  /** Indica si el modo alto contraste está activo */
  readonly esAltoContraste = computed(() => this._perfil() === 'alto-contraste');

  /** Indica si el modo solo audio está activo */
  readonly esSoloAudio = computed(() => this._perfil() === 'solo-audio');

  /** Indica si el modo pictogramas está activo */
  readonly esPictogramas = computed(() => this._perfil() === 'pictogramas');

  /** Clase CSS del tema actual para aplicar al body */
  readonly clasesTema = computed(() => {
    const clases: string[] = [`idioma-${this._idioma()}`];
    if (this._perfil() !== 'estandar') clases.push(`perfil-${this._perfil()}`);
    if (this._tamanoFuente() !== 'normal') clases.push(`fuente-${this._tamanoFuente()}`);
    return clases.join(' ');
  });

  /** Etiqueta del idioma actual para mostrar en UI */
  readonly labelIdioma = computed(() => {
    const labels: Record<Idioma, string> = {
      es: 'Español',
      qu: 'Quechua',
      ay: 'Aymara',
    };
    return labels[this._idioma()];
  });

  /** Configuración de todas las categorías con colores según perfil */
  readonly categoriasConfig = computed(() => {
    const esContraste = this.esAltoContraste();
    return Object.values(CATEGORIAS_CONFIG).map((cat) => ({
      ...cat,
      colorActivo: esContraste ? cat.colorContraste : cat.color,
      label: this.getLabelCategoria(cat),
    }));
  });

  constructor() {
    // Efecto: persiste el estado en localStorage cada vez que cambia cualquier signal
    effect(() => {
      const estado: EstadoApp = {
        idioma: this._idioma(),
        perfil: this._perfil(),
        volumenAudio: this._volumen(),
        velocidadTTS: this._velocidadTTS(),
        tamanoFuente: this._tamanoFuente(),
      };
      this.guardarEstado(estado);
      this.aplicarClasesTema();
    });
  }

  // ── Mutadores públicos ─────────────────────────────────────────────────────

  setIdioma(idioma: Idioma): void {
    this._idioma.set(idioma);
  }

  setPerfil(perfil: PerfilAccesibilidad): void {
    this._perfil.set(perfil);
  }

  setVolumen(volumen: number): void {
    this._volumen.set(Math.max(0, Math.min(1, volumen)));
  }

  setVelocidadTTS(velocidad: number): void {
    this._velocidadTTS.set(Math.max(0.5, Math.min(2, velocidad)));
  }

  setTamanoFuente(tamano: EstadoApp['tamanoFuente']): void {
    this._tamanoFuente.set(tamano);
  }

  /** Cicla entre los tres idiomas disponibles */
  ciclarIdioma(): void {
    const ciclo: Idioma[] = ['es', 'qu', 'ay'];
    const actual = ciclo.indexOf(this._idioma());
    this._idioma.set(ciclo[(actual + 1) % ciclo.length]);
  }

  /** Obtiene el label de una categoría en el idioma actual */
  getLabelCategoriaById(id: Categoria): string {
    const cat = CATEGORIAS_CONFIG[id];
    return this.getLabelCategoria(cat);
  }

  /** Obtiene el color activo de una categoría según el perfil */
  getColorCategoria(id: Categoria): string {
    const cat = CATEGORIAS_CONFIG[id];
    return this.esAltoContraste() ? cat.colorContraste : cat.color;
  }

  // ── Helpers privados ───────────────────────────────────────────────────────

  private getLabelCategoria(cat: CategoriaConfig): string {
    const idioma = this._idioma();
    if (idioma === 'qu') return cat.labelQu;
    if (idioma === 'ay') return cat.labelAy;
    return cat.labelEs;
  }

  private cargarEstado(): EstadoApp {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...ESTADO_INICIAL, ...JSON.parse(raw) };
      }
    } catch {
      // Si hay error de parseo, usar estado inicial
    }
    return { ...ESTADO_INICIAL };
  }

  private guardarEstado(estado: EstadoApp): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch {
      // Silenciar errores de localStorage (modo privado, cuota llena, etc.)
    }
  }

  private aplicarClasesTema(): void {
    if (typeof document === 'undefined') return;
    const body = document.body;
    // Remover clases anteriores de tema
    body.className = body.className
      .split(' ')
      .filter((c) => !c.startsWith('idioma-') && !c.startsWith('perfil-') && !c.startsWith('fuente-'))
      .join(' ');
    // Agregar nuevas clases
    const nuevasClases = this.clasesTema();
    if (nuevasClases) {
      body.classList.add(...nuevasClases.split(' ').filter(Boolean));
    }
  }
}
