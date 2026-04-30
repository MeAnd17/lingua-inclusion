import { Injectable, inject, signal } from '@angular/core';
import { LanguageService } from './language.service';
import { TecladoNavService } from './teclado-nav.service';
import { VozService } from './voz.service';

const STORAGE_KEY = 'lingua-bienvenida-vista';

export interface PasoTutorial {
  icono: string;
  titulo: string;
  texto: string;
}

/**
 * Servicio de bienvenida.
 * Soporta dos modos:
 *  - Voz: reproduce el tutorial con SpeechSynthesis
 *  - Escrito: muestra un modal paso a paso (accesible para personas sordas)
 */
@Injectable({ providedIn: 'root' })
export class BienvenidaService {
  private readonly tecladoNav = inject(TecladoNavService);
  private readonly langService = inject(LanguageService);
  private readonly vozService  = inject(VozService);

  // ── Signals públicos ───────────────────────────────────────────────────────
  readonly reproduciendo    = signal(false);
  readonly idiomaActual     = signal<'es' | 'qu' | 'ay' | null>(null);
  readonly mostrandoEscrito = signal(false);
  readonly mostrandoSelector = signal(false);
  readonly pasoEscritoActual = signal(0);

  private synth: SpeechSynthesis | null = null;
  private cancelado = false;

  // ── Guiones de voz ─────────────────────────────────────────────────────────
  // Versión escritorio (con instrucciones de teclado)
  private readonly guionesDesktop = {
    es: [
      'Bienvenido a Lingua-Inclusion.',
      'Esta aplicación te ayuda a aprender palabras en español, quechua y aymara.',
      'En la parte superior puedes cambiar el idioma con los botones ES, QU y AY.',
      'También puedes cambiar el modo visual: estándar, alto contraste, solo audio, o pictogramas.',
      'Usa la sección Diccionario para buscar palabras y escuchar su pronunciación.',
      'En la sección Práctica encontrarás un juego para poner a prueba tu vocabulario.',
      'Puedes navegar toda la aplicación con las teclas de flecha de tu teclado.',
      'Cada elemento que enfoques será anunciado en voz alta.',
    ],
    qu: [
      'Lingua-Inclusion appiman hamuqtiyki.',
      'Kay appim español, quechua, aymarapiwan simikunata yachakuyta yanapasunki.',
      'Hawkay partim ES, QU, AY botonkunawan simita tikrayta atinki.',
      'Rikuyta tikrayta atinki: lliw rikuy, hatun contraste, uyariy kama, o rikuchiy rikuy.',
      'Simikunap Qillqanpi simikunata maskayta uyariyta atinki.',
      'Yachay Pukllaypi simikunata yachakunapaq pukllaykunata tariyta atinki.',
      'Flecha teclakunawan llapan appita puriykuy atinki.',
    ],
    ay: [
      'Lingua-Inclusion appiru jutañataki.',
      'Kay appiru español, quechua, aymararu siminaka yatiqañataki yanapt\'añataki.',
      'Patxaru ES, QU, AY botonnakampi simiña tikrañataki atañataki.',
      'Uñt\'aña tikrañataki: lliw uñt\'aña, jach\'a contraste, uyañataki kama, uñt\'ayiri uñaña.',
      'Siminakana Qillqaru siminaka maskañataki uyañataki atañataki.',
      'Yatiqaña Pukaraña sectionaru siminaka yatiqañataki pukaraña tarañataki.',
      'Flecha teclanakampi taqini appita puriña atañataki.',
    ],
  };

  // Versión móvil (sin instrucciones de teclado, con instrucciones táctiles)
  private readonly guionesMovil = {
    es: [
      'Bienvenido a Lingua-Inclusion.',
      'Esta aplicación te ayuda a aprender palabras en español, quechua y aymara.',
      'En la parte superior puedes cambiar el idioma tocando los botones ES, QU y AY.',
      'También puedes cambiar el modo visual: estándar, alto contraste, solo audio, o pictogramas.',
      'Toca la sección Diccionario para buscar palabras y escuchar su pronunciación.',
      'En la sección Práctica encontrarás un juego para poner a prueba tu vocabulario.',
      'Toca cualquier botón de audio para escuchar cómo se pronuncia cada palabra.',
    ],
    qu: [
      'Lingua-Inclusion appiman hamuqtiyki.',
      'Kay appim español, quechua, aymarapiwan simikunata yachakuyta yanapasunki.',
      'Hawkay partim ES, QU, AY botonkunata tiyay simita tikranapaq.',
      'Rikuyta tikrayta atinki: lliw rikuy, hatun contraste, uyariy kama, o rikuchiy rikuy.',
      'Simikunap Qillqanta tiyay simikunata maskanapaq.',
      'Yachay Pukllaypi simikunata yachakunapaq pukllaykunata tariyta atinki.',
      'Audio botonkunata tiyay simita imaynatan niyta uyarinapaq.',
    ],
    ay: [
      'Lingua-Inclusion appiru jutañataki.',
      'Kay appiru español, quechua, aymararu siminaka yatiqañataki yanapt\'añataki.',
      'Patxaru ES, QU, AY botonnaka tiyaña simiña tikrañataki.',
      'Uñt\'aña tikrañataki: lliw uñt\'aña, jach\'a contraste, uyañataki kama, uñt\'ayiri uñaña.',
      'Siminakana Qillqa tiyaña siminaka maskañataki.',
      'Yatiqaña Pukaraña sectionaru siminaka yatiqañataki pukaraña tarañataki.',
      'Audio botonnaka tiyaña simiña kunjamatisa siñañataki uyañataki.',
    ],
  };

