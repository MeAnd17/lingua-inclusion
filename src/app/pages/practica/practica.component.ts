import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PracticaService, ResultadoRespuesta } from '../../services/practica.service';
import { LanguageService } from '../../services/language.service';
import { AudioService } from '../../services/audio.service';
import { AnunciadorService } from '../../services/anunciador.service';
import { AnunciarFocoDirective } from '../../directives/anunciar-foco.directive';
import { TouchTargetDirective } from '../../directives/touch-target.directive';
import { CATEGORIAS_CONFIG, Categoria } from '../../models/palabra.model';
import { TraducirPipe } from '../../pipes/traducir.pipe';

import { TutorialComponent } from '../../components/tutorial/tutorial.component';

@Component({
  selector: 'li-practica',
  standalone: true,
  imports: [CommonModule, RouterLink, TraducirPipe, AnunciarFocoDirective, TouchTargetDirective, TutorialComponent],
  template: `
    <main id="contenido-principal" class="practica-page">

      <!-- ══ PANTALLA DE INICIO ══ -->
      @if (juego.estado() === 'inicio') {
        <div class="pantalla pantalla--inicio fade-in-up">
          <div class="inicio-hero">
            <span class="inicio-hero__emoji" aria-hidden="true">🎮</span>
            <h1 class="inicio-hero__titulo">{{ t().tituloJuego }}</h1>
            <p class="inicio-hero__desc">{{ t().descJuego }}</p>
          </div>

          <!-- Selector de categoría -->
          <div class="categoria-selector" role="group" [attr.aria-label]="t().elegirCategoria">
            <h2 class="categoria-selector__titulo">{{ t().elegirCategoria }}</h2>
            <div class="categoria-selector__grid">
              <button
                class="cat-btn"
                [class.cat-btn--activo]="juego.categoriaFiltro() === null"
                (click)="juego.categoriaFiltro.set(null)"
                liTouchTarget
                [liAnunciarFoco]="t().todasCategorias"
              >
                <span aria-hidden="true">🌐</span>
                <span>{{ t().todasCategorias }}</span>
              </button>
              @for (cat of categorias; track cat.id) {
                <button
                  class="cat-btn"
                  [class.cat-btn--activo]="juego.categoriaFiltro() === cat.id"
                  [style.--color-cat]="langService.getColorCategoria(cat.id)"
                  (click)="juego.categoriaFiltro.set(cat.id)"
                  liTouchTarget
                  [liAnunciarFoco]="langService.getLabelCategoriaById(cat.id)"
                >
                  <span aria-hidden="true">{{ cat.icono }}</span>
                  <span>{{ langService.getLabelCategoriaById(cat.id) }}</span>
                </button>
              }
            </div>
          </div>

          <button
            class="btn-empezar"
            (click)="empezar()"
            liTouchTarget
            [liAnunciarFoco]="t().empezar"
          >
            <span aria-hidden="true">▶️</span> {{ t().empezar }}
          </button>
        </div>
      }

      <!-- ══ PANTALLA DE JUEGO ══ -->
      @if (juego.estado() === 'jugando' || juego.estado() === 'respondida') {
        <div class="pantalla pantalla--juego">

          <!-- Barra de progreso y stats -->
          <div class="juego-header">
            <div class="juego-stats">
              <div class="stat-chip stat-chip--puntos" [attr.aria-label]="t().puntos + ': ' + juego.estadisticas().puntuacion">
                <span aria-hidden="true">⭐</span>
                <strong>{{ juego.estadisticas().puntuacion }}</strong>
              </div>
              <div class="stat-chip stat-chip--racha" [attr.aria-label]="t().racha + ': ' + juego.estadisticas().racha"
                   [class.stat-chip--racha-activa]="juego.estadisticas().racha >= 3">
                <span aria-hidden="true">🔥</span>
                <strong>{{ juego.estadisticas().racha }}</strong>
              </div>
              <div class="stat-chip" [attr.aria-label]="t().correctas + ': ' + juego.estadisticas().correctas">
                <span aria-hidden="true">✅</span>
                <strong>{{ juego.estadisticas().correctas }}</strong>
              </div>
            </div>

            <div class="progreso-wrapper" role="progressbar"
                 [attr.aria-valuenow]="juego.numeroPregunta() + 1"
                 [attr.aria-valuemax]="juego.totalPreguntas"
                 [attr.aria-label]="t().pregunta + ' ' + (juego.numeroPregunta() + 1) + ' ' + t().de + ' ' + juego.totalPreguntas">
              <div class="progreso-barra">
                <div class="progreso-fill" [style.width.%]="juego.progreso()"></div>
              </div>
              <span class="progreso-texto">{{ juego.numeroPregunta() + 1 }}/{{ juego.totalPreguntas }}</span>
            </div>
          </div>

          <!-- Tarjeta de pregunta -->
          @if (juego.preguntaActual(); as pregunta) {
            <div class="pregunta-card fade-in-up" role="region" [attr.aria-label]="t().pregunta">

              <!-- Tipo de pregunta -->
              <div class="pregunta-tipo">
                <span aria-hidden="true">{{ iconoTipo(pregunta.tipo) }}</span>
                {{ labelTipo(pregunta.tipo) }}
              </div>

              <!-- Estímulo (lo que se muestra) -->
              <div class="pregunta-estimulo" aria-live="polite">
                @switch (pregunta.tipo) {
                  @case ('termino-a-definicion') {
                    <div class="estimulo-termino">
                      <span class="estimulo-emoji" aria-hidden="true">{{ pregunta.palabra.multimedia.emoji }}</span>
                      <h2 class="estimulo-texto">{{ pregunta.palabra | traducir: 'termino' }}</h2>
                      <p class="estimulo-pronunciacion">/{{ pregunta.palabra | traducir: 'pronunciacion' }}/</p>
                      <button class="btn-audio-pregunta" (click)="reproducirPregunta()"
                              liTouchTarget [liAnunciarFoco]="t().escuchar">
                        🔊
                      </button>
                    </div>
                  }
                  @case ('definicion-a-termino') {
                    <div class="estimulo-definicion">
                      <span class="estimulo-icono-tipo" aria-hidden="true">💬</span>
                      <p class="estimulo-texto estimulo-texto--definicion">
                        {{ pregunta.palabra | traducir: 'definicion' }}
                      </p>
                    </div>
                  }
                  @case ('pictograma-a-termino') {
                    <div class="estimulo-pictograma">
                      <span class="estimulo-emoji estimulo-emoji--grande" aria-hidden="true">
                        {{ pregunta.palabra.multimedia.emoji }}
                      </span>
                      <p class="estimulo-hint">{{ t().queEsEsto }}</p>
                    </div>
                  }
                }
              </div>

              <!-- Opciones de respuesta -->
              <div class="opciones-grid" role="group" [attr.aria-label]="t().elige">
                @for (opcion of pregunta.opciones; track opcion.id; let i = $index) {
                  <button
                    class="opcion-btn"
                    [class.opcion-btn--correcta]="juego.estado() === 'respondida' && i === pregunta.indicePalabra"
                    [class.opcion-btn--incorrecta]="juego.estado() === 'respondida' && juego.opcionSeleccionada() === i && i !== pregunta.indicePalabra"
                    [class.opcion-btn--seleccionada]="juego.opcionSeleccionada() === i"
                    [class.opcion-btn--deshabilitada]="juego.estado() === 'respondida'"
                    [disabled]="juego.estado() === 'respondida'"
                    (click)="responder(i)"
                    liTouchTarget
                    [liAnunciarFoco]="getTextoOpcion(opcion, pregunta.tipo)"
                    [attr.aria-label]="getTextoOpcion(opcion, pregunta.tipo)"
                    [attr.aria-pressed]="juego.opcionSeleccionada() === i"
                  >
                    <span class="opcion-letra" aria-hidden="true">{{ letras[i] }}</span>
                    <span class="opcion-emoji" aria-hidden="true">{{ opcion.multimedia.emoji }}</span>
                    <span class="opcion-texto">{{ getTextoOpcion(opcion, pregunta.tipo) }}</span>
                    @if (juego.estado() === 'respondida') {
                      <span class="opcion-icono-resultado" aria-hidden="true">
                        {{ i === pregunta.indicePalabra ? '✅' : (juego.opcionSeleccionada() === i ? '❌' : '') }}
                      </span>
                    }
                  </button>
                }
              </div>
            </div>

            <!-- Feedback tras responder -->
            @if (juego.estado() === 'respondida') {
              <div class="feedback-panel"
                   [class.feedback-panel--correcto]="ultimoResultado()?.correcta"
                   [class.feedback-panel--incorrecto]="!ultimoResultado()?.correcta"
                   role="alert" aria-live="assertive">
                <div class="feedback-contenido">
                  <span class="feedback-emoji" aria-hidden="true">
                    {{ ultimoResultado()?.correcta ? '🎉' : '💪' }}
                  </span>
                  <div>
                    <p class="feedback-titulo">
                      {{ ultimoResultado()?.correcta ? t().correcto : t().incorrecto }}
                    </p>
                    @if (!ultimoResultado()?.correcta) {
                      <p class="feedback-respuesta-correcta">
                        {{ t().respuestaCorrecta }}: <strong>{{ pregunta.palabra | traducir: 'termino' }}</strong>
                      </p>
                    }
                    @if (juego.estadisticas().racha >= 3) {
                      <p class="feedback-racha">🔥 {{ t().racha }}: {{ juego.estadisticas().racha }}</p>
                    }
                  </div>
                </div>
                <button
                  class="btn-siguiente"
                  (click)="siguiente()"
                  liTouchTarget
                  [liAnunciarFoco]="juego.esUltimaPregunta() ? t().verResultados : t().siguiente"
                >
                  {{ juego.esUltimaPregunta() ? t().verResultados : t().siguiente }} →
                </button>
              </div>
            }
          }
        </div>
      }

      <!-- ══ PANTALLA DE RESULTADOS ══ -->
      @if (juego.estado() === 'fin') {
        <div class="pantalla pantalla--fin fade-in-up">
          <div class="resultado-hero">
            <span class="resultado-emoji" aria-hidden="true">{{ emojiRendimiento() }}</span>
            <h1 class="resultado-titulo">{{ t().resultados }}</h1>
            <p class="resultado-nivel">{{ labelRendimiento() }}</p>
          </div>

          <div class="resultado-stats" role="list">
            <div class="resultado-stat" role="listitem">
              <span class="resultado-stat__valor">{{ juego.estadisticas().puntuacion }}</span>
              <span class="resultado-stat__label">{{ t().puntos }}</span>
            </div>
            <div class="resultado-stat" role="listitem">
              <span class="resultado-stat__valor">{{ juego.estadisticas().correctas }}/{{ juego.totalPreguntas }}</span>
              <span class="resultado-stat__label">{{ t().correctas }}</span>
            </div>
            <div class="resultado-stat" role="listitem">
              <span class="resultado-stat__valor">{{ juego.estadisticas().rachaMaxima }}</span>
              <span class="resultado-stat__label">{{ t().rachaMaxima }}</span>
            </div>
            <div class="resultado-stat" role="listitem">
              <span class="resultado-stat__valor">{{ tiempoPromedio() }}s</span>
              <span class="resultado-stat__label">{{ t().tiempoPromedio }}</span>
            </div>
          </div>

          <!-- Barra de porcentaje -->
          <div class="resultado-porcentaje" role="img"
               [attr.aria-label]="porcentaje() + '% de respuestas correctas'">
            <div class="porcentaje-barra">
              <div class="porcentaje-fill"
                   [style.width.%]="porcentaje()"
                   [style.background]="colorPorcentaje()">
              </div>
            </div>
            <span class="porcentaje-texto">{{ porcentaje() }}%</span>
          </div>

          <div class="resultado-acciones">
            <button class="btn-reintentar" (click)="juego.iniciarPartida(juego.categoriaFiltro())"
                    liTouchTarget [liAnunciarFoco]="t().jugarDeNuevo">
              🔄 {{ t().jugarDeNuevo }}
            </button>
            <button class="btn-cambiar" (click)="juego.reiniciar()"
                    liTouchTarget [liAnunciarFoco]="t().cambiarCategoria">
              📂 {{ t().cambiarCategoria }}
            </button>
            <a routerLink="/" class="btn-inicio"
               liTouchTarget [liAnunciarFoco]="t().irInicio">
              🏠 {{ t().irInicio }}
            </a>
          </div>
        </div>
      }

    </main>

    <!-- Tutorial flotante -->
    <li-tutorial seccion="practica" />
  `,
  styleUrls: ['./practica.component.scss'],
})
export class PracticaComponent {
  readonly juego = inject(PracticaService);
  readonly langService = inject(LanguageService);
  readonly audioService = inject(AudioService);
  readonly anunciador = inject(AnunciadorService);

