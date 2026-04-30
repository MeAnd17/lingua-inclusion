import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { BienvenidaService } from '../../services/bienvenida.service';
import { AnunciarFocoDirective } from '../../directives/anunciar-foco.directive';
import { TouchTargetDirective } from '../../directives/touch-target.directive';

export type SeccionTutorial = 'inicio' | 'diccionario' | 'practica' | 'acerca' | 'general';

interface Paso {
  icono: string;
  titulo: string;
  desc: string;
}

@Component({
  selector: 'li-tutorial',
  standalone: true,
  imports: [CommonModule, AnunciarFocoDirective, TouchTargetDirective],
  template: `
    <!-- Botón flotante de ayuda -->
    <div class="tutorial-botones">
      <button
        class="tutorial-btn"
        (click)="abrir()"
        [liAnunciarFoco]="labelAyuda()"
        liTouchTarget
        [attr.aria-label]="labelAyuda()"
        [attr.aria-expanded]="abierto()"
      >
        <span aria-hidden="true">❓</span>
        <span class="tutorial-btn__texto">{{ labelAyuda() }}</span>
      </button>

      <!-- Botón para repetir tutorial de voz -->
      <button
        class="tutorial-btn tutorial-btn--voz"
        (click)="repetirBienvenida()"
        [liAnunciarFoco]="labelRepetir()"
        liTouchTarget
        [attr.aria-label]="labelRepetir()"
        [title]="labelRepetir()"
      >
        <span aria-hidden="true">🔊</span>
        <span class="tutorial-btn__texto">{{ labelRepetir() }}</span>
      </button>
    </div>

    <!-- Modal del tutorial -->
    @if (abierto()) {
      <div class="tutorial-overlay" (click)="cerrar()" aria-hidden="true"></div>

      <div
        class="tutorial-modal"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="pasos().titulo"
      >
        <!-- Cabecera -->
        <div class="tutorial-modal__header">
          <h2 class="tutorial-modal__titulo">
            <span aria-hidden="true">{{ pasos().icono }}</span>
            {{ pasos().titulo }}
          </h2>
          <button
            class="tutorial-modal__cerrar"
            (click)="cerrar()"
            [liAnunciarFoco]="labelCerrar()"
            liTouchTarget
            [attr.aria-label]="labelCerrar()"
          >✕</button>
        </div>

        <!-- Pasos -->
        <div class="tutorial-modal__pasos">
          @for (paso of pasos().pasos; track paso.titulo; let i = $index) {
            <div class="tutorial-paso" [class.tutorial-paso--activo]="pasoActual() === i">
              <div class="tutorial-paso__numero" aria-hidden="true">{{ i + 1 }}</div>
              <div class="tutorial-paso__contenido">
                <div class="tutorial-paso__icono" aria-hidden="true">{{ paso.icono }}</div>
                <div>
                  <h3 class="tutorial-paso__titulo">{{ paso.titulo }}</h3>
                  <p class="tutorial-paso__desc">{{ paso.desc }}</p>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Sección de teclado -->
        <div class="tutorial-teclado">
          <h3 class="tutorial-teclado__titulo">
            <span aria-hidden="true">⌨️</span> {{ labelTeclado() }}
          </h3>
          <div class="tutorial-teclado__atajos">
            @for (atajo of atajosTeclado(); track atajo.tecla) {
              <div class="atajo">
                <kbd class="atajo__tecla">{{ atajo.tecla }}</kbd>
                <span class="atajo__desc">{{ atajo.desc }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Footer -->
        <div class="tutorial-modal__footer">
          <button
            class="tutorial-modal__btn-cerrar"
            (click)="cerrar()"
            [liAnunciarFoco]="labelEntendido()"
            liTouchTarget
          >
            {{ labelEntendido() }} ✓
          </button>
        </div>
      </div>
    }
  `,
  styleUrls: ['./tutorial.component.scss'],
})
export class TutorialComponent {
  @Input() seccion: SeccionTutorial = 'general';

  readonly langService = inject(LanguageService);
  private readonly bienvenidaService = inject(BienvenidaService);
  readonly abierto = signal(false);
  readonly pasoActual = signal(0);

  readonly labelAyuda = computed(() => {
    const i = this.langService.idioma();
    return { es: 'Ayuda', qu: 'Yanapay', ay: 'Yanapt\'aña' }[i];
  });

  readonly labelRepetir = computed(() => {
    const i = this.langService.idioma();
    return { es: 'Repetir tutorial', qu: 'Watiq uyariy', ay: 'Janiw uyañataki' }[i];
  });

  readonly labelCerrar = computed(() => {
    const i = this.langService.idioma();
    return { es: 'Cerrar ayuda', qu: 'Wichʼuy', ay: 'Wichʼuña' }[i];
  });