  private get guiones() {
    return this.esMovil() ? this.guionesMovil : this.guionesDesktop;
  }

  private esMovil(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  // ── Tutorial escrito (pasos visuales) ──────────────────────────────────────
  private readonly pasosTutorialDesktop: Record<'es' | 'qu' | 'ay', PasoTutorial[]> = {
    es: [
      { icono: '🌐', titulo: 'Cambia el idioma',
        texto: 'Usa los botones ES, QU o AY en la barra superior para cambiar entre Español, Quechua y Aymara. Todo el contenido cambia al instante.' },
      { icono: '👁️', titulo: 'Modos de accesibilidad',
        texto: 'Los íconos junto al idioma cambian el modo visual: estándar, alto contraste, solo audio o pictogramas. Elige el que mejor se adapte a ti.' },
      { icono: '📖', titulo: 'Diccionario',
        texto: 'En el Diccionario puedes buscar palabras en cualquier idioma y filtrar por categoría. Cada tarjeta tiene audio y traducción en los 3 idiomas.' },
      { icono: '🎮', titulo: 'Práctica',
        texto: 'En la sección Práctica hay un juego tipo quiz. Elige una categoría y responde 10 preguntas para poner a prueba tu vocabulario.' },
      { icono: '⌨️', titulo: 'Navegación por teclado',
        texto: 'Puedes navegar toda la app con las teclas de flecha. Presiona Tab para activar este modo. El scroll se desactiva y las flechas mueven el foco entre elementos.' },
      { icono: '🔊', titulo: 'Audio en cada palabra',
        texto: 'Cada tarjeta tiene un botón de audio para escuchar la pronunciación correcta. Al expandir una tarjeta verás la traducción y un ejemplo de uso.' },
    ],
    qu: [
      { icono: '🌐', titulo: 'Simita tikray',
        texto: 'ES, QU, AY botonkunata llamkachiy hawkay partimanta simita tikranapaq. Llapan contenido usqhayta tikran.' },
      { icono: '👁️', titulo: 'Rikuy tikray',
        texto: 'Ikonokunam rikuyta tikrachin: normal, hatun contraste, uyariy kama, rikuchiy rikuy. Allinpaq akllakuy.' },
      { icono: '📖', titulo: 'Simikunap Qillqan',
        texto: 'Simikunap Qillqanpi imaymana simipi maskayta atinki. Sapa tarjetam audioyuq, kimsa simipi traduccionyuq.' },
      { icono: '🎮', titulo: 'Yachay Pukllay',
        texto: 'Yachay Pukllaypi quiz pukllaykunam tiyan. Huk runayta akllay chunka tapuyta kutichiy.' },
      { icono: '⌨️', titulo: 'Tecladowan puriykuy',
        texto: 'Flecha teclakunawan llapan appita puriykuy atinki. Tab teclakunawan kay modota qallariy.' },
      { icono: '🔊', titulo: 'Sapa simipi audio',
        texto: 'Sapa tarjetam audio botonwan uyariy atinki. Aswan botonwan traduccionkunata ejemplokunata rikuyta atinki.' },
    ],
    ay: [
      { icono: '🌐', titulo: 'Simiña tikraña',
        texto: 'ES, QU, AY botonnakampi patxaru simiña tikrañataki. Taqini contenido usqharu tikrañataki.' },
      { icono: '👁️', titulo: 'Uñt\'aña tikraña',
        texto: 'Ikonunaka uñt\'aña tikrañataki: normal, jach\'a contraste, uyañataki kama, uñt\'ayiri uñaña. Alwaru akllaña.' },
      { icono: '📖', titulo: 'Siminakana Qillqa',
        texto: 'Siminakana Qillqaru imaymana simiru maskañataki atañataki. Sapa tarjetana audio, kimsa simiru traducciónniwa.' },
      { icono: '🎮', titulo: 'Yatiqaña Pukaraña',
        texto: 'Yatiqaña Pukaraña sectionaru quiz pukaraña utjañataki. Huk runaña akllaña tunka tapuña kutichaña.' },
      { icono: '⌨️', titulo: 'Tecladumpi puriña',
        texto: 'Flecha teclanakampi taqini appita puriña atañataki. Tab teclampi kay modo qalltaña.' },
      { icono: '🔊', titulo: 'Sapa simiña audio',
        texto: 'Sapa tarjetana audio botónmpi uyañataki atañataki. Aswa botónmpi traducciónna yatiyañana uñt\'añataki.' },
    ],
  };

  private readonly pasosTutorialMovil: Record<'es' | 'qu' | 'ay', PasoTutorial[]> = {
    es: [
      { icono: '🌐', titulo: 'Cambia el idioma',
        texto: 'Toca los botones ES, QU o AY en la barra superior para cambiar entre Español, Quechua y Aymara. Todo cambia al instante.' },
      { icono: '👁️', titulo: 'Modos de accesibilidad',
        texto: 'Los íconos junto al idioma cambian el modo visual: estándar, alto contraste, solo audio o pictogramas. Toca el que mejor se adapte a ti.' },
      { icono: '📖', titulo: 'Diccionario',
        texto: 'Toca Diccionario para buscar palabras en cualquier idioma. Cada tarjeta tiene audio y traducción en los 3 idiomas.' },
      { icono: '🎮', titulo: 'Práctica',
        texto: 'Toca Práctica para jugar un quiz. Elige una categoría y responde 10 preguntas para poner a prueba tu vocabulario.' },
      { icono: '👆', titulo: 'Navegar la app',
        texto: 'Desliza hacia arriba y abajo para ver más contenido. Toca cualquier tarjeta para ver su información completa.' },
      { icono: '🔊', titulo: 'Audio en cada palabra',
        texto: 'Toca el botón de audio en cada tarjeta para escuchar la pronunciación. Toca "Más" para ver la traducción y el ejemplo de uso.' },
    ],
    qu: [
      { icono: '🌐', titulo: 'Simita tikray',
        texto: 'ES, QU, AY botonkunata tiyay hawkay partimanta simita tikranapaq. Llapan contenido usqhayta tikran.' },
      { icono: '👁️', titulo: 'Rikuy tikray',
        texto: 'Ikonokunam rikuyta tikrachin: normal, hatun contraste, uyariy kama, rikuchiy rikuy. Allinpaq tiyay.' },
      { icono: '📖', titulo: 'Simikunap Qillqan',
        texto: 'Simikunap Qillqanta tiyay simikunata maskanapaq. Sapa tarjetam audioyuq, kimsa simipi traduccionyuq.' },
      { icono: '🎮', titulo: 'Yachay Pukllay',
        texto: 'Yachay Pukllaypi quiz pukllaykunam tiyan. Huk runayta akllay chunka tapuyta kutichiy.' },
      { icono: '👆', titulo: 'Appita puriykuy',
        texto: 'Wichariy urariytawan aswan contenidota rikuyta atinki. Sapa tarjetata tiyay aswan willakuykunata rikunapaq.' },
      { icono: '🔊', titulo: 'Sapa simipi audio',
        texto: 'Audio botonwan simita uyariy atinki. Aswan botonwan traduccionkunata ejemplokunata rikuyta atinki.' },
    ],
    ay: [
      { icono: '🌐', titulo: 'Simiña tikraña',
        texto: 'ES, QU, AY botonnaka tiyaña patxaru simiña tikrañataki. Taqini contenido usqharu tikrañataki.' },
      { icono: '👁️', titulo: 'Uñt\'aña tikraña',
        texto: 'Ikonunaka uñt\'aña tikrañataki: normal, jach\'a contraste, uyañataki kama, uñt\'ayiri uñaña. Alwaru tiyaña.' },
      { icono: '📖', titulo: 'Siminakana Qillqa',
        texto: 'Siminakana Qillqa tiyaña siminaka maskañataki. Sapa tarjetana audio, kimsa simiru traducciónniwa.' },
      { icono: '🎮', titulo: 'Yatiqaña Pukaraña',
        texto: 'Yatiqaña Pukaraña tiyaña quiz pukaraña utjañataki. Huk runaña akllaña tunka tapuña kutichaña.' },
      { icono: '👆', titulo: 'Appita puriña',
        texto: 'Wicharaña urañampi aswa contenido uñt\'añataki. Sapa tarjeta tiyaña aswa yatiyañana uñt\'añataki.' },
      { icono: '🔊', titulo: 'Sapa simiña audio',
        texto: 'Audio botónmpi simiña uyañataki atañataki. Aswa botónmpi traducciónna yatiyañana uñt\'añataki.' },
    ],
  };

  get pasosTutorial(): Record<'es' | 'qu' | 'ay', PasoTutorial[]> {
    return this.esMovil() ? this.pasosTutorialMovil : this.pasosTutorialDesktop;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
    }
  }