  readonly categorias = Object.values(CATEGORIAS_CONFIG);
  readonly letras = ['A', 'B', 'C', 'D'];

  readonly ultimoResultado = signal<ResultadoRespuesta | null>(null);

  readonly porcentaje = computed(() => {
    const s = this.juego.estadisticas();
    const total = s.correctas + s.incorrectas;
    return total === 0 ? 0 : Math.round((s.correctas / total) * 100);
  });

  readonly tiempoPromedio = computed(() => {
    const s = this.juego.estadisticas();
    const total = s.correctas + s.incorrectas;
    return total === 0 ? 0 : Math.round(s.tiempoTotal / total / 1000);
  });

  // ── Textos multilingüe ─────────────────────────────────────────────────────
  readonly t = computed(() => {
    const i = this.langService.idioma();
    const textos = {
      es: {
        tituloJuego: 'Modo Práctica',
        descJuego: 'Pon a prueba tu conocimiento de palabras en los 3 idiomas',
        elegirCategoria: 'Elige una categoría',
        todasCategorias: 'Todas',
        empezar: 'Empezar juego',
        pregunta: 'Pregunta',
        de: 'de',
        elige: 'Elige la respuesta correcta',
        queEsEsto: '¿Qué es esto?',
        escuchar: 'Escuchar palabra',
        correcto: '¡Correcto!',
        incorrecto: 'Casi...',
        respuestaCorrecta: 'La respuesta correcta es',
        siguiente: 'Siguiente',
        verResultados: 'Ver resultados',
        resultados: 'Resultados',
        puntos: 'Puntos',
        correctas: 'Correctas',
        racha: 'Racha',
        rachaMaxima: 'Racha máxima',
        tiempoPromedio: 'Seg. promedio',
        jugarDeNuevo: 'Jugar de nuevo',
        cambiarCategoria: 'Cambiar categoría',
        irInicio: 'Ir al inicio',
        nivelExcelente: '¡Excelente! Eres un experto 🏆',
        nivelBien: '¡Muy bien! Sigue practicando 👍',
        nivelRegular: 'Buen intento, practica más 📚',
        nivelPracticar: 'Sigue intentándolo, tú puedes 💪',
        tipoTerminoDefinicion: 'Elige la definición',
        tipoDefinicionTermino: 'Elige la palabra',
        tipoPictogramaTermino: 'Elige la palabra',
      },
      qu: {
        tituloJuego: 'Yachay Pukllay',
        descJuego: 'Simikunata yachakuyta pruebay kimsa simipi',
        elegirCategoria: 'Huk runayta akllay',
        todasCategorias: 'Llapan',
        empezar: 'Pukllata qallariy',
        pregunta: 'Tapuy',
        de: 'manta',
        elige: 'Allin kutichita akllay',
        queEsEsto: '¿Imatan kay?',
        escuchar: 'Simita uyariy',
        correcto: '¡Allinmi!',
        incorrecto: 'Mana allinchu...',
        respuestaCorrecta: 'Allin kutichi',
        siguiente: 'Qhepa',
        verResultados: 'Resultadota qhaway',
        resultados: 'Resultadokuna',
        puntos: 'Puntokuna',
        correctas: 'Allin',
        racha: 'Racha',
        rachaMaxima: 'Hatun racha',
        tiempoPromedio: 'Seg. chawpi',
        jugarDeNuevo: 'Watiq pukllay',
        cambiarCategoria: 'Runayta tikray',
        irInicio: 'Qallariman',
        nivelExcelente: '¡Allinmi! Yachaqmi kanki 🏆',
        nivelBien: '¡Allinmi! Yachakuyta katiy 👍',
        nivelRegular: 'Allin ruwasqayki, aswan yachakuy 📚',
        nivelPracticar: 'Katiy, atinkim 💪',
        tipoTerminoDefinicion: 'Explicacionta akllay',
        tipoDefinicionTermino: 'Simita akllay',
        tipoPictogramaTermino: 'Simita akllay',
      },
      ay: {
        tituloJuego: 'Yatiqaña Pukaraña',
        descJuego: 'Siminaka yatiqañataki pruebañataki kimsa simiru',
        elegirCategoria: 'Huk runaña akllaña',
        todasCategorias: 'Taqini',
        empezar: 'Pukaraña qalltaña',
        pregunta: 'Tapuña',
        de: 'manta',
        elige: 'Alwa kutichaña akllaña',
        queEsEsto: '¿Kunasa kay?',
        escuchar: 'Simiña uyaña',
        correcto: '¡Alwawa!',
        incorrecto: 'Janiwa...',
        respuestaCorrecta: 'Alwa kutichaña',
        siguiente: 'Qhipa',
        verResultados: 'Resultadona uñt\'aña',
        resultados: 'Resultadonaka',
        puntos: 'Puntonaka',
        correctas: 'Alwa',
        racha: 'Racha',
        rachaMaxima: 'Jach\'a racha',
        tiempoPromedio: 'Seg. chawpi',
        jugarDeNuevo: 'Janiw pukaraña',
        cambiarCategoria: 'Runaña tikraña',
        irInicio: 'Qalltañaru',
        nivelExcelente: '¡Alwawa! Yatiqiriwa 🏆',
        nivelBien: '¡Alwawa! Yatiqañataki katañataki 👍',
        nivelRegular: 'Alwa lurañataki, aswa yatiqaña 📚',
        nivelPracticar: 'Katañataki, atipañataki 💪',
        tipoTerminoDefinicion: 'Explicaciónna akllaña',
        tipoDefinicionTermino: 'Simiña akllaña',
        tipoPictogramaTermino: 'Simiña akllaña',
      },
    };
    return textos[i];
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  empezar(): void {
    this.ultimoResultado.set(null);
    this.juego.iniciarPartida(this.juego.categoriaFiltro());
    const pregunta = this.juego.preguntaActual();
    if (pregunta) {
      this.anunciador.anunciar(
        this.labelTipo(pregunta.tipo) + ': ' +
        this.getTextoEstimulo(pregunta),
        'alta'
      );
    }
  }

  responder(indice: number): void {
    const resultado = this.juego.responder(indice);
    if (!resultado) return;
    this.ultimoResultado.set(resultado);

    // Anunciar resultado en voz
    const msg = resultado.correcta
      ? this.t().correcto
      : `${this.t().incorrecto}. ${this.t().respuestaCorrecta}: ${resultado.palabraCorrecta[this.langService.idioma()].termino}`;
    this.anunciador.anunciar(msg, 'alta');
  }

  siguiente(): void {
    this.juego.siguientePregunta();
    const pregunta = this.juego.preguntaActual();
    if (pregunta && this.juego.estado() === 'jugando') {
      setTimeout(() => {
        this.anunciador.anunciar(
          this.labelTipo(pregunta.tipo) + ': ' + this.getTextoEstimulo(pregunta),
          'alta'
        );
      }, 300);
    }
  }

  reproducirPregunta(): void {
    const pregunta = this.juego.preguntaActual();
    if (pregunta) {
      this.audioService.reproducirPalabra(pregunta.palabra);
    }
  }

  getTextoOpcion(palabra: any, tipo: string): string {
    const idioma = this.langService.idioma();
    if (tipo === 'termino-a-definicion') {
      return palabra[idioma].definicion;
    }
    return palabra[idioma].termino;
  }

  private getTextoEstimulo(pregunta: any): string {
    const idioma = this.langService.idioma();
    if (pregunta.tipo === 'termino-a-definicion') return pregunta.palabra[idioma].termino;
    if (pregunta.tipo === 'definicion-a-termino') return pregunta.palabra[idioma].definicion;
    return this.t().queEsEsto;
  }

  iconoTipo(tipo: string): string {
    const iconos: Record<string, string> = {
      'termino-a-definicion': '📝',
      'definicion-a-termino': '💬',
      'pictograma-a-termino': '🖼️',
    };
    return iconos[tipo] ?? '❓';
  }

  labelTipo(tipo: string): string {
    const t = this.t();
    const labels: Record<string, string> = {
      'termino-a-definicion': t.tipoTerminoDefinicion,
      'definicion-a-termino': t.tipoDefinicionTermino,
      'pictograma-a-termino': t.tipoPictogramaTermino,
    };
    return labels[tipo] ?? '';
  }

  emojiRendimiento(): string {
    const nivel = this.juego.nivelRendimiento();
    return { excelente: '🏆', bien: '🌟', regular: '📚', practicar: '💪' }[nivel] ?? '🎮';
  }

  labelRendimiento(): string {
    const nivel = this.juego.nivelRendimiento();
    const t = this.t();
    return {
      excelente: t.nivelExcelente,
      bien: t.nivelBien,
      regular: t.nivelRegular,
      practicar: t.nivelPracticar,
    }[nivel] ?? '';
  }

  colorPorcentaje(): string {
    const p = this.porcentaje();
    if (p >= 80) return '#22C55E';
    if (p >= 60) return '#F59E0B';
    return '#EF4444';
  }
}