  readonly labelEntendido = computed(() => {
    const i = this.langService.idioma();
    return { es: 'Entendido', qu: 'Yachaniñam', ay: 'Yatxatañataki' }[i];
  });

  readonly labelTeclado = computed(() => {
    const i = this.langService.idioma();
    return { es: 'Navegar con teclado', qu: 'Tecladowan puriykuy', ay: 'Tecladumpi puriña' }[i];
  });

  readonly atajosTeclado = computed(() => {
    const i = this.langService.idioma();
    const t = {
      es: [
        { tecla: 'Tab',       desc: 'Ir al siguiente elemento' },
        { tecla: 'Shift+Tab', desc: 'Ir al elemento anterior' },
        { tecla: 'Enter',     desc: 'Activar botón o enlace' },
        { tecla: 'Espacio',   desc: 'Activar botón' },
        { tecla: 'Esc',       desc: 'Cerrar ventana o menú' },
        { tecla: '←→',        desc: 'Navegar opciones del juego' },
      ],
      qu: [
        { tecla: 'Tab',       desc: 'Qhepa elementoman riy' },
        { tecla: 'Shift+Tab', desc: 'Ñawpaq elementoman riy' },
        { tecla: 'Enter',     desc: 'Botonwan enlaceta llamkachiy' },
        { tecla: 'Espacio',   desc: 'Botonta llamkachiy' },
        { tecla: 'Esc',       desc: 'Wichʼuy' },
        { tecla: '←→',        desc: 'Pukllaypi akllakuy' },
      ],
      ay: [
        { tecla: 'Tab',       desc: 'Qhipa elementaru saraña' },
        { tecla: 'Shift+Tab', desc: 'Nayraru elementaru saraña' },
        { tecla: 'Enter',     desc: 'Botón enlace lurañataki' },
        { tecla: 'Espacio',   desc: 'Botón lurañataki' },
        { tecla: 'Esc',       desc: 'Wichʼuña' },
        { tecla: '←→',        desc: 'Pukaraña akllañataki' },
      ],
    }[i];
    return t;
  });

