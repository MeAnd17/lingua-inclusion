import {
  Component, inject, signal, computed,
  AfterViewInit, OnDestroy, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { BienvenidaService } from '../../services/bienvenida.service';
import { TouchTargetDirective } from '../../directives/touch-target.directive';
import { Idioma } from '../../models/palabra.model';

/**
 * Pantalla inicial (no modal) que aparece ANTES de la app.
 * El usuario elige:
 *   1. Su idioma (ES / QU / AY)
 *   2. El tipo de tutorial (Voz | Escrito | Saltar)
 *
 * Solo se muestra una vez por sesión (persiste en localStorage).
 * Reemplaza el selector embebido dentro de BienvenidaComponent.
 */
@Component({
  selector: 'li-selector-inicial',
  standalone: true,
  imports: [CommonModule, TouchTargetDirective],
  template: `
    @if (visible()) {
      <!-- Pantalla completa sobre todo el contenido -->
      <div
        class="selector"
        role="dialog"
        aria-modal="true"
        aria-labelledby="selector-titulo"
        (keydown)="onKeydown($event)"
      >
        <!-- Encabezado -->
        <div class="selector__header" aria-hidden="true">
          <span class="selector__logo">🌐</span>
          <span class="selector__nombre">Lingua-Inclusion</span>
        </div>

        <!-- Título reactivo al idioma elegido -->
        <h1 id="selector-titulo" class="selector__titulo">
          {{ t().titulo }}
        </h1>
        <p class="selector__subtitulo">{{ t().subtitulo }}</p>

        <!-- ── Paso 1: Elige idioma ── -->
        <section class="selector__seccion" aria-labelledby="paso-idioma-label">
          <p id="paso-idioma-label" class="selector__paso-label">
            <span class="selector__paso-num" aria-hidden="true">1</span>
            {{ t().pasoIdioma }}
          </p>
          <div
            class="selector__idiomas"
            role="group"
            [attr.aria-label]="t().pasoIdioma"
          >
            <button
              #btnEs
              class="idioma-btn"
              [class.idioma-btn--activo]="idiomaElegido() === 'es'"
              (click)="elegirIdioma('es')"
              liTouchTarget
              aria-label="Español"
              [attr.aria-pressed]="idiomaElegido() === 'es'"
            >
              <span class="idioma-btn__flag" aria-hidden="true">🇵🇪</span>
              <span class="idioma-btn__codigo">ES</span>
              <span class="idioma-btn__nombre">Español</span>
            </button>

            <button
              #btnQu
              class="idioma-btn"
              [class.idioma-btn--activo]="idiomaElegido() === 'qu'"
              (click)="elegirIdioma('qu')"
              liTouchTarget
              aria-label="Runasimi"
              [attr.aria-pressed]="idiomaElegido() === 'qu'"
            >
              <span class="idioma-btn__flag" aria-hidden="true">🏔️</span>
              <span class="idioma-btn__codigo">QU</span>
              <span class="idioma-btn__nombre">Runasimi</span>
            </button>

            <button
              #btnAy
              class="idioma-btn"
              [class.idioma-btn--activo]="idiomaElegido() === 'ay'"
              (click)="elegirIdioma('ay')"
              liTouchTarget
              aria-label="Aymar aru"
              [attr.aria-pressed]="idiomaElegido() === 'ay'"
            >
              <span class="idioma-btn__flag" aria-hidden="true">🌄</span>
              <span class="idioma-btn__codigo">AY</span>
              <span class="idioma-btn__nombre">Aymar aru</span>
            </button>
          </div>
        </section>

        <!-- ── Paso 2: Elige tipo de tutorial ── -->
        <section class="selector__seccion" aria-labelledby="paso-tutorial-label">
          <p id="paso-tutorial-label" class="selector__paso-label">
            <span class="selector__paso-num" aria-hidden="true">2</span>
            {{ t().pasoTutorial }}
          </p>
          <div class="selector__opciones">

            <!-- Voz -->
            <button
              #btnVoz
              class="opcion-btn opcion-btn--voz"
              (click)="elegirVoz()"
              liTouchTarget
              [attr.aria-label]="t().btnVoz + '. ' + t().hintVoz"
            >
              <span class="opcion-btn__icono" aria-hidden="true">🔊</span>
              <span class="opcion-btn__label">{{ t().btnVoz }}</span>
              <span class="opcion-btn__hint">{{ t().hintVoz }}</span>
            </button>

            <!-- Escrito -->
            <button
              #btnEscrito
              class="opcion-btn opcion-btn--escrito"
              (click)="elegirEscrito()"
              liTouchTarget
              [attr.aria-label]="t().btnEscrito + '. ' + t().hintEscrito"
            >
              <span class="opcion-btn__icono" aria-hidden="true">📖</span>
              <span class="opcion-btn__label">{{ t().btnEscrito }}</span>
              <span class="opcion-btn__hint">{{ t().hintEscrito }}</span>
            </button>

          </div>
        </section>

        <!-- Saltar -->
        <button
          #btnSaltar
          class="selector__saltar"
          (click)="saltar()"
          liTouchTarget
          [attr.aria-label]="t().saltar"
        >
          {{ t().saltar }}
        </button>
      </div>
    }
  `,
  styleUrls: ['./selector-inicial.component.scss'],
})
export class SelectorInicialComponent implements AfterViewInit, OnDestroy {
  private readonly lang       = inject(LanguageService);
  private readonly bienvenida = inject(BienvenidaService);

  private static readonly STORAGE_KEY = 'lingua-selector-visto';

  /** Idioma seleccionado dentro de esta pantalla (empieza en el del servicio) */
  readonly idiomaElegido = signal<Idioma>(this.lang.idioma());

  /** Visible si nunca se ha completado */
  readonly visible = signal(!SelectorInicialComponent.yaVisto());

  private focusIdx = 0;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    // Observa el signal del servicio: cuando volverAlSelector() lo activa, reabre esta pantalla
    effect(() => {
      if (this.bienvenida.reabrirSelector()) {
        this.bienvenida.reabrirSelector.set(false);
        // Delay mínimo para que Angular procese el ciclo antes de mostrar
        setTimeout(() => this.mostrar(), 0);
      }
    }, { allowSignalWrites: true });
  }

  // ── Textos reactivos al idioma elegido (NO al del servicio) ─────────────────
  readonly t = computed(() => {
    const i = this.idiomaElegido();
    const map = {
      es: {
        titulo:      '¡Bienvenido!',
        subtitulo:   'Configura tu experiencia antes de comenzar.',
        pasoIdioma:  'Elige tu idioma',
        pasoTutorial:'¿Cómo quieres el tutorial?',
        btnVoz:      'Tutorial en voz',
        hintVoz:     'Para personas con baja visión',
        btnEscrito:  'Tutorial escrito',
        hintEscrito: 'Para personas sordas o en silencio',
        saltar:      'Saltar tutorial e ir a la app',
      },
      qu: {
        titulo:      '¡Hamuqtiyki!',
        subtitulo:   'Qallarinata allichay simita akllaspa.',
        pasoIdioma:  'Simita akllay',
        pasoTutorial:'¿Imaynatan yachachiy munankichu?',
        btnVoz:      'Uyariy yachachiy',
        hintVoz:     'Mana allin rikuqpaq',
        btnEscrito:  'Qillqasqa yachachiy',
        hintEscrito: 'Mana uyariqpaq',
        saltar:      'Yachachiy saqispa appiman riy',
      },
      ay: {
        titulo:      '¡Jutañataki!',
        subtitulo:   'Qalltaña nayraru simiña akllaspa allichaña.',
        pasoIdioma:  'Simiña akllaña',
        pasoTutorial:'¿Kunjamatisa yatichawi munañataki?',
        btnVoz:      'Uyaña yatichawi',
        hintVoz:     'Janiwa alwa uñt\'iri jaqitaki',
        btnEscrito:  'Qillqata yatichawi',
        hintEscrito: 'Janiwa uyiri jaqitaki',
        saltar:      'Yatichawi saqispa appiru saraña',
      },
    } as const;
    return map[i];
  });

  ngAfterViewInit(): void {
    if (!this.visible()) return;
    this.activar();
  }

  /** Muestra el selector y prepara el foco/scroll */
  mostrar(): void {
    SelectorInicialComponent.borrarVisto();
    this.idiomaElegido.set(this.lang.idioma());
    this.focusIdx = 0;
    this.visible.set(true);
    setTimeout(() => this.activar(), 50);
  }

  private activar(): void {
    document.body.style.overflow = 'hidden';
    // Esperar a que Angular renderice el @if antes de buscar el foco
    setTimeout(() => {
      const primerBtn = document.querySelector<HTMLElement>('.selector .idioma-btn');
      primerBtn?.focus();
    }, 100);
    if (!this.keyHandler) {
      this.keyHandler = (e) => this.onKeydown(e);
      document.addEventListener('keydown', this.keyHandler);
    }
  }

  ngOnDestroy(): void {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }
    document.body.style.overflow = '';
  }

  // ── Acciones ─────────────────────────────────────────────────────────────

  elegirIdioma(idioma: Idioma): void {
    this.idiomaElegido.set(idioma);
    this.lang.setIdioma(idioma);
  }

  elegirVoz(): void {
    this.confirmarYCerrar();
    // El servicio de bienvenida inicia el tutorial de voz
    this.bienvenida.elegirVoz();
  }

  elegirEscrito(): void {
    this.confirmarYCerrar();
    this.bienvenida.elegirEscrito();
  }

  saltar(): void {
    this.confirmarYCerrar();
  }

  // ── Internos ──────────────────────────────────────────────────────────────

  private confirmarYCerrar(): void {
    SelectorInicialComponent.marcarVisto();
    document.body.style.overflow = '';
    this.visible.set(false);
  }

  onKeydown(e: KeyboardEvent): void {
    if (!this.visible()) return;

    if (e.key === 'Escape') {
      this.saltar();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      // Buscar en el DOM los botones actuales (el @if puede haber reconstruido el DOM)
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>('.selector button')
      );
      if (focusables.length === 0) return;
      if (e.shiftKey) {
        this.focusIdx = (this.focusIdx + focusables.length - 1) % focusables.length;
      } else {
        this.focusIdx = (this.focusIdx + 1) % focusables.length;
      }
      focusables[this.focusIdx]?.focus();
    }
  }

  private static yaVisto(): boolean {
    try {
      return !!localStorage.getItem(SelectorInicialComponent.STORAGE_KEY);
    } catch {
      return false;
    }
  }

  private static marcarVisto(): void {
    try {
      localStorage.setItem(SelectorInicialComponent.STORAGE_KEY, '1');
    } catch { /* silent */ }
  }

  private static borrarVisto(): void {
    try {
      localStorage.removeItem(SelectorInicialComponent.STORAGE_KEY);
    } catch { /* silent */ }
  }
}