  // ── API pública ────────────────────────────────────────────────────────────

  /** Muestra el selector de modo al entrar */
  mostrarSelector(): void {
    setTimeout(() => this.mostrandoSelector.set(true), 800);
  }

  /** El usuario eligió tutorial en voz */
  elegirVoz(): void {
    this.mostrandoSelector.set(false);
    setTimeout(() => this.reproducirCompleto(), 300);
  }

  /** El usuario eligió tutorial escrito */
  elegirEscrito(): void {
    this.mostrandoSelector.set(false);
    this.pasoEscritoActual.set(0);
    this.mostrandoEscrito.set(true);
  }

  /** Cierra el selector sin hacer nada */
  cerrarSelector(): void {
    this.mostrandoSelector.set(false);
  }

  // ── Tutorial escrito ───────────────────────────────────────────────────────

  get pasosActuales(): PasoTutorial[] {
    const idioma = this.langService.idioma() as 'es' | 'qu' | 'ay';
    return this.pasosTutorial[idioma];
  }

  get totalPasos(): number {
    return this.pasosActuales.length;
  }

  siguientePasoEscrito(): void {
    const siguiente = this.pasoEscritoActual() + 1;
    if (siguiente >= this.totalPasos) {
      this.cerrarEscrito();
    } else {
      this.pasoEscritoActual.set(siguiente);
    }
  }

