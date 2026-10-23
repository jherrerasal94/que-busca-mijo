import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

interface SolicitudDestacado {
  id: string;
  publicacion_id: string;
  empresa_id: string;
  dias_solicitados: number;
  estado_solicitud: 'pendiente' | 'aprobado' | 'rechazado';
  fecha_solicitud: string;
  fecha_respuesta?: string;
  notas_admin?: string;
  publicaciones?: {
    servicio_producto: string;
    destacado_hasta?: string | null;
  };
  empresas?: {
    nombre: string;
    nit: string;
  };
}

@Component({
  selector: 'app-gestionar-destacados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-wrapper">
      <div class="header-section">
        <h1 class="page-title">⭐ Gestión de Destacados</h1>
        <p class="page-subtitle">Solicitudes de publicaciones destacadas (exclusivo planes Pro y Premium).</p>
      </div>

      <div class="filter-bar">
        <div class="filter-tabs">
          <button [class.active]="filtroEstado === 'todos'" (click)="filtroEstado = 'todos'">Todas</button>
          <button [class.active]="filtroEstado === 'pendiente'" (click)="filtroEstado = 'pendiente'">⏳ Pendientes</button>
          <button [class.active]="filtroEstado === 'aprobado'" (click)="filtroEstado = 'aprobado'">✅ Aprobadas</button>
          <button [class.active]="filtroEstado === 'rechazado'" (click)="filtroEstado = 'rechazado'">❌ Rechazadas</button>
        </div>
        <div class="search-box">
          <input type="text" [(ngModel)]="busqueda" placeholder="Buscar por empresa o publicación..." />
        </div>
      </div>

      @if (cargando) {
        <div class="loading-state">Cargando solicitudes...</div>
      } @else {
        <div class="table-container">
          <table class="excel-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Publicación</th>
                <th>Días solicitados</th>
                <th>Fecha solicitud</th>
                <th>Estado</th>
                <th>Destacada hasta</th>
                <th>Notas Admin</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (sol of solicitudesFiltradas; track sol.id) {
                <tr>
                  <td>
                    <div class="empresa-cell">
                      <strong>{{ sol.empresas?.nombre || 'Sin nombre' }}</strong>
                      <small>NIT: {{ sol.empresas?.nit || 'N/A' }}</small>
                    </div>
                  </td>
                  <td>{{ sol.publicaciones?.servicio_producto || 'Publicación eliminada' }}</td>
                  <td>{{ sol.dias_solicitados }} días</td>
                  <td>{{ sol.fecha_solicitud | date:'mediumDate' }}</td>
                  <td>
                    <span class="badge-estado" [ngClass]="'estado-' + sol.estado_solicitud">
                      @if (sol.estado_solicitud === 'pendiente') { ⏳ Pendiente }
                      @if (sol.estado_solicitud === 'aprobado') { ✅ Aprobado }
                      @if (sol.estado_solicitud === 'rechazado') { ❌ Rechazado }
                    </span>
                  </td>
                  <td>
                    @if (sol.publicaciones?.destacado_hasta) {
                      <span>{{ sol.publicaciones?.destacado_hasta | date:'mediumDate' }}</span>
                    } @else {
                      <span class="text-muted">- N/A -</span>
                    }
                  </td>
                  <td>
                    <input
                      type="text"
                      class="input-nota"
                      [(ngModel)]="sol.notas_admin"
                      (blur)="actualizarNotas(sol)"
                      placeholder="Escribir nota..." />
                  </td>
                  <td>
                    <div class="acciones-cell">
                      @if (sol.estado_solicitud === 'pendiente') {
                        <button class="btn-action btn-aprobar" (click)="gestionarSolicitud(sol, 'aprobado')">Aprobar</button>
                        <button class="btn-action btn-rechazar" (click)="gestionarSolicitud(sol, 'rechazado')">Rechazar</button>
                      } @else {
                        <span class="text-muted">Ya procesada</span>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="empty-row">No se encontraron solicitudes de destacado.</td>
                </tr>
              }
            </tbody>
          </table>
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
    .admin-wrapper { max-width: 1400px; margin: 30px auto; padding: 0 20px; }
    .header-section { margin-bottom: 20px; }
    .page-title { color: var(--primary); font-size: 1.8rem; font-weight: 900; margin: 0 0 4px 0; }
    .page-subtitle { color: #64748b; margin: 0; font-size: 0.95rem; }

    .filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 15px; flex-wrap: wrap; }
    .filter-tabs { display: flex; gap: 8px; }
    .filter-tabs button { background: #e2e8f0; border: none; padding: 6px 14px; border-radius: 999px; font-weight: 700; cursor: pointer; color: #475569; font-size: 0.85rem; }
    .filter-tabs button.active { background: var(--primary); color: var(--accent); }

    .search-box input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; width: 260px; }

    .loading-state { text-align: center; padding: 40px; color: #64748b; font-weight: 600; }

    .table-container { background: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; overflow-x: auto; }
    .excel-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; }
    .excel-table th { background: #f8fafc; color: var(--primary); font-weight: 800; padding: 12px 14px; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
    .excel-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .excel-table tr:hover { background: #fcfdfe; }

    .empresa-cell strong { display: block; color: var(--primary); }
    .empresa-cell small { color: #64748b; font-size: 0.78rem; }

    .badge-estado { padding: 4px 10px; border-radius: 99px; font-size: 0.78rem; font-weight: 800; display: inline-block; white-space: nowrap; }
    .estado-pendiente { background: #fef3c7; color: #b45309; }
    .estado-aprobado { background: #ecfdf5; color: #047857; }
    .estado-rechazado { background: #fee2e2; color: #b91c1c; }

    .text-muted { color: #94a3b8; font-size: 0.8rem; }

    .input-nota { width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.82rem; }
    .input-nota:focus { border-color: var(--primary); outline: none; }

    .acciones-cell { display: flex; gap: 6px; }
    .btn-action { padding: 6px 10px; border-radius: 6px; border: none; font-weight: 700; font-size: 0.78rem; cursor: pointer; }
    .btn-aprobar { background: #10b981; color: white; }
    .btn-rechazar { background: #ef4444; color: white; }
    .empty-row { text-align: center; color: #94a3b8; padding: 30px !important; }
  `]
})
export class GestionarDestacadosComponent implements OnInit {
  private authService = inject(AuthService);

  listaSolicitudes: SolicitudDestacado[] = [];
  cargando = true;
  filtroEstado = 'todos';
  busqueda = '';

  async ngOnInit() {
    await this.cargarSolicitudes();
  }

  async cargarSolicitudes() {
    this.cargando = true;
    const supabase = this.authService.getSupabaseClient();

    const { data, error } = await supabase
      .from('solicitudes_destacado')
      .select(`
        *,
        empresas (nombre, nit),
        publicaciones (servicio_producto, destacado_hasta)
      `)
      .order('fecha_solicitud', { ascending: false });

    if (error) {
      console.error('Error al cargar solicitudes de destacado:', error);
    } else {
      this.listaSolicitudes = (data as SolicitudDestacado[]) || [];
    }
    this.cargando = false;
  }

  get solicitudesFiltradas() {
    return this.listaSolicitudes.filter(sol => {
      const cumpleEstado = this.filtroEstado === 'todos' || sol.estado_solicitud === this.filtroEstado;
      const texto = this.busqueda.toLowerCase();
      const nombreEmpresa = sol.empresas?.nombre?.toLowerCase() || '';
      const nombrePub = sol.publicaciones?.servicio_producto?.toLowerCase() || '';
      const cumpleBusqueda = !this.busqueda || nombreEmpresa.includes(texto) || nombrePub.includes(texto);
      return cumpleEstado && cumpleBusqueda;
    });
  }

  async gestionarSolicitud(sol: SolicitudDestacado, nuevoEstado: 'aprobado' | 'rechazado') {
    const supabase = this.authService.getSupabaseClient();
    const fechaActual = new Date().toISOString();

    const { error } = await supabase
      .from('solicitudes_destacado')
      .update({
        estado_solicitud: nuevoEstado,
        fecha_respuesta: fechaActual,
        updated_at: fechaActual
      })
      .eq('id', sol.id);

    if (error) {
      console.error('Error al actualizar solicitud de destacado:', error);
      alert('Error al actualizar el estado de la solicitud.');
      return;
    }

    if (nuevoEstado === 'aprobado') {
      const fechaVencimiento = new Date(fechaActual);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + sol.dias_solicitados);

      const { error: errorPub } = await supabase
        .from('publicaciones')
        .update({ destacado_hasta: fechaVencimiento.toISOString() })
        .eq('id', sol.publicacion_id);

      if (errorPub) {
        console.error('Error al destacar la publicación:', errorPub);
        alert('La solicitud se marcó como aprobada, pero no se pudo destacar la publicación. Avisa a soporte técnico.');
        return;
      }
    }

    sol.estado_solicitud = nuevoEstado;
    sol.fecha_respuesta = fechaActual;
    this.listaSolicitudes = [...this.listaSolicitudes];
    alert(`La solicitud ha sido cambiada a: ${nuevoEstado.toUpperCase()}`);
    await this.cargarSolicitudes();
  }

  async actualizarNotas(sol: SolicitudDestacado) {
    const supabase = this.authService.getSupabaseClient();
    await supabase
      .from('solicitudes_destacado')
      .update({ notas_admin: sol.notas_admin, updated_at: new Date().toISOString() })
      .eq('id', sol.id);
  }
}