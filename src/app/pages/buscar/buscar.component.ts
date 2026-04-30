import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BuscadorComponent } from '../../components/buscador/buscador.component';
import { BusquedaService } from '../../services/busqueda.service';
import { Categoria } from '../../models/palabra.model';

@Component({
  selector: 'li-buscar',
  standalone: true,
  imports: [CommonModule, BuscadorComponent],
  template: `
    <main id="contenido-principal" class="pagina-buscar">
      <li-buscador />
    </main>
  `,
  styles: [`
    .pagina-buscar {
      min-height: calc(100vh - 120px);
    }
  `],
})
export class BuscarComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly busquedaService = inject(BusquedaService);

  ngOnInit(): void {
    // Leer parámetros de query para pre-filtrar por categoría
    this.route.queryParams.subscribe((params) => {
      if (params['categoria']) {
        this.busquedaService.setCategoria(params['categoria'] as Categoria);
      }
      if (params['q']) {
        this.busquedaService.setQuery(params['q']);
      }
    });
  }
}
