import { Injectable, inject } from '@angular/core';
import { TecladoNavService } from './teclado-nav.service';

/**
 * Servicio de anuncio de voz — ahora delega al TecladoNavService.
 * Mantenido por compatibilidad con AudioService y PracticaComponent.
 */
@Injectable({ providedIn: 'root' })
export class AnunciadorService {
  private readonly tecladoNav = inject(TecladoNavService);

  anunciar(texto: string, _prioridad: 'normal' | 'alta' = 'normal'): void {
    this.tecladoNav.anunciar(texto);
  }

  cancelar(): void {
    this.tecladoNav.cancelar();
  }
}