  anteriorPasoEscrito(): void {
    const anterior = this.pasoEscritoActual() - 1;
    if (anterior >= 0) this.pasoEscritoActual.set(anterior);
  }

  cerrarEscrito(): void {
    this.mostrandoEscrito.set(false);
    this.pasoEscritoActual.set(0);
  }

  abrirEscrito(): void {
    this.pasoEscritoActual.set(0);
    this.mostrandoEscrito.set(true);
  }

  // ── Tutorial de voz ────────────────────────────────────────────────────────

  reproducirSiEsPrimeraVez(): void {
    setTimeout(() => this.mostrarSelector(), 800);
  }

  reproducirCompleto(): void {
    if (!this.synth) return;
    this.cancelado = false;
    this.reproduciendo.set(true);
    this.reproducirSecuencia();
  }

  detener(): void {
    this.cancelado = true;
    this.synth?.cancel();
    this.reproduciendo.set(false);
    this.idiomaActual.set(null);
  }

  resetear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ── Privados ───────────────────────────────────────────────────────────────

  private reproducirSecuencia(): void {
    const idiomaActivo = this.langService.idioma() as 'es' | 'qu' | 'ay';
    const todos: Array<'es' | 'qu' | 'ay'> = ['es', 'qu', 'ay'];
    const orden = [idiomaActivo, ...todos.filter(i => i !== idiomaActivo)];

    const secuencia = orden.map(idioma => ({ idioma, frases: this.guiones[idioma] }));

    let idiomaIdx = 0;
    let fraseIdx  = 0;

    const siguiente = () => {
      if (this.cancelado) {
        this.reproduciendo.set(false);
        this.idiomaActual.set(null);
        return;
      }

      const bloque = secuencia[idiomaIdx];
      if (!bloque) {
        this.reproduciendo.set(false);
        this.idiomaActual.set(null);
        return;
      }

      this.idiomaActual.set(bloque.idioma);

      const frase = bloque.frases[fraseIdx];
      if (!frase) {
        idiomaIdx++;
        fraseIdx = 0;
        setTimeout(siguiente, 800);
        return;
      }

      const u = new SpeechSynthesisUtterance(frase);
      this.vozService.aplicarVoz(u, bloque.idioma);
      u.volume = 1;
      u.rate   = 0.92;
      u.pitch  = 1;

      u.onend  = () => { fraseIdx++; setTimeout(siguiente, 350); };
      u.onerror = () => { fraseIdx++; setTimeout(siguiente, 200); };

      this.synth!.speak(u);
    };

    this.synth!.cancel();
    setTimeout(siguiente, 300);
  }
}
