import { Injectable, inject, signal } from '@angular/core';
import { Palabra, Idioma } from '../models/palabra.model';
import { LanguageService } from './language.service';
import { VozService } from './voz.service';

export type EstadoAudio = 'inactivo' | 'reproduciendo' | 'pausado' | 'error';

/**
 * Servicio de audio con doble estrategia:
 * 1. Archivo de audio pregrabado (si existe la ruta)
 * 2. Web Speech API (TTS) como fallback
 *
 * Garantiza que no se superpongan sonidos.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly langService = inject(LanguageService);
  private readonly vozService  = inject(VozService);

  private audioElement: HTMLAudioElement | null = null;
  private speechSynthesis: SpeechSynthesis | null = null;
  private utteranceActual: SpeechSynthesisUtterance | null = null;

  readonly estado = signal<EstadoAudio>('inactivo');
  readonly palabraActual = signal<string>('');

  constructor() {
    if (typeof window !== 'undefined') {
      this.speechSynthesis = window.speechSynthesis;
    }
  }

  /**
   * Reproduce el audio de una palabra en el idioma actual.
   * Detiene cualquier audio previo antes de reproducir.
   */
  async reproducirPalabra(palabra: Palabra): Promise<void> {
    this.detener();

    const idioma = this.langService.idioma();
    const traduccion = palabra[idioma];
    const rutaAudio = this.getRutaAudio(palabra, idioma);

    this.palabraActual.set(traduccion.termino);

    if (rutaAudio) {
      await this.reproducirArchivo(rutaAudio, traduccion.termino, idioma);
    } else {
      this.reproducirTTS(traduccion.termino, idioma, traduccion.pronunciacion);
    }
  }

  /**
   * Reproduce texto arbitrario con TTS en el idioma actual.
   */
  reproducirTexto(texto: string, idioma?: Idioma): void {
    this.detener();
    const idiomaActual = idioma ?? this.langService.idioma();
    this.reproducirTTS(texto, idiomaActual);
  }

  /** Detiene toda reproducción activa */
  detener(): void {
    // Detener audio HTML
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }

    // Detener TTS
    if (this.speechSynthesis?.speaking) {
      this.speechSynthesis.cancel();
    }

    this.utteranceActual = null;
    this.estado.set('inactivo');
    this.palabraActual.set('');
  }

  /** Pausa/reanuda la reproducción actual */
  togglePausa(): void {
    if (this.audioElement) {
      if (this.audioElement.paused) {
        this.audioElement.play();
        this.estado.set('reproduciendo');
      } else {
        this.audioElement.pause();
        this.estado.set('pausado');
      }
    } else if (this.speechSynthesis) {
      if (this.speechSynthesis.paused) {
        this.speechSynthesis.resume();
        this.estado.set('reproduciendo');
      } else {
        this.speechSynthesis.pause();
        this.estado.set('pausado');
      }
    }
  }

  // ── Privados ───────────────────────────────────────────────────────────────

  private async reproducirArchivo(ruta: string, termino: string, idioma: Idioma): Promise<void> {
    let fallbackUsado = false;

    const usarFallback = () => {
      if (fallbackUsado) return;
      fallbackUsado = true;
      this.audioElement = null;
      this.reproducirTTS(termino, idioma);
    };

    try {
      this.audioElement = new Audio(ruta);
      this.audioElement.volume = this.langService.volumen();

      this.audioElement.onplay = () => this.estado.set('reproduciendo');
      this.audioElement.onended = () => {
        this.estado.set('inactivo');
        this.palabraActual.set('');
      };
      this.audioElement.onerror = () => usarFallback();

      await this.audioElement.play();
    } catch {
      usarFallback();
    }
  }

  private reproducirTTS(texto: string, idioma: Idioma, pronunciacion?: string): void {
    if (!this.speechSynthesis) {
      this.estado.set('error');
      return;
    }

    const textoFinal = pronunciacion ?? texto;
    const utterance = new SpeechSynthesisUtterance(textoFinal);
    this.vozService.aplicarVoz(utterance, idioma);
    utterance.volume = this.langService.volumen();
    utterance.rate   = this.langService.velocidadTTS();

    utterance.onstart = () => this.estado.set('reproduciendo');
    utterance.onend = () => {
      this.estado.set('inactivo');
      this.palabraActual.set('');
    };
    utterance.onerror = () => this.estado.set('error');

    this.utteranceActual = utterance;
    this.speechSynthesis.speak(utterance);
  }

  private getRutaAudio(palabra: Palabra, idioma: Idioma): string | undefined {
    const mapa: Record<Idioma, 'audioEs' | 'audioQu' | 'audioAy'> = {
      es: 'audioEs', qu: 'audioQu', ay: 'audioAy',
    };
    return palabra.multimedia[mapa[idioma]];
  }
}
