import { Pipe, PipeTransform, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Palabra, Idioma } from '../models/palabra.model';
import { LanguageService } from '../services/language.service';

/**
 * Pipe para obtener la traducción de una palabra en el idioma activo.
 * Es puro=false para reaccionar a cambios del signal de idioma.
 */
@Pipe({
  name: 'traducir',
  standalone: true,
  pure: false, // Necesario para reaccionar a cambios de signal externo
})
export class TraducirPipe implements PipeTransform {
  private readonly langService = inject(LanguageService);

  transform(
    palabra: Palabra,
    campo: 'termino' | 'definicion' | 'pronunciacion' | 'ejemploUso' = 'termino',
    idiomaForzado?: Idioma
  ): string {
    const idioma = idiomaForzado ?? this.langService.idioma();
    const traduccion = palabra[idioma];
    return traduccion[campo] ?? '';
  }
}
