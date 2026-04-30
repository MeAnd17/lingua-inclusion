import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { BienvenidaComponent } from './components/bienvenida/bienvenida.component';
import { LanguageService } from './services/language.service';
import { TecladoNavService } from './services/teclado-nav.service';
import { BienvenidaService } from './services/bienvenida.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent, BienvenidaComponent],
  template: `
    <!-- Enlace de salto para accesibilidad -->
    <a href="#contenido-principal" class="skip-link">
      Saltar al contenido principal
    </a>

    <div class="app-layout">
      <li-header />

      <div class="app-contenido" role="main">
        <router-outlet />
      </div>

      <!-- Banner de bienvenida en voz -->
      <li-bienvenida />

      <footer class="app-footer" role="contentinfo">
        <div class="contenedor">
          <p class="footer__marca">
            <span aria-hidden="true">🌐</span> Lingua-Inclusion
          </p>
          <p class="footer__idioma">
            🗣️ <strong>{{ langService.labelIdioma() }}</strong>
          </p>
          <p class="footer__copy">© 2024 · ODS 10</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-footer {
      background: linear-gradient(135deg, #1A1D2E 0%, #2D3561 100%);
      color: rgba(255,255,255,0.7);
      padding: 24px 0;
      text-align: center;
      font-size: 0.85rem;
      margin-top: auto;

      .contenedor {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
      }

      p { margin: 0; }

      .footer__marca {
        font-family: 'Nunito', sans-serif;
        font-weight: 800;
        font-size: 1rem;
        color: white;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .footer__idioma {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 999px;
        padding: 4px 14px;
        font-size: 0.8rem;
        strong { color: white; }
      }

      .footer__copy {
        opacity: 0.55;
        font-size: 0.78rem;
      }
    }
  `],
})
export class AppComponent implements OnInit {
  readonly langService = inject(LanguageService);
  private readonly tecladoNav = inject(TecladoNavService);
  private readonly bienvenida = inject(BienvenidaService);

  ngOnInit(): void {
    this.tecladoNav.inicializar();
    // Reproducir tutorial de bienvenida en voz si es la primera visita
    this.bienvenida.reproducirSiEsPrimeraVez();
  }
}
