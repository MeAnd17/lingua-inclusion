import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Palabra, CATEGORIAS_CONFIG } from '../../models/palabra.model';
import { LanguageService } from '../../services/language.service';
import { AudioService } from '../../services/audio.service';
import { AnunciadorService } from '../../services/anunciador.service';
import { TecladoNavService } from '../../services/teclado-nav.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';
import { AriaDinamicoDirective } from '../../directives/aria-dinamico.directive';
import { TouchTargetDirective } from '../../directives/touch-target.directive';
import { AnunciarFocoDirective } from '../../directives/anunciar-foco.directive';

@Component({
  selector: 'li-tarjeta-palabra',
  standalone: true,
  imports: [CommonModule, TraducirPipe, AriaDinamicoDirective, TouchTargetDirective, AnunciarFocoDirective],
  template: `
    <article
      class="tarjeta"
      [class.tarjeta--expandida]="expandida()"
      [class.tarjeta--alto-contraste]="langService.esAltoContraste()"
      [style.--color-categoria]="colorCategoria()"
      [attr.aria-label]="'Palabra: ' + (palabra | traducir: 'termino')"
    >
      <!-- Cabecera coloreada por categoría -->
      <div class="tarjeta__cabecera" [style.background]="colorCategoria()">
        <span class="tarjeta__categoria-icono" aria-hidden="true">
          {{ categoriaConfig().icono }}
        </span>
        <span class="tarjeta__categoria-label">
          {{ langService.getLabelCategoriaById(palabra.categoria) }}
        </span>
        <span class="tarjeta__nivel" [attr.aria-label]="'Nivel ' + palabra.nivelDificultad">
          @for (n of [1,2,3]; track n) {
            <span
              class="nivel-punto"
              [class.nivel-punto--activo]="n <= palabra.nivelDificultad"
              aria-hidden="true"
            ></span>
          }
        </span>
      </div>

      <!-- Cuerpo principal -->
      <div class="tarjeta__cuerpo">
        <!-- Pictograma (modo pictogramas) -->
        @if (langService.esPictogramas()) {
          <div class="tarjeta__pictograma" [attr.aria-label]="palabra | traducir: 'termino'">
            {{ palabra.multimedia.emoji }}
          </div>
        }

        <!-- Término principal -->
        <h3 class="tarjeta__termino">
          {{ palabra | traducir: 'termino' }}
        </h3>

        <!-- Pronunciación -->
        @if (palabra | traducir: 'pronunciacion') {
          <p class="tarjeta__pronunciacion" aria-label="Pronunciación">
            /{{ palabra | traducir: 'pronunciacion' }}/
          </p>
        }

        <!-- Definición (oculta en modo solo-audio) -->
        @if (!langService.esSoloAudio()) {
          <p class="tarjeta__definicion">
            {{ palabra | traducir: 'definicion' }}
          </p>
        }

        <!-- Traducciones en otros idiomas (al expandir) -->
        @if (expandida()) {
          <div class="tarjeta__traducciones" role="list" aria-label="Traducciones">
            @for (idioma of otrosIdiomas(); track idioma.codigo) {
              <div class="traduccion-item" role="listitem">
                <span class="traduccion-item__bandera" aria-hidden="true">{{ idioma.bandera }}</span>
                <span class="traduccion-item__codigo">{{ idioma.nombre }}:</span>
                <span class="traduccion-item__termino">{{ palabra[idioma.codigo].termino }}</span>
              </div>
            }
          </div>

          <!-- Ejemplo de uso -->
          @if (palabra | traducir: 'ejemploUso') {
            <div class="tarjeta__ejemplo">
              <span class="tarjeta__ejemplo-label">{{ textos().ejemplo }}:</span>
              <em>{{ palabra | traducir: 'ejemploUso' }}</em>
            </div>
          }
        }
      </div>

      <!-- Controles de acción -->
      <div class="tarjeta__acciones" role="group" [attr.aria-label]="'Acciones para ' + (palabra | traducir: 'termino')">

        <!-- Botón de audio -->
        <button
          class="btn-accion btn-accion--audio"
          (click)="reproducirAudio()"
          liTouchTarget
          [liAriaLabel]="textos().escuchar + ' ' + (palabra | traducir: 'termino')"
          [liAnunciarFoco]="textos().escuchar + ' ' + (palabra | traducir: 'termino')"
          [class.btn-accion--activo]="audioService.palabraActual() === (palabra | traducir: 'termino')"
        >
          <span aria-hidden="true">
            {{ audioService.palabraActual() === (palabra | traducir: 'termino') ? '⏸️' : '🔊' }}
          </span>
          <span class="btn-accion__texto">{{ textos().audio }}</span>
        </button>

        <!-- Botón expandir -->
        <button
          class="btn-accion btn-accion--expandir"
          (click)="toggleExpandir()"
          liTouchTarget
          [liAriaLabel]="expandida() ? textos().menos : textos().mas"
          [ariaExpanded]="expandida()"
        >
          <span aria-hidden="true">{{ expandida() ? '▲' : '▼' }}</span>
          <span class="btn-accion__texto">{{ expandida() ? textos().menos : textos().mas }}</span>
        </button>
      </div>
    </article>
  `,
  styleUrls: ['./tarjeta-palabra.component.scss'],
})
export class TarjetaPalabraComponent {
  @Input({ required: true }) palabra!: Palabra;

