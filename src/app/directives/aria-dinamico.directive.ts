import {
  Directive,
  Input,
  ElementRef,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';

/**
 * Directiva para gestionar atributos ARIA dinámicos.
 * Actualiza aria-label, aria-describedby y role de forma reactiva.
 */
@Directive({
  selector: '[liAriaLabel]',
  standalone: true,
})
export class AriaDinamicoDirective implements OnChanges {
  @Input('liAriaLabel') ariaLabel = '';
  @Input() ariaDescribedby?: string;
  @Input() ariaRole?: string;
  @Input() ariaLive?: 'polite' | 'assertive' | 'off';
  @Input() ariaExpanded?: boolean;
  @Input() ariaPressed?: boolean;

  private readonly el = inject(ElementRef<HTMLElement>);

  ngOnChanges(changes: SimpleChanges): void {
    const nativo = this.el.nativeElement;

    if (changes['ariaLabel'] && this.ariaLabel) {
      nativo.setAttribute('aria-label', this.ariaLabel);
    }
    if (changes['ariaDescribedby'] && this.ariaDescribedby) {
      nativo.setAttribute('aria-describedby', this.ariaDescribedby);
    }
    if (changes['ariaRole'] && this.ariaRole) {
      nativo.setAttribute('role', this.ariaRole);
    }
    if (changes['ariaLive'] && this.ariaLive) {
      nativo.setAttribute('aria-live', this.ariaLive);
    }
    if (changes['ariaExpanded'] !== undefined) {
      nativo.setAttribute('aria-expanded', String(this.ariaExpanded));
    }
    if (changes['ariaPressed'] !== undefined) {
      nativo.setAttribute('aria-pressed', String(this.ariaPressed));
    }
  }
}