  readonly pasos = computed(() => {
    const i = this.langService.idioma();
    const secciones: Record<SeccionTutorial, Record<string, any>> = {
      inicio: {
        es: {
          icono: '🏠', titulo: 'Bienvenido a Lingua-Inclusion',
          pasos: [
            { icono: '🌐', titulo: 'Cambia el idioma', desc: 'Usa los botones ES / QU / AY en la barra superior para cambiar entre Español, Quechua y Aymara. Todo cambia al instante.' },
            { icono: '👁️', titulo: 'Modos de accesibilidad', desc: 'Los íconos junto al idioma cambian el modo visual: estándar, alto contraste, solo audio o pictogramas.' },
            { icono: '📂', titulo: 'Explora categorías', desc: 'Toca una categoría (Salud, Familia, etc.) para ver todas sus palabras en el Diccionario.' },
            { icono: '🎮', titulo: 'Practica', desc: 'Ve a la sección Práctica para un juego tipo quiz que pone a prueba tu vocabulario.' },
            { icono: '⌨️', titulo: 'Usa el teclado', desc: 'Puedes navegar toda la app con Tab. Cada elemento que enfoques se anunciará en voz alta en el idioma activo.' },
          ],
        },
        qu: {
          icono: '🏠', titulo: 'Lingua-Inclusion Qallariy',
          pasos: [
            { icono: '🌐', titulo: 'Simita tikray', desc: 'ES / QU / AY botonkunata llamkachiy simita tikranapaq.' },
            { icono: '👁️', titulo: 'Rikuy tikray', desc: 'Ikonokunam rikuyta tikrachin: normal, contraste, audio, pictograma.' },
            { icono: '📂', titulo: 'Runakunata qhaway', desc: 'Huk runayta tiyay simikunata rikunapaq.' },
            { icono: '🎮', titulo: 'Pukllay', desc: 'Yachay Pukllay sectionman riy simikunata yachakunapaq.' },
            { icono: '⌨️', titulo: 'Tecladowan', desc: 'Tab teclakunawan llapan appita puriykuy atinki.' },
          ],
        },
        ay: {
          icono: '🏠', titulo: 'Lingua-Inclusion Qalltaña',
          pasos: [
            { icono: '🌐', titulo: 'Simiña tikraña', desc: 'ES / QU / AY botonnakampi simiña tikrañataki.' },
            { icono: '👁️', titulo: 'Uñt\'aña tikraña', desc: 'Ikonunaka uñt\'aña tikrañataki: normal, contraste, audio, pictograma.' },
            { icono: '📂', titulo: 'Runanaka uñt\'aña', desc: 'Huk runaña tiyaña siminaka uñt\'añataki.' },
            { icono: '🎮', titulo: 'Pukaraña', desc: 'Yatiqaña Pukaraña sectionaru saraña siminaka yatiqañataki.' },
            { icono: '⌨️', titulo: 'Tecladumpi', desc: 'Tab teclanakampi taqini appita puriña atañataki.' },
          ],
        },
      },
      diccionario: {
        es: {
          icono: '📖', titulo: 'Cómo usar el Diccionario',
          pasos: [
            { icono: '🔍', titulo: 'Busca en cualquier idioma', desc: 'Escribe una palabra en español, quechua o aymara. La búsqueda funciona en los 3 idiomas al mismo tiempo.' },
            { icono: '📂', titulo: 'Filtra por categoría', desc: 'Usa los botones de categoría (Salud, Familia, etc.) para ver solo las palabras de ese tema.' },
            { icono: '🔊', titulo: 'Escucha la pronunciación', desc: 'Toca el botón Audio en cada tarjeta para escuchar cómo se pronuncia la palabra.' },
            { icono: '▼', titulo: 'Ver más información', desc: 'Toca "Más" en una tarjeta para ver la traducción en los otros idiomas y un ejemplo de uso.' },
          ],
        },
        qu: {
          icono: '📖', titulo: 'Simikunap Qillqanta Imaynatan Llamkachiy',
          pasos: [
            { icono: '🔍', titulo: 'Imaymana simipi maskay', desc: 'Español, quechua, aymarapiwan simita qillqay. Kimsa simipi maskán.' },
            { icono: '📂', titulo: 'Runayta akllay', desc: 'Runayta botonkunata llamkachiy simikunata rikunapaq.' },
            { icono: '🔊', titulo: 'Uyariy', desc: 'Audio botonwan simita imaynatan niyta uyariy.' },
            { icono: '▼', titulo: 'Aswan qhaway', desc: '"Aswan" botonwan waq simikunapi traduccionkunata qhaway.' },
          ],
        },
        ay: {
          icono: '📖', titulo: 'Siminakana Qillqa Kunjamatisa Lurañataki',
          pasos: [
            { icono: '🔍', titulo: 'Imaymana simiru maskañataki', desc: 'Español, quechua, aymararu simiña qillqaña. Kimsa simiru maskañataki.' },
            { icono: '📂', titulo: 'Runaña akllaña', desc: 'Runaña botonnakampi siminaka uñt\'añataki.' },
            { icono: '🔊', titulo: 'Uyañataki', desc: 'Audio botónmpi simiña kunjamatisa siñañataki uyañataki.' },
            { icono: '▼', titulo: 'Aswa uñt\'aña', desc: '"Aswa" botónmpi waq simiru traducciónna uñt\'añataki.' },
          ],
        },
      },
      practica: {
        es: {
          icono: '🎮', titulo: 'Cómo jugar',
          pasos: [
            { icono: '📂', titulo: 'Elige una categoría', desc: 'Selecciona una categoría o juega con todas las palabras. Luego toca "Empezar juego".' },
            { icono: '❓', titulo: 'Responde la pregunta', desc: 'Verás una palabra, definición o pictograma. Elige la respuesta correcta entre 4 opciones.' },
            { icono: '🔥', titulo: 'Construye tu racha', desc: 'Responder seguido sin errores aumenta tu racha y te da puntos extra.' },
            { icono: '⭐', titulo: 'Gana puntos', desc: 'Cada respuesta correcta da 100 puntos. Responder rápido y mantener racha da puntos extra.' },
            { icono: '🏆', titulo: 'Ve tus resultados', desc: 'Al final de las 10 preguntas verás tu puntuación, porcentaje y racha máxima.' },
          ],
        },
        qu: {
          icono: '🎮', titulo: 'Imaynatan Pukllay',
          pasos: [
            { icono: '📂', titulo: 'Runayta akllay', desc: 'Huk runayta akllay o llapan simikunawan pukllay.' },
            { icono: '❓', titulo: 'Tapuyta kutichiy', desc: 'Simita, explicacionta o pictogramata rikuranki. Allin kutichita akllay.' },
            { icono: '🔥', titulo: 'Rachata wiñachiy', desc: 'Pantaykuspa mana rachata wiñachin puntoskunata yapan.' },
            { icono: '⭐', titulo: 'Puntosta chaskiy', desc: 'Allin kutichi 100 puntosta qon. Usqhay kutichispa aswan puntosta chaskiy.' },
            { icono: '🏆', titulo: 'Resultadota qhaway', desc: 'Chunka tapuymanta qhepam resultadoykita rikuranki.' },
          ],
        },
        ay: {
          icono: '🎮', titulo: 'Kunjamatisa Pukaraña',
          pasos: [
            { icono: '📂', titulo: 'Runaña akllaña', desc: 'Huk runaña akllaña o taqini siminakampi pukaraña.' },
            { icono: '❓', titulo: 'Tapuña kutichaña', desc: 'Simiña, explicaciónna o pictogramana uñt\'añataki. Alwa kutichaña akllaña.' },
            { icono: '🔥', titulo: 'Racha wiñayaña', desc: 'Pantañataki janiwa racha wiñayaña puntosna yapañataki.' },
            { icono: '⭐', titulo: 'Puntos chaskiña', desc: 'Alwa kutichaña 100 puntos churañataki. Usqharu kutichaña aswa puntos chaskiña.' },
            { icono: '🏆', titulo: 'Resultadona uñt\'aña', desc: 'Tunka tapuñamanta qhiparu resultadona uñt\'añataki.' },
          ],
        },
      },
      acerca: {
        es: {
          icono: 'ℹ️', titulo: 'Acerca de Lingua-Inclusion',
          pasos: [
            { icono: '🌍', titulo: 'ODS 10', desc: 'Esta app nace del Objetivo de Desarrollo Sostenible 10: Reducción de Desigualdades.' },
            { icono: '🗣️', titulo: '3 idiomas', desc: 'Español, Quechua y Aymara — las lenguas más habladas en los Andes peruanos.' },
            { icono: '♿', titulo: 'Accesibilidad total', desc: 'Diseñada para personas con baja visión, dificultad auditiva, analfabetismo digital o baja movilidad.' },
            { icono: '📶', titulo: 'Sin internet', desc: 'Funciona offline gracias a la tecnología PWA. Ideal para zonas rurales.' },
          ],
        },
        qu: {
          icono: 'ℹ️', titulo: 'Lingua-Inclusion Haqay',
          pasos: [
            { icono: '🌍', titulo: 'ODS 10', desc: 'Kay appim ODS 10manta paqarisqa.' },
            { icono: '🗣️', titulo: 'Kimsa simi', desc: 'Español, Quechua, Aymara — Andispi rimaq simikunam.' },
            { icono: '♿', titulo: 'Llapanpaq', desc: 'Mana allin rikuq, uyariq, qillqayta mana yachaqpaqpas.' },
            { icono: '📶', titulo: 'Internet sinchi', desc: 'Internet illasqanpipas llamkán.' },
          ],
        },
        ay: {
          icono: 'ℹ️', titulo: 'Lingua-Inclusion Tuqita',
          pasos: [
            { icono: '🌍', titulo: 'ODS 10', desc: 'Kay appiru ODS 10manta jutiri.' },
            { icono: '🗣️', titulo: 'Kimsa simi', desc: 'Español, Quechua, Aymara — Andina rimiri siminaka.' },
            { icono: '♿', titulo: 'Taqinitaki', desc: 'Janiwa alwa uñt\'iri, uyiri, qillqaña janiwa yatiri.' },
            { icono: '📶', titulo: 'Internet janiwa', desc: 'Internet janiwa kasina llamkañataki.' },
          ],
        },
      },
      general: {
        es: {
          icono: '❓', titulo: 'Ayuda general',
          pasos: [
            { icono: '🌐', titulo: 'Cambia el idioma', desc: 'Usa los botones ES / QU / AY para cambiar el idioma de toda la app.' },
            { icono: '⌨️', titulo: 'Navega con teclado', desc: 'Presiona Tab para moverte entre elementos. Cada uno se anuncia en voz alta.' },
            { icono: '🔊', titulo: 'Audio', desc: 'Cada palabra tiene un botón de audio para escuchar su pronunciación.' },
          ],
        },
        qu: {
          icono: '❓', titulo: 'Yanapay',
          pasos: [
            { icono: '🌐', titulo: 'Simita tikray', desc: 'ES / QU / AY botonkunata llamkachiy.' },
            { icono: '⌨️', titulo: 'Tecladowan', desc: 'Tab teclakunawan puriykuy atinki.' },
            { icono: '🔊', titulo: 'Audio', desc: 'Sapa simim audio botonwan uyariy atinki.' },
          ],
        },
        ay: {
          icono: '❓', titulo: 'Yanapt\'aña',
          pasos: [
            { icono: '🌐', titulo: 'Simiña tikraña', desc: 'ES / QU / AY botonnakampi.' },
            { icono: '⌨️', titulo: 'Tecladumpi', desc: 'Tab teclanakampi puriña atañataki.' },
            { icono: '🔊', titulo: 'Audio', desc: 'Sapa simiña audio botónmpi uyañataki.' },
          ],
        },
      },
    };

    const data = secciones[this.seccion]?.[i] ?? secciones['general'][i];
    return data;
  });

  abrir(): void  { this.abierto.set(true);  this.pasoActual.set(0); }
  cerrar(): void { this.abierto.set(false); }

  repetirBienvenida(): void {
    this.bienvenidaService.resetear();
    this.bienvenidaService.mostrarSelector();
  }
}