  readonly langService   = inject(LanguageService);
  readonly audioService  = inject(AudioService);
  private readonly anunciador  = inject(AnunciadorService);
  private readonly tecladoNav  = inject(TecladoNavService);

  readonly expandida = signal(false);

  readonly categoriaConfig = computed(() => CATEGORIAS_CONFIG[this.palabra.categoria]);

  readonly colorCategoria = computed(() =>
    this.langService.getColorCategoria(this.palabra.categoria)
  );

  readonly otrosIdiomas = computed(() => {
    const actual = this.langService.idioma();
    const todos = [
      { codigo: 'es' as const, nombres: { es: 'Español', qu: 'Español',  ay: 'Español'  }, bandera: '🇵🇪' },
      { codigo: 'qu' as const, nombres: { es: 'Quechua', qu: 'Qhichwa',  ay: 'Qhichwa'  }, bandera: '🏔️' },
      { codigo: 'ay' as const, nombres: { es: 'Aymara',  qu: 'Aymara',   ay: 'Aymara'   }, bandera: '🌄' },
    ];
    return todos
      .filter((i) => i.codigo !== actual)
      .map((i) => ({ ...i, nombre: i.nombres[actual] }));
  });

  /** Textos de los botones según el idioma activo */
  readonly textos = computed(() => {
    const i = this.langService.idioma();
    return {
      es: { audio: 'Audio', escuchar: 'Escuchar', mas: 'Más',   menos: 'Menos',    ejemplo: 'Ejemplo'    },
      qu: { audio: 'Uyariy', escuchar: 'Uyariy',  mas: 'Aswan', menos: 'Pisiyay',  ejemplo: 'Rimasqa'    },
      ay: { audio: 'Uyaña',  escuchar: 'Uyaña',   mas: 'Aswa',  menos: 'Pisiyaña', ejemplo: 'Yatiyaña'   },
    }[i];
  });

  reproducirAudio(): void {
    const terminoActual = this.palabra[this.langService.idioma()].termino;
    if (this.audioService.palabraActual() === terminoActual) {
      this.audioService.togglePausa();
    } else {
      this.audioService.reproducirPalabra(this.palabra);
    }
  }

  toggleExpandir(): void {
    this.expandida.update((v) => !v);

    // En modo teclado, al expandir anunciar toda la info de la tarjeta
    if (this.expandida() && this.tecladoNav.modoTeclado()) {
      setTimeout(() => this.anunciarInfoCompleta(), 150);
    }
  }

  private anunciarInfoCompleta(): void {
    const idioma = this.langService.idioma();
    const p = this.palabra[idioma];
    const otros = this.otrosIdiomas();

    const partes: string[] = [];

    // Término + pronunciación
    partes.push(p.termino);
    if (p.pronunciacion) partes.push(p.pronunciacion);

    // Definición
    if (p.definicion) partes.push(p.definicion);

    // Traducciones en otros idiomas
    otros.forEach(({ nombre, codigo }) => {
      partes.push(`${nombre}: ${this.palabra[codigo].termino}`);
    });

    // Ejemplo de uso
    if (p.ejemploUso) partes.push(p.ejemploUso);

    this.anunciador.anunciar(partes.join('. '));
  }
}
