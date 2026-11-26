import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

export interface EventoAnalytics {
  id: string;
  tipo_evento: string;
  usuario_id: string | null;
  metadata: any;
  created_at: string;
}

interface ConteoTipo {
  tipo: string;
  total: number;
}

interface ConteoTexto {
  texto: string;
  total: number;
}

interface ConteoNombre {
  id: string;
  nombre: string;
  total: number;
}

const ETIQUETAS_TIPO: Record<string, string> = {
  busqueda: '🔎 Búsquedas',
  vista_producto: '📦 Vistas de producto',
  vista_empresa: '🏢 Vistas de empresa',
  clic_whatsapp: '💬 Clics en WhatsApp',
  registro: '📝 Registros',
  creacion_empresa: '🏪 Empresas creadas',
  creacion_publicacion: '📢 Publicaciones creadas',
  conversion_plan: '💳 Solicitudes de plan'
};

@Component({
  selector: 'app-gestionar-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-wrapper">
      <div class="header-section">
        <h1 class="page-title">📊 Analytics</h1>
        <p class="page-subtitle">Actividad registrada en la plataforma. Los datos se calculan sobre el rango de fechas seleccionado.</p>
      </div>

      <div class="filter-bar">
        <div class="filter-tabs">
          <button [class.active]="rangoDias === 7" (click)="cambiarRango(7)">Últimos 7 días</button>
          <button [class.active]="rangoDias === 30" (click)="cambiarRango(30)">Últimos 30 días</button>
          <button [class.active]="rangoDias === 90" (click)="cambiarRango(90)">Últimos 90 días</button>
          <button [class.active]="rangoDias === 0" (click)="cambiarRango(0)">Todo</button>
        </div>
      </div>

      @if (cargando) {
        <div class="loading-state">Calculando estadísticas...</div>
      } @else {

        <!-- TARJETAS RESUMEN -->
        <div class="stats-grid">
          @for (c of conteosPorTipo; track c.tipo) {
            <div class="stat-card">
              <span class="stat-value">{{ c.total }}</span>
              <span class="stat-label">{{ etiquetaTipo(c.tipo) }}</span>
            </div>
          } @empty {
            <div class="stat-card">
              <span class="stat-value">0</span>
              <span class="stat-label">Sin eventos en este rango</span>
            </div>
          }
        </div>

        <!-- GRÁFICO DE BARRAS SIMPLE -->
        @if (conteosPorTipo.length > 0) {
          <div class="panel">
            <h3>Eventos por tipo</h3>
            <div class="bar-chart">
              @for (c of conteosPorTipo; track c.tipo) {
                <div class="bar-row">
                  <span class="bar-label">{{ etiquetaTipo(c.tipo) }}</span>
                  <div class="bar-track">
                    <div class="bar-fill" [style.width.%]="(c.total / maxConteoTipo) * 100"></div>
                  </div>
                  <span class="bar-count">{{ c.total }}</span>
                </div>
              }
            </div>
          </div>
        }

        <div class="panel-grid">
          <!-- TOP BÚSQUEDAS -->
          <div class="panel">
            <h3>🔎 Búsquedas más frecuentes</h3>
            @if (topBusquedas.length === 0) {
              <p class="empty-msg">Sin búsquedas registradas en este rango.</p>
            } @else {
              <table class="mini-table">
                <tbody>
                  @for (b of topBusquedas; track b.texto) {
                    <tr>
                      <td>"{{ b.texto }}"</td>
                      <td class="col-total">{{ b.total }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>

          <!-- TOP PRODUCTOS -->
          <div class="panel">
            <h3>📦 Productos más vistos</h3>
            @if (topProductos.length === 0) {
              <p class="empty-msg">Sin vistas de producto en este rango.</p>
            } @else {
              <table class="mini-table">
                <tbody>
                  @for (p of topProductos; track p.id) {
                    <tr>
                      <td>{{ p.nombre }}</td>
                      <td class="col-total">{{ p.total }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>

          <!-- TOP EMPRESAS -->
          <div class="panel">
            <h3>🏢 Negocios más vistos</h3>
            @if (topEmpresas.length === 0) {
              <p class="empty-msg">Sin vistas de negocio en este rango.</p>
            } @else {
              <table class="mini-table">
                <tbody>
                  @for (e of topEmpresas; track e.id) {
                    <tr>
                      <td>{{ e.nombre }}</td>
                      <td class="col-total">{{ e.total }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>

        <!-- EVENTOS RECIENTES (CRUDO) -->
        <div class="panel">
          <h3>Eventos recientes</h3>
          <div class="table-container">
            <table class="excel-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Usuario</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                @for (ev of eventos.slice(0, 50); track ev.id) {
                  <tr>
                    <td>{{ ev.created_at | date:'medium' }}</td>
                    <td><span class="badge-tipo">{{ etiquetaTipo(ev.tipo_evento) }}</span></td>
                    <td>{{ ev.usuario_id ? (ev.usuario_id | slice:0:8) + '…' : 'Anónimo' }}</td>
                    <td class="col-metadata">{{ ev.metadata | json }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="empty-row">No hay eventos en este rango.</td></tr>
                }
              </tbody>
            </table>
          </div>
          @if (eventos.length > 50) {
            <p class="nota-limite">Mostrando los 50 más recientes de {{ eventos.length }} eventos en este rango.</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      --primary: #002b66;
      --accent: #64d500;
      font-family: 'Segoe UI', Roboto, sans-serif;
    }
    .admin-wrapper { max-width: 1400px; margin: 30px auto; padding: 0 20px 60px; }
    .header-section { margin-bottom: 20px; }
    .page-title { color: var(--primary); font-size: 1.8rem; font-weight: 900; margin: 0 0 4px 0; }
    .page-subtitle { color: #64748b; margin: 0; font-size: 0.95rem; }

    .filter-bar { margin-bottom: 20px; }
    .filter-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-tabs button { background: #e2e8f0; border: none; padding: 8px 16px; border-radius: 999px; font-weight: 700; cursor: pointer; color: #475569; font-size: 0.85rem; }
    .filter-tabs button.active { background: var(--primary); color: var(--accent); }

    .loading-state { text-align: center; padding: 40px; color: #64748b; font-weight: 600; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
    .stat-value { font-size: 1.6rem; font-weight: 900; color: var(--primary); }
    .stat-label { font-size: 0.78rem; color: #64748b; font-weight: 700; }

    .panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .panel h3 { margin: 0 0 14px 0; color: var(--primary); font-size: 1rem; }

    .panel-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
    .panel-grid .panel { margin-bottom: 0; }

    .bar-chart { display: flex; flex-direction: column; gap: 10px; }
    .bar-row { display: grid; grid-template-columns: 180px 1fr 50px; align-items: center; gap: 10px; }
    .bar-label { font-size: 0.82rem; color: #334155; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bar-track { background: #f1f5f9; border-radius: 999px; height: 14px; overflow: hidden; }
    .bar-fill { background: var(--accent); height: 100%; border-radius: 999px; transition: width 0.3s ease; }
    .bar-count { font-size: 0.82rem; font-weight: 800; color: var(--primary); text-align: right; }

    .mini-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .mini-table td { padding: 8px 4px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .mini-table td.col-total { text-align: right; font-weight: 800; color: var(--primary); width: 50px; }
    .empty-msg { color: #94a3b8; font-size: 0.85rem; margin: 0; }

    .table-container { overflow-x: auto; }
    .excel-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
    .excel-table th { background: #f8fafc; color: var(--primary); font-weight: 800; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
    .excel-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .badge-tipo { background: #eff6ff; color: #1e3a8a; font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; white-space: nowrap; }
    .col-metadata { font-family: monospace; font-size: 0.75rem; color: #64748b; max-width: 400px; word-break: break-all; }
    .empty-row { text-align: center; color: #94a3b8; padding: 24px !important; }
    .nota-limite { color: #94a3b8; font-size: 0.78rem; margin: 10px 0 0 0; }
  `]
})
export class GestionarAnalyticsComponent implements OnInit {
  private authService = inject(AuthService);

  eventos: EventoAnalytics[] = [];
  cargando = true;
  rangoDias = 30;

  conteosPorTipo: ConteoTipo[] = [];
  topBusquedas: ConteoTexto[] = [];
  topProductos: ConteoNombre[] = [];
  topEmpresas: ConteoNombre[] = [];

  async ngOnInit() {
    await this.cargarEventos();
  }

  async cambiarRango(dias: number) {
    this.rangoDias = dias;
    await this.cargarEventos();
  }

  etiquetaTipo(tipo: string): string {
    return ETIQUETAS_TIPO[tipo] || tipo;
  }

  get maxConteoTipo(): number {
    return Math.max(1, ...this.conteosPorTipo.map(c => c.total));
  }

  async cargarEventos() {
    this.cargando = true;

    let query = this.authService.getSupabaseClient()
      .from('eventos_analytics')
      .select('id, tipo_evento, usuario_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(5000); // tope razonable para que el cálculo en el navegador no se vuelva pesado

    if (this.rangoDias > 0) {
      const desde = new Date();
      desde.setDate(desde.getDate() - this.rangoDias);
      query = query.gte('created_at', desde.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al cargar eventos de analytics:', error);
      this.eventos = [];
    } else {
      this.eventos = (data as EventoAnalytics[]) || [];
    }

    await this.calcularAgregados();
    this.cargando = false;
  }

  private async calcularAgregados() {
    const mapaTipos = new Map<string, number>();
    for (const ev of this.eventos) {
      mapaTipos.set(ev.tipo_evento, (mapaTipos.get(ev.tipo_evento) || 0) + 1);
    }
    this.conteosPorTipo = Array.from(mapaTipos.entries())
      .map(([tipo, total]) => ({ tipo, total }))
      .sort((a, b) => b.total - a.total);

    const mapaBusquedas = new Map<string, number>();
    for (const ev of this.eventos) {
      if (ev.tipo_evento === 'busqueda' && ev.metadata?.query) {
        const texto = String(ev.metadata.query).toLowerCase().trim();
        if (texto) mapaBusquedas.set(texto, (mapaBusquedas.get(texto) || 0) + 1);
      }
    }
    this.topBusquedas = Array.from(mapaBusquedas.entries())
      .map(([texto, total]) => ({ texto, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const mapaProductos = new Map<string, number>();
    for (const ev of this.eventos) {
      if (ev.tipo_evento === 'vista_producto' && ev.metadata?.publicacionId) {
        const id = ev.metadata.publicacionId;
        mapaProductos.set(id, (mapaProductos.get(id) || 0) + 1);
      }
    }
    const topProductosIds = Array.from(mapaProductos.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    this.topProductos = await this.resolverNombres('publicaciones', 'servicio_producto', topProductosIds, 'Publicación eliminada');

    const mapaEmpresas = new Map<string, number>();
    for (const ev of this.eventos) {
      if (ev.tipo_evento === 'vista_empresa' && ev.metadata?.empresaId) {
        const id = ev.metadata.empresaId;
        mapaEmpresas.set(id, (mapaEmpresas.get(id) || 0) + 1);
      }
    }
    const topEmpresasIds = Array.from(mapaEmpresas.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    this.topEmpresas = await this.resolverNombres('empresas', 'nombre', topEmpresasIds, 'Negocio eliminado');
  }

  // Los eventos solo guardan IDs en metadata (para no duplicar datos que
  // cambian, como el nombre de una publicación tras una edición) -- se
  // resuelven a nombre legible aquí, con una sola consulta por top-10.
  private async resolverNombres(
    tabla: 'publicaciones' | 'empresas',
    columnaNombre: string,
    idsConConteo: [string, number][],
    etiquetaSiNoExiste: string
  ): Promise<ConteoNombre[]> {
    if (idsConConteo.length === 0) return [];

    const ids = idsConConteo.map(([id]) => id);
    const { data } = await this.authService.getSupabaseClient()
      .from(tabla)
      .select(`id, ${columnaNombre}`)
      .in('id', ids);

    const nombres = new Map((data || []).map((fila: any) => [fila.id, fila[columnaNombre]]));

    return idsConConteo.map(([id, total]) => ({
      id,
      nombre: nombres.get(id) || etiquetaSiNoExiste,
      total
    }));
  }
}
