import { Directive, Input, HostListener, ElementRef, inject, OnInit } from '@angular/core';
import { TecladoNavService } from '../services/teclado-nav.service';
import { LanguageService } from '../services/language.service';

/**
 * Directiva [liAnunciarFoco] — complemento opcional al TecladoNavService.
 *
 * Permite especificar un texto personalizado por idioma para anunciar
 * cuando el elemento recibe foco por teclado, sobreescribiendo la
 * extracción automática del TecladoNavService.
 *
 * Uso:
 *   <button [liAnunciarFoco]="'Buscar palabras'">🔍</button>
 *   <button liAnunciarFoco [anuncioEs]="'Buscar'" [anuncioQu]="'Maskay'">🔍</button>
 */
@Directive({
  selector: '[liAnunciarFoco]',
  standalone: true,
})
export class AnunciarFocoDirective implements OnInit {
  @Input('liAnunciarFoco') textoAnuncio = '';
  @Input() anuncioEs?: string;
  @Input() anuncioQu?: string;
  @Input() anuncioAy?: string;

  private readonly tecladoNav = inject(TecladoNavService);
  private readonly langService = inject(LanguageService);
  private readonly el = inject(ElementRef<HTMLElement>);

  ngOnInit(): void {
    const nativo = this.el.nativeElement;
    if (!nativo.getAttribute('tabindex') && !this.esInteractivo(nativo)) {
      nativo.setAttribute('tabindex', '0');
    }
  }

  @HostListener('focus')
  onFocus(): void {
    if (!this.tecladoNav.modoTeclado()) return;
    const texto = this.resolverTexto();
    if (texto) this.tecladoNav.anunciar(texto);
  }

  private resolverTexto(): string {
    const idioma = this.langService.idioma();
    if (idioma === 'qu' && this.anuncioQu) return this.anuncioQu;
    if (idioma === 'ay' && this.anuncioAy) return this.anuncioAy;
    if (this.anuncioEs) return this.anuncioEs;
    if (this.textoAnuncio) return this.textoAnuncio;
    return '';
  }

  private esInteractivo(el: HTMLElement): boolean {
    return ['button', 'a', 'input', 'select', 'textarea'].includes(el.tagName.toLowerCase());
  }
}
