import { Component, inject, computed, signal, effect, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BienvenidaService } from '../../services/bienvenida.service';
import { LanguageService } from '../../services/language.service';
import { TecladoNavService } from '../../services/teclado-nav.service';
import { TouchTargetDirective } from '../../directives/touch-target.directive';

@Component({
  selector: 'li-bienvenida',
  standalone: true,
  imports: [CommonModule, TouchTargetDirective],
  template: `
    <!-- ══ TUTORIAL ESCRITO (modal paso a paso) ══ -->
    @if (bienvenida.mostrandoEscrito()) {
      <div class="bv-overlay" aria-hidden="true"></div>
      <div
        class="bv-escrito"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'bv-paso-titulo-' + bienvenida.pasoEscritoActual()"
        (keydown)="onEscritoKeydown($event)"
      >
        <!-- Cabecera -->
        <div class="bv-escrito__header">
          <span class="bv-escrito__badge">
            {{ textos().tutorial }}
          </span>
          <button
            class="bv-escrito__cerrar"
            (click)="bienvenida.cerrarEscrito()"
            liTouchTarget
            [attr.aria-label]="textos().cerrar"
          >✕</button>
        </div>

        <!-- Indicador de progreso -->
        <div class="bv-escrito__progreso" role="progressbar"
             [attr.aria-valuenow]="bienvenida.pasoEscritoActual() + 1"
             [attr.aria-valuemax]="bienvenida.totalPasos"
             [attr.aria-label]="textos().paso + ' ' + (bienvenida.pasoEscritoActual() + 1) + ' ' + textos().de + ' ' + bienvenida.totalPasos">
          @for (p of pasosArray(); track $index) {
            <div
              class="bv-progreso-punto"
              [class.bv-progreso-punto--activo]="$index === bienvenida.pasoEscritoActual()"
              [class.bv-progreso-punto--hecho]="$index < bienvenida.pasoEscritoActual()"
              aria-hidden="true"
            ></div>
          }
        </div>

        <!-- Contenido del paso actual -->
        @if (pasoActual(); as paso) {
          <div class="bv-escrito__paso" aria-live="polite">
            <div class="bv-escrito__icono" aria-hidden="true">{{ paso.icono }}</div>
            <h3
              class="bv-escrito__titulo"
              [id]="'bv-paso-titulo-' + bienvenida.pasoEscritoActual()"
            >{{ paso.titulo }}</h3>
            <p class="bv-escrito__texto">{{ paso.texto }}</p>
          </div>
        }

        <!-- Navegación -->
        <div class="bv-escrito__nav">
          <button
            class="bv-escrito__btn-nav bv-escrito__btn-nav--anterior"
            (click)="bienvenida.anteriorPasoEscrito()"
            [disabled]="bienvenida.pasoEscritoActual() === 0"
            liTouchTarget
            [attr.aria-label]="textos().anterior"
          >
            ← {{ textos().anterior }}
          </button>

          <span class="bv-escrito__contador" aria-hidden="true">
            {{ bienvenida.pasoEscritoActual() + 1 }} / {{ bienvenida.totalPasos }}
          </span>

          <button
            #btnSiguiente
            class="bv-escrito__btn-nav bv-escrito__btn-nav--siguiente"
            (click)="bienvenida.siguientePasoEscrito()"
            liTouchTarget
            [attr.aria-label]="esUltimoPaso() ? textos().finalizar : textos().siguiente"
          >
            {{ esUltimoPaso() ? textos().finalizar : textos().siguiente }} →
          </button>
        </div>

        <!-- Hint de teclado -->
        <p class="bv-escrito__hint-teclado" aria-hidden="true">
          ← → {{ textos().hintTeclado }}
        </p>
      </div>
    }

    <!-- ══ BANNER DE VOZ (mientras habla) ══ -->
    @if (bienvenida.reproduciendo()) {
      <div
        class="bienvenida-banner"
        role="status"
        aria-live="polite"
        [attr.aria-label]="'Tutorial de bienvenida en curso: ' + textoActual()"
      >
        <div class="bienvenida-banner__contenido">
          <div class="bienvenida-banner__header">
            <span class="bienvenida-banner__titulo">
              <span aria-hidden="true">🎓</span>
              {{ textos().tutorialVoz }}
            </span>
            <button
              class="bienvenida-banner__detener"
              (click)="bienvenida.detener()"
              liTouchTarget
              [attr.aria-label]="textos().detener"
            >
              ⏹ {{ textos().detener }}
            </button>
          </div>

          <div class="bienvenida-banner__idioma">
            <span class="bienvenida-banner__onda" aria-hidden="true">
              @for (b of [1,2,3,4,5]; track b) {
                <span class="onda-barra" [style.animation-delay]="(b * 0.1) + 's'"></span>
              }
            </span>
            <span class="bienvenida-banner__flag" aria-hidden="true">{{ flagActual() }}</span>
            <span class="bienvenida-banner__texto">{{ textoActual() }}</span>
          </div>

          <div class="bienvenida-banner__progreso" aria-hidden="true">
            @for (paso of pasosBanner; track paso.codigo) {
              <div
                class="progreso-paso"
                [class.progreso-paso--activo]="bienvenida.idiomaActual() === paso.codigo"
                [class.progreso-paso--hecho]="estaHecho(paso.codigo)"
              >
                <span class="progreso-paso__flag">{{ paso.flag }}</span>
                <span class="progreso-paso__label">{{ paso.label }}</span>
              </div>
              @if (!$last) {
                <span class="progreso-flecha">→</span>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./bienvenida.component.scss'],
})
export class BienvenidaComponent implements AfterViewInit, OnDestroy {
  readonly bienvenida  = inject(BienvenidaService);
  readonly langService = inject(LanguageService);
  private readonly tecladoNav = inject(TecladoNavService);

  readonly pasosBanner = [
    { codigo: 'es' as const, flag: '🇵🇪', label: 'Español' },
    { codigo: 'qu' as const, flag: '🏔️', label: 'Quechua' },
    { codigo: 'ay' as const, flag: '🌄', label: 'Aymara'  },
  ];

  private readonly orden = ['es', 'qu', 'ay'];
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    // Cuando el tutorial escrito aparece: bloquear scroll y activar focus trap
    effect(() => {
      if (this.bienvenida.mostrandoEscrito()) {
        this.tecladoNav.modalAbierto.set(true);
        document.body.style.overflow = 'hidden';
        this.activarFocusTrap();
      } else {
        this.desactivarFocusTrap();
        if (!this.bienvenida.reproduciendo()) {
          this.tecladoNav.modalAbierto.set(false);
          document.body.style.overflow = '';
        }
      }
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.desactivarFocusTrap();
  }

  // ── Focus trap ─────────────────────────────────────────────────────────────

  private activarFocusTrap(): void {
    if (this.keyHandler) return;
    setTimeout(() => {
      // Foco inicial en el botón cerrar
      const primerFoco = document.querySelector<HTMLElement>('.bv-escrito .bv-escrito__cerrar');
      primerFoco?.focus();
    }, 100);

    this.keyHandler = (e: KeyboardEvent) => this.manejarTeclasTrap(e);
    document.addEventListener('keydown', this.keyHandler);
  }

  private desactivarFocusTrap(): void {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }

  private manejarTeclasTrap(e: KeyboardEvent): void {
    if (!this.bienvenida.mostrandoEscrito()) return;

    if (e.key === 'Escape') {
      this.bienvenida.cerrarEscrito();
      return;
    }

    if (e.key === 'Tab') {
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.bv-escrito button:not([disabled])'
        )
      ).filter(el => el.offsetParent !== null);

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last  = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  // ── Tutorial escrito ───────────────────────────────────────────────────────

  onEscritoKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.bienvenida.siguientePasoEscrito();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.bienvenida.anteriorPasoEscrito();
    }
    // Escape y Tab son manejados por el focus trap global
  }

  readonly pasoActual = computed(() => {
    const pasos = this.bienvenida.pasosActuales;
    return pasos[this.bienvenida.pasoEscritoActual()] ?? null;
  });

  readonly pasosArray = computed(() =>
    Array.from({ length: this.bienvenida.totalPasos })
  );

  readonly esUltimoPaso = computed(() =>
    this.bienvenida.pasoEscritoActual() === this.bienvenida.totalPasos - 1
  );

  estaHecho(codigo: string): boolean {
    const actual = this.bienvenida.idiomaActual();
    if (!actual) return false;
    return this.orden.indexOf(codigo) < this.orden.indexOf(actual);
  }

  readonly flagActual = computed(() => {
    const flags: Record<string, string> = { es: '🇵🇪', qu: '🏔️', ay: '🌄' };
    return flags[this.bienvenida.idiomaActual() ?? 'es'] ?? '🌐';
  });

  readonly textoActual = computed(() => {
    const textos: Record<string, string> = {
      es: 'Hablando en Español...',
      qu: 'Quechua simipi rimachkani...',
      ay: 'Aymara simiru armt\'añataki...',
    };
    return textos[this.bienvenida.idiomaActual() ?? 'es'] ?? 'Iniciando...';
  });

  readonly textos = computed(() => {
    const i = this.langService.idioma();
    return {
      es: {
        tituloSelector:  '¿Cómo quieres el tutorial?',
        descSelector:    'Usa las flechas para moverte entre opciones y Enter para elegir.',
        elegirIdioma:    'Primero elige tu idioma:',
        btnVoz:          'Tutorial en voz',
        hintVoz:         'Para personas con baja visión',
        btnEscrito:      'Tutorial escrito',
        hintEscrito:     'Para personas sordas o en silencio',
        saltar:          'Saltar tutorial',
        tutorial:        'Tutorial',
        tutorialVoz:     'Tutorial de bienvenida',
        cerrar:          'Cerrar tutorial',
        paso:            'Paso',
        de:              'de',
        anterior:        'Anterior',
        siguiente:       'Siguiente',
        finalizar:       'Finalizar',
        hintTeclado:     'para navegar entre pasos',
        detener:         'Detener',
      },
      qu: {
        tituloSelector:  '¿Imaynatan tutorialita munankichu?',
        descSelector:    'Flecha teclakunawan puriykuy, Enterwan akllakuy.',
        elegirIdioma:    'Ñawpaq simita akllay:',
        btnVoz:          'Uyariy tutorial',
        hintVoz:         'Mana allin rikuqpaq',
        btnEscrito:      'Qillqasqa tutorial',
        hintEscrito:     'Mana uyariqpaq',
        saltar:          'Tutorialita saqiy',
        tutorial:        'Tutorial',
        tutorialVoz:     'Qallariy yachachiy',
        cerrar:          'Wichʼuy',
        paso:            'Paso',
        de:              'manta',
        anterior:        'Ñawpaq',
        siguiente:       'Qhepa',
        finalizar:       'Tukuy',
        hintTeclado:     'pasokunata purinapaq',
        detener:         'Saqiy',
      },
      ay: {
        tituloSelector:  '¿Kunjamatisa tutorial munañataki?',
        descSelector:    'Flecha teclanakampi puriña, Entermpi akllaña.',
        elegirIdioma:    'Nayraru simiña akllaña:',
        btnVoz:          'Uyaña tutorial',
        hintVoz:         'Janiwa alwa uñt\'iri jaqitaki',
        btnEscrito:      'Qillqata tutorial',
        hintEscrito:     'Janiwa uyiri jaqitaki',
        saltar:          'Tutorial saqiña',
        tutorial:        'Tutorial',
        tutorialVoz:     'Qalltaña yatichawi',
        cerrar:          'Wichʼuña',
        paso:            'Paso',
        de:              'manta',
        anterior:        'Nayraru',
        siguiente:       'Qhipa',
        finalizar:       'Tukuña',
        hintTeclado:     'pasonakata puriñataki',
        detener:         'Saqiña',
      },
    }[i];
  });
}
