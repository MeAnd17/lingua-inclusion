import { Directive, ElementRef, OnInit, inject } from '@angular/core';

/**
 * Directiva que garantiza un área táctil mínima de 44x44px (WCAG 2.5.5).
 * Aplica estilos inline para asegurar el tamaño mínimo sin alterar el layout visual.
 */
@Directive({
  selector: '[liTouchTarget]',
  standalone: true,
})
export class TouchTargetDirective implements OnInit {
  private readonly el = inject(ElementRef<HTMLElement>);

  ngOnInit(): void {
    const nativo = this.el.nativeElement;
    const estilos = nativo.style;

    // Asegurar posición relativa para el pseudo-elemento
    const posicionActual = getComputedStyle(nativo).position;
    if (posicionActual === 'static') {
      estilos.position = 'relative';
    }

    // Aplicar tamaño mínimo de área táctil
    estilos.minWidth = '44px';
    estilos.minHeight = '44px';

    // Centrar contenido
    if (!estilos.display) {
      estilos.display = 'inline-flex';
    }
    estilos.alignItems = 'center';
    estilos.justifyContent = 'center';

    // Cursor pointer para indicar interactividad
    estilos.cursor = 'pointer';
  }
}
