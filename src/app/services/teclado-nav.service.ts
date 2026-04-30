import { Injectable, inject, signal } from '@angular/core';
import { LanguageService } from './language.service';
import { VozService } from './voz.service';
import { Idioma } from '../models/palabra.model';

/**
 * Servicio global de navegación por teclado.
 * - Tab activa el modo teclado.
 * - En modo teclado, las flechas ↑↓←→ navegan entre elementos enfocables
 *   y se bloquea el scroll nativo del body.
 * - Mouse o touch desactivan el modo teclado y restauran el scroll.
 */
@Injectable({ providedIn: 'root' })
export class TecladoNavService {
  private readonly langService = inject(LanguageService);
  private readonly vozService  = inject(VozService);

  readonly modoTeclado = signal(false);
  /** Cuando hay un modal abierto, las flechas no navegan el fondo */
  readonly modalAbierto = signal(false);

  private synth: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private inicializado = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  inicializar(): void {
    if (this.inicializado || typeof window === 'undefined') return;
    this.inicializado = true;
    this.synth = window.speechSynthesis;

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const esFlechaOTab = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);

      // Activar modo teclado con Tab o flechas
      if (esFlechaOTab && !this.modoTeclado()) {
        this.activarModoTeclado();
      }

      if (e.key === 'Escape') {
        this.cancelar();
        return;
      }

      // Navegación con flechas solo en modo teclado y sin modal abierto
      if (!this.modoTeclado()) return;
      if (this.modalAbierto()) return; // el modal maneja sus propias flechas

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.moverFoco(1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        this.moverFoco(-1);
      }
    });

    document.addEventListener('mousedown', () => {
      if (this.modoTeclado()) this.desactivarModoTeclado();
    });

    document.addEventListener('touchstart', () => {
      if (this.modoTeclado()) this.desactivarModoTeclado();
    }, { passive: true });

    document.addEventListener('focusin', (e: FocusEvent) => {
      if (!this.modoTeclado()) return;
      const el = e.target as HTMLElement;
      if (!el || !this.esAnunciable(el)) return;

      const announceLang = el.getAttribute('data-announce-lang') as Idioma | null;
      const announceText = el.getAttribute('data-announce-text');

      if (announceLang && announceText) {
        this.anunciarEnIdioma(announceText, announceLang);
      } else {
        const texto = this.extraerTexto(el);
        if (texto) this.anunciar(texto);
      }
    });
  }

  /** Anuncia en el idioma activo */
  anunciar(texto: string): void {
    this.anunciarEnIdioma(texto, this.langService.idioma());
  }

  /** Anuncia en un idioma específico */
  anunciarEnIdioma(texto: string, idioma: Idioma): void {
    if (!this.synth || !texto.trim()) return;

    this.synth.cancel();

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    const u = new SpeechSynthesisUtterance(texto.trim());
    this.vozService.aplicarVoz(u, idioma);
    u.volume = this.langService.volumen();
    u.rate   = 1.1;
    this.utterance = u;

    this.debounceTimer = setTimeout(() => {
      this.synth?.cancel();
      this.synth?.speak(u);
      this.debounceTimer = null;
    }, 120);
  }

  cancelar(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.synth?.cancel();
    this.utterance = null;
  }

  // ── Privados ───────────────────────────────────────────────────────────────

  private activarModoTeclado(): void {
    this.modoTeclado.set(true);
    document.body.classList.add('modo-teclado');
    // Bloquear scroll nativo — las flechas navegarán el foco, no la página
    document.body.style.overflow = 'hidden';
  }

  private desactivarModoTeclado(): void {
    this.modoTeclado.set(false);
    document.body.classList.remove('modo-teclado');
    document.body.style.overflow = '';
    this.cancelar();
  }

  /**
   * Mueve el foco al siguiente/anterior elemento enfocable en el DOM.
   * direction: +1 = adelante, -1 = atrás
   */
  private moverFoco(direction: 1 | -1): void {
    const enfocables = this.obtenerEnfocables();
    if (enfocables.length === 0) return;

    const actual = document.activeElement as HTMLElement;
    const idx = enfocables.indexOf(actual);

    let siguiente: HTMLElement;
    if (idx === -1) {
      // Ningún elemento enfocado aún → ir al primero o último
      siguiente = direction === 1 ? enfocables[0] : enfocables[enfocables.length - 1];
    } else {
      const nuevoIdx = (idx + direction + enfocables.length) % enfocables.length;
      siguiente = enfocables[nuevoIdx];
    }

    siguiente.focus({ preventScroll: true });

    // Hacer visible el elemento enfocado sin scroll nativo
    siguiente.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }

  /** Devuelve todos los elementos enfocables visibles en el DOM, en orden de aparición */
  private obtenerEnfocables(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
    ].join(', ');

    return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => !el.closest('[aria-hidden="true"]') && this.esVisible(el)
    );
  }

  private esVisible(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  private esAnunciable(el: HTMLElement): boolean {
    const tag = el.tagName.toLowerCase();
    if (['button', 'a', 'input', 'select', 'textarea', 'summary'].includes(tag)) return true;
    const role = el.getAttribute('role') ?? '';
    if (['button', 'link', 'menuitem', 'option', 'tab', 'checkbox', 'radio', 'switch'].includes(role)) return true;
    const tabindex = el.getAttribute('tabindex');
    return tabindex !== null && tabindex !== '-1';
  }

  private extraerTexto(el: HTMLElement): string {
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel?.trim()) return this.limpiarEmojis(ariaLabel.trim());

    const labelledby = el.getAttribute('aria-labelledby');
    if (labelledby) {
      const ref = document.getElementById(labelledby);
      if (ref?.textContent?.trim()) return this.limpiarEmojis(ref.textContent.trim());
    }

    const title = el.getAttribute('title');
    if (title?.trim()) return this.limpiarEmojis(title.trim());

    const placeholder = (el as HTMLInputElement).placeholder;
    if (placeholder?.trim()) return this.limpiarEmojis(placeholder.trim());

    if (el.tagName.toLowerCase() === 'input') {
      const val = (el as HTMLInputElement).value;
      if (val?.trim()) return this.limpiarEmojis(val.trim());
    }

    const texto = this.extraerTextoVisible(el);
    return texto.length > 80 ? texto.substring(0, 80) + '...' : texto;
  }

  private extraerTextoVisible(el: HTMLElement): string {
    let resultado = '';
    el.childNodes.forEach(nodo => {
      if (nodo.nodeType === Node.TEXT_NODE) {
        resultado += nodo.textContent ?? '';
      } else if (nodo.nodeType === Node.ELEMENT_NODE) {
        const hijo = nodo as HTMLElement;
        if (hijo.getAttribute('aria-hidden') !== 'true') {
          resultado += this.extraerTextoVisible(hijo);
        }
      }
    });
    return this.limpiarEmojis(resultado.replace(/\s+/g, ' ').trim());
  }

  private limpiarEmojis(texto: string): string {
    return texto
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
      .replace(/[\u{2600}-\u{27BF}]/gu, '')
      .replace(/[\u{FE00}-\u{FEFF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
