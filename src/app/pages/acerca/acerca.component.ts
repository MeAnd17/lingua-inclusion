import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';

import { TutorialComponent } from '../../components/tutorial/tutorial.component';

@Component({
  selector: 'li-acerca',
  standalone: true,
  imports: [CommonModule, TutorialComponent],
  template: `
    <main id="contenido-principal" class="pagina-acerca contenedor">
      <article class="acerca-contenido">
        <div class="acerca-header">
          <h1>{{ textos().titulo }}</h1>
        </div>

        <section aria-labelledby="mision-titulo">
          <h2 id="mision-titulo">{{ textos().misionTitulo }}</h2>
          <p>{{ textos().misionDesc }}</p>
        </section>

        <section aria-labelledby="ods-titulo">
          <h2 id="ods-titulo">🎯 ODS 10</h2>
          <p>{{ textos().odsDesc }}</p>
        </section>

        <section aria-labelledby="idiomas-titulo">
          <h2 id="idiomas-titulo">{{ textos().idiomasTitulo }}</h2>
          <ul role="list">
            <li role="listitem">🇵🇪 <strong>Español</strong> — Idioma oficial del Perú</li>
            <li role="listitem">🏔️ <strong>Quechua (Runasimi)</strong> — Lengua originaria andina</li>
            <li role="listitem">🌄 <strong>Aymara</strong> — Lengua originaria del altiplano</li>
          </ul>
        </section>

        <section aria-labelledby="accesibilidad-titulo">
          <h2 id="accesibilidad-titulo">{{ textos().accesibilidadTitulo }}</h2>
          <ul role="list">
            <li role="listitem">✅ WCAG 2.1 Nivel AA</li>
            <li role="listitem">🔊 Síntesis de voz (TTS) y audio pregrabado</li>
            <li role="listitem">◑ Modo alto contraste</li>
            <li role="listitem">🖼️ Modo pictogramas para analfabetismo digital</li>
            <li role="listitem">📶 Funciona sin conexión (PWA)</li>
          </ul>
        </section>

        <section aria-labelledby="version-titulo">
          <h2 id="version-titulo">Versión</h2>
          <p>Lingua-Inclusion v1.0.0 — Angular 17 + PWA</p>
          <p>Desarrollado con ❤️ para reducir la brecha de información.</p>
        </section>
      </article>
    </main>
    <li-tutorial seccion="acerca" />
  `,
  styleUrls: ['./acerca.component.scss'],
})
export class AcercaComponent {
  readonly langService = inject(LanguageService);

  readonly textos = computed(() => {
    const idioma = this.langService.idioma();
    const mapa = {
      es: {
        titulo: 'Acerca de Lingua-Inclusion',
        misionTitulo: 'Nuestra misión',
        misionDesc: 'Lingua-Inclusion es una plataforma de accesibilidad lingüística que busca reducir la brecha de información para hablantes de lenguas originarias y personas con discapacidades sensoriales o analfabetismo digital, alineada con el ODS 10 de Reducción de Desigualdades.',
        odsDesc: 'El Objetivo de Desarrollo Sostenible 10 busca reducir la desigualdad dentro y entre los países. Lingua-Inclusion contribuye garantizando acceso equitativo a la información en lenguas originarias del Perú.',
        idiomasTitulo: 'Idiomas soportados',
        accesibilidadTitulo: 'Características de accesibilidad',
      },
      qu: {
        titulo: 'Lingua-Inclusion haqay',
        misionTitulo: 'Imanapaqmi kanchik',
        misionDesc: 'Lingua-Inclusion runasimi rimaqkunapaq, uyariy atiqkunapaq, qillqayta mana yachaqkunapaqpas yachaykunata qonapaq rurasqa.',
        odsDesc: 'ODS 10 llapan runakuna kikin atiyninkunata charinankupaq llamkan.',
        idiomasTitulo: 'Simikunam',
        accesibilidadTitulo: 'Yanapay ruwaykuna',
      },
      ay: {
        titulo: 'Lingua-Inclusion tuqita',
        misionTitulo: 'Kunjamatisa luraña',
        misionDesc: 'Lingua-Inclusion aymara, quechua simirinaka rimirinakataki, uyañ janiwa atirinakataki, qillqaña yatiqañataki yatiyañanaka churañataki.',
        odsDesc: 'ODS 10 taqini jaqi kikin atipañanaka charaña munañataki.',
        idiomasTitulo: 'Siminaka',
        accesibilidadTitulo: 'Yanapt\'añataki lurawinaka',
      },
    };
    return mapa[idioma];
  });
}
