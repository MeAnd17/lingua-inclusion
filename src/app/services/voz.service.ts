import { Injectable } from '@angular/core';
import { Idioma } from '../models/palabra.model';

/**
 * Servicio centralizado de selección de voces TTS.
 *
 * Estrategia por dispositivo:
 * - Móvil Android : prioriza voces "Google" (suenan naturales y están instaladas)
 * - Móvil iOS/macOS: prioriza voces "Mónica", "Paulina", "Jorge" (voces nativas de Apple)
 * - Escritorio     : prioriza voces locales del sistema operativo
 *
 * Para Quechua y Aymara no existen voces nativas en ningún dispositivo,
 * por lo que se usa la mejor voz española disponible (fonéticamente compatible).
 */
@Injectable({ providedIn: 'root' })
export class VozService {
  private synth: SpeechSynthesis | null = null;
  private cache: Record<Idioma, SpeechSynthesisVoice | null> = {
    es: null, qu: null, ay: null,
  };
  private cargado = false;

  constructor() {
    if (typeof window === 'undefined') return;
    this.synth = window.speechSynthesis;

    // Las voces pueden no estar disponibles inmediatamente
    this.intentarCargar();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.intentarCargar();
    }
  }

  /** Devuelve la mejor voz para el idioma dado */
  obtenerVoz(idioma: Idioma): SpeechSynthesisVoice | null {
    if (!this.cargado) this.intentarCargar();
    return this.cache[idioma];
  }

  /** Devuelve el código de lengua BCP-47 para el utterance */
  obtenerLang(idioma: Idioma): string {
    const voz = this.cache[idioma];
    if (voz) return voz.lang;
    return idioma === 'es' ? 'es-PE' : 'es-PE'; // fallback siempre español
  }

  /** Aplica voz y lang a un utterance ya creado */
  aplicarVoz(u: SpeechSynthesisUtterance, idioma: Idioma): void {
    const voz = this.obtenerVoz(idioma);
    if (voz) {
      u.voice = voz;
      u.lang  = voz.lang;
    } else {
      u.lang = this.obtenerLang(idioma);
    }
  }

  // ── Privados ───────────────────────────────────────────────────────────────

  private intentarCargar(): void {
    const voces = this.synth?.getVoices() ?? [];
    if (voces.length === 0) return;

    this.cargado = true;
    const esMovil = this.esDispositivoMovil();
    const esIOS   = this.esIOS();

    this.cache.es = this.seleccionarVozEspanol(voces, esMovil, esIOS);
    // QU y AY usan la misma voz española — es la más cercana fonéticamente
    this.cache.qu = this.cache.es;
    this.cache.ay = this.cache.es;
  }

  private seleccionarVozEspanol(
    voces: SpeechSynthesisVoice[],
    esMovil: boolean,
    esIOS: boolean
  ): SpeechSynthesisVoice | null {
    const esVoces = voces.filter(v => v.lang.startsWith('es'));
    if (esVoces.length === 0) return null;

    if (esIOS) {
      // iOS / macOS — voces nativas de Apple, suenan muy naturales
      return (
        esVoces.find(v => v.name === 'Mónica')   ??   // es-ES, muy clara
        esVoces.find(v => v.name === 'Paulina')   ??   // es-MX, latinoamericana
        esVoces.find(v => v.name === 'Jorge')     ??   // es-ES masculina
        esVoces.find(v => v.name.includes('Siri') && v.lang.startsWith('es')) ??
        esVoces.find(v => v.localService)         ??   // cualquier voz local
        esVoces[0]
      );
    }

    if (esMovil) {
      // Android — voces Google son las mejores disponibles
      return (
        esVoces.find(v => v.name.includes('Google') && v.lang === 'es-US') ??
        esVoces.find(v => v.name.includes('Google') && v.lang === 'es-MX') ??
        esVoces.find(v => v.name.includes('Google') && v.lang.startsWith('es')) ??
        esVoces.find(v => v.name.includes('Google')) ??
        esVoces.find(v => v.localService) ??
        esVoces[0]
      );
    }

    // Escritorio (Windows / macOS / Linux)
    return (
      esVoces.find(v => v.lang === 'es-PE' && v.localService)  ??
      esVoces.find(v => v.lang === 'es-PE')                    ??
      esVoces.find(v => v.lang === 'es-419' && v.localService) ??
      esVoces.find(v => v.lang === 'es-MX' && v.localService)  ??
      esVoces.find(v => v.lang === 'es-US' && v.localService)  ??
      esVoces.find(v => v.localService)                        ??
      esVoces.find(v => v.lang === 'es-MX')                    ??
      esVoces.find(v => v.lang === 'es-US')                    ??
      esVoces[0]
    );
  }

  private esDispositivoMovil(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  private esIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent) &&
      typeof (navigator as any).standalone !== 'undefined' ||
      /Mac/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1 ||
      /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
}
