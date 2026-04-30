import { Injectable, signal, computed, inject } from '@angular/core';
import { Palabra, Categoria } from '../models/palabra.model';
import { PALABRAS_DATA } from '../data/palabras.data';
import { LanguageService } from './language.service';

export type TipoPregunta =
  | 'termino-a-definicion'   // Ve el término → elige la definición correcta
  | 'definicion-a-termino'   // Ve la definición → elige el término correcto
  | 'pictograma-a-termino'   // Ve el emoji → elige el término correcto
  | 'audio-a-termino';       // Escucha el audio → elige el término correcto

export interface Pregunta {
  tipo: TipoPregunta;
  palabra: Palabra;           // La palabra correcta
  opciones: Palabra[];        // 4 opciones (incluye la correcta)
  indicePalabra: number;      // Índice de la correcta en opciones
}

export interface ResultadoRespuesta {
  correcta: boolean;
  palabraCorrecta: Palabra;
  palabraElegida: Palabra;
  tiempoMs: number;
}

export type EstadoJuego = 'inicio' | 'jugando' | 'respondida' | 'fin';

export interface EstadisticasPartida {
  correctas: number;
  incorrectas: number;
  racha: number;
  rachaMaxima: number;
  tiempoTotal: number;
  puntuacion: number;
}

const PREGUNTAS_POR_RONDA = 10;
const PUNTOS_CORRECTA_BASE = 100;
const BONUS_RACHA = 25;
const BONUS_VELOCIDAD_MS = 5000; // Si responde en menos de 5s, bonus

@Injectable({ providedIn: 'root' })
export class PracticaService {
  private readonly langService = inject(LanguageService);

  // ── Estado del juego ───────────────────────────────────────────────────────
  readonly estado = signal<EstadoJuego>('inicio');
  readonly preguntaActual = signal<Pregunta | null>(null);
  readonly numeroPregunta = signal(0);
  readonly opcionSeleccionada = signal<number | null>(null);
  readonly estadisticas = signal<EstadisticasPartida>({
    correctas: 0, incorrectas: 0,
    racha: 0, rachaMaxima: 0,
    tiempoTotal: 0, puntuacion: 0,
  });
  readonly categoriaFiltro = signal<Categoria | null>(null);

  private preguntas: Pregunta[] = [];
  private tiempoInicioPregunta = 0;

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly progreso = computed(() =>
    Math.round((this.numeroPregunta() / PREGUNTAS_POR_RONDA) * 100)
  );

  readonly totalPreguntas = PREGUNTAS_POR_RONDA;

  readonly esUltimaPregunta = computed(() =>
    this.numeroPregunta() >= PREGUNTAS_POR_RONDA - 1
  );

  readonly nivelRendimiento = computed(() => {
    const stats = this.estadisticas();
    const pct = stats.correctas / Math.max(1, stats.correctas + stats.incorrectas);
    if (pct >= 0.9) return 'excelente';
    if (pct >= 0.7) return 'bien';
    if (pct >= 0.5) return 'regular';
    return 'practicar';
  });

  // ── Acciones públicas ──────────────────────────────────────────────────────

  iniciarPartida(categoria?: Categoria | null): void {
    this.categoriaFiltro.set(categoria ?? null);
    this.preguntas = this.generarPreguntas();
    this.estadisticas.set({
      correctas: 0, incorrectas: 0,
      racha: 0, rachaMaxima: 0,
      tiempoTotal: 0, puntuacion: 0,
    });
    this.numeroPregunta.set(0);
    this.opcionSeleccionada.set(null);
    this.estado.set('jugando');
    this.cargarPregunta(0);
  }

  responder(indiceOpcion: number): ResultadoRespuesta | null {
    const pregunta = this.preguntaActual();
    if (!pregunta || this.estado() !== 'jugando') return null;

    const tiempoMs = Date.now() - this.tiempoInicioPregunta;
    const correcta = indiceOpcion === pregunta.indicePalabra;

    this.opcionSeleccionada.set(indiceOpcion);
    this.estado.set('respondida');

    // Actualizar estadísticas
    this.estadisticas.update(stats => {
      const nuevaRacha = correcta ? stats.racha + 1 : 0;
      const bonusRacha = correcta ? Math.floor(nuevaRacha / 3) * BONUS_RACHA : 0;
      const bonusVelocidad = correcta && tiempoMs < BONUS_VELOCIDAD_MS
        ? Math.round((BONUS_VELOCIDAD_MS - tiempoMs) / 100)
        : 0;
      const puntos = correcta ? PUNTOS_CORRECTA_BASE + bonusRacha + bonusVelocidad : 0;

      return {
        correctas:    correcta ? stats.correctas + 1 : stats.correctas,
        incorrectas:  correcta ? stats.incorrectas : stats.incorrectas + 1,
        racha:        nuevaRacha,
        rachaMaxima:  Math.max(stats.rachaMaxima, nuevaRacha),
        tiempoTotal:  stats.tiempoTotal + tiempoMs,
        puntuacion:   stats.puntuacion + puntos,
      };
    });

    return {
      correcta,
      palabraCorrecta: pregunta.palabra,
      palabraElegida: pregunta.opciones[indiceOpcion],
      tiempoMs,
    };
  }

  siguientePregunta(): void {
    const siguiente = this.numeroPregunta() + 1;
    if (siguiente >= PREGUNTAS_POR_RONDA) {
      this.estado.set('fin');
      return;
    }
    this.numeroPregunta.set(siguiente);
    this.opcionSeleccionada.set(null);
    this.estado.set('jugando');
    this.cargarPregunta(siguiente);
  }

  reiniciar(): void {
    this.estado.set('inicio');
    this.preguntaActual.set(null);
    this.opcionSeleccionada.set(null);
  }

  // ── Privados ───────────────────────────────────────────────────────────────

  private cargarPregunta(indice: number): void {
    this.preguntaActual.set(this.preguntas[indice]);
    this.tiempoInicioPregunta = Date.now();
  }

  private generarPreguntas(): Pregunta[] {
    const cat = this.categoriaFiltro();
    let pool = cat
      ? PALABRAS_DATA.filter(p => p.categoria === cat)
      : PALABRAS_DATA;

    // Necesitamos al menos 4 palabras para las opciones
    if (pool.length < 4) pool = PALABRAS_DATA;

    // Mezclar y tomar las primeras N
    const mezcladas = this.mezclar([...pool]);
    const seleccionadas = mezcladas.slice(0, PREGUNTAS_POR_RONDA);

    const tipos: TipoPregunta[] = [
      'termino-a-definicion',
      'definicion-a-termino',
      'pictograma-a-termino',
    ];

    return seleccionadas.map((palabra, i) => {
      const tipo = tipos[i % tipos.length];
      const distractores = this.mezclar(
        pool.filter(p => p.id !== palabra.id)
      ).slice(0, 3);

      const opciones = this.mezclar([palabra, ...distractores]);
      const indicePalabra = opciones.indexOf(palabra);

      return { tipo, palabra, opciones, indicePalabra };
    });
  }

  private mezclar<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
