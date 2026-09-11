import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

interface SolicitudPlan {
  id: string;
  empresa_id: string;
  plan_solicitado_id: string;
  estado_solicitud: 'pendiente' | 'aprobado' | 'rechazado';
  fecha_solicitud: string;
  fecha_respuesta?: string;
  notas_admin?: string;
  empresas?: {
    nombre: string;
    nit: string;
    correo_empresarial?: string;
  };
  planes?: {
    nombre: string;
    costo: number;
  };
}

@Component({
  selector: 'app-gestionar-planes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-wrapper">
      <div class="header-section">
        <h1 class="page-title">📊 Gestión de Solicitudes y Membresías (Tabla)</h1>
        <p class="page-subtitle">Panel optimizado tipo Excel para controlar el ciclo de vida de los planes corporativos.</p>
      </div>

      <!-- Filtros de Estado -->
      <div class="filter-bar">
        <div class="filter-tabs">
          <button [class.active]="filtroEstado === 'todos'" (click)="filtroEstado = 'todos'">Todas</button>
          <button [class.active]="filtroEstado === 'pendiente'" (click)="filtroEstado = 'pendiente'">⏳ Pendientes</button>
          <button [class.active]="filtroEstado === 'aprobado'" (click)="filtroEstado = 'aprobado'">✅ Aprobadas</button>
          <button [class.active]="filtroEstado === 'rechazado'" (click)="filtroEstado = 'rechazado'">❌ Rechazadas</button>
        </div>
        <div class="search-box">
          <input type="text" [(ngModel)]="busqueda" placeholder="Buscar por empresa o NIT..." />
        </div>
      </div>

      @if (cargando) {
        <div class="loading-state">Cargando registros...</div>
      } @else {
        <div class="table-container">
          <table class="excel-table">
            <thead>
              <tr>
                <th>Empresa / NIT</th>
                <th>Plan Solicitado</th>
                <th>Fecha Solicitud</th>
                <th>Estado Actual</th>
                <th>Vencimiento Membresía (1 Mes)</th>
                <th>Notas Admin</th>
                <th>Acciones / Gestión</th>
              </tr>
            </thead>
            <tbody>
              @for (sol of solicitudesFiltradas; track sol.id) {
                <tr>
                  <!-- Empresa y NIT -->
                  <td>
                    <div class="empresa-cell">
                      <strong>{{ sol.empresas?.nombre || 'Sin nombre' }}</strong>
                      <small>NIT: {{ sol.empresas?.nit || 'N/A' }}</small>
                    </div>
                  </td>

                  <!-- Plan -->
                  <td>
                    <span class="plan-tag">{{ sol.planes?.nombre || 'Plan desconocido' }}</span>
                    <div class="costo-txt">$ {{ sol.planes?.costo | number:'1.0-2' }}</div>
                  </td>

                  <!-- Fechas -->
                  <td>{{ sol.fecha_solicitud | date:'mediumDate' }}</td>

                  <!-- Estado (Semáforo) -->
                  <td>
                    <span class="badge-estado" [ngClass]="'estado-' + sol.estado_solicitud">
                      @if (sol.estado_solicitud === 'pendiente') { ⏳ Pendiente }
                      @if (sol.estado_solicitud === 'aprobado') { ✅ Aprobado }
                      @if (sol.estado_solicitud === 'rechazado') { ❌ Rechazado }
                    </span>
                  </td>

                  <!-- Vencimiento Membresía -->
                  <td>
                    @if (sol.estado_solicitud === 'aprobado' && sol.fecha_respuesta) {
                      <div class="vencimiento-pill" [ngClass]="getAlertaVencimiento(sol.fecha_respuesta).clase">
                        {{ getAlertaVencimiento(sol.fecha_respuesta).texto }}
                      </div>
                    } @else {
                      <span class="text-muted">- N/A -</span>
                    }
                  </td>

                  <!-- Notas Admin -->
                  <td>
                    <input 
                      type="text" 
                      class="input-nota" 
                      [(ngModel)]="sol.notas_admin" 
                      (blur)="actualizarNotas(sol)" 
                      placeholder="Escribir nota..." />
                  </td>

                  <!-- Acciones (Aprobar / Rechazar) -->
                  <td>
                    <div class="acciones-cell">
                      @if (sol.estado_solicitud === 'pendiente') {
                        <button class="btn-action btn-aprobar" (click)="gestionarSolicitud(sol, 'aprobado')">Aprobar</button>
                        <button class="btn-action btn-rechazar" (click)="gestionarSolicitud(sol, 'rechazado')">Rechazar</button>
                      } @else if (sol.estado_solicitud === 'aprobado') {
                        <button class="btn-action btn-rechazar" (click)="gestionarSolicitud(sol, 'rechazado')">Rechazar Plan</button>
                      } @else {
                        <button class="btn-action btn-aprobar" (click)="gestionarSolicitud(sol, 'aprobado')">Re-aprobar</button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="empty-row">No se encontraron solicitudes registradas.</td>
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

    /* Estilo Tabla Excel */
    .table-container { background: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; overflow-x: auto; }
    .excel-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; }
    .excel-table th { background: #f8fafc; color: var(--primary); font-weight: 800; padding: 12px 14px; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
    .excel-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .excel-table tr:hover { background: #fcfdfe; }

    .empresa-cell strong { display: block; color: var(--primary); }
    .empresa-cell small { color: #64748b; font-size: 0.78rem; }
    .plan-tag { font-weight: 700; color: #334155; }
    .costo-txt { font-size: 0.78rem; color: #059669; font-weight: 600; }

    /* Estados Badges */
    .badge-estado { padding: 4px 10px; border-radius: 99px; font-size: 0.78rem; font-weight: 800; display: inline-block; white-space: nowrap; }
    .estado-pendiente { background: #fef3c7; color: #b45309; }
    .estado-aprobado { background: #ecfdf5; color: #047857; }
    .estado-rechazado { background: #fee2e2; color: #b91c1c; }

    /* Vencimiento Pestañas */
    .vencimiento-pill { font-size: 0.78rem; font-weight: 700; padding: 4px 8px; border-radius: 6px; }
    .vigente { background: #f0fdf4; color: #16a34a; }
    .por-vencer { background: #fffbeb; color: #d97706; }
    .vencida { background: #fef2f2; color: #dc2626; }
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
export class GestionarPlanesComponent implements OnInit {
  private authService = inject(AuthService);

  listaSolicitudes: SolicitudPlan[] = [];
  cargando = true;
  filtroEstado: string = 'todos';
  busqueda: string = '';

  async ngOnInit() {
    await this.cargarSolicitudes();
  }

  async cargarSolicitudes() {
    this.cargando = true;
    const supabase = this.authService.getSupabaseClient();
    
    const { data, error } = await supabase
      .from('solicitudes_plan')
      .select(`
        *,
        empresas (nombre, nit, correo_empresarial),
        planes (nombre, costo)
      `)
      .order('fecha_solicitud', { ascending: false });

    if (error) {
      console.error('Error al cargar solicitudes:', error);
    } else {
      this.listaSolicitudes = (data as SolicitudPlan[]) || [];
    }
    this.cargando = false;
  }

  get solicitudesFiltradas() {
    return this.listaSolicitudes.filter(sol => {
      const cumpleEstado = this.filtroEstado === 'todos' || sol.estado_solicitud === this.filtroEstado;
      const textoBusqueda = this.busqueda.toLowerCase();
      const nombreEmpresa = sol.empresas?.nombre?.toLowerCase() || '';
      const nitEmpresa = sol.empresas?.nit?.toLowerCase() || '';
      const cumpleBusqueda = !this.busqueda || nombreEmpresa.includes(textoBusqueda) || nitEmpresa.includes(textoBusqueda);
      return cumpleEstado && cumpleBusqueda;
    });
  }

  getAlertaVencimiento(fechaRespuestaStr: string) {
    const fechaRespuesta = new Date(fechaRespuestaStr);
    const fechaVencimiento = new Date(fechaRespuesta);
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1); // Membresía de 1 mes exacto

    const hoy = new Date();
    const diferenciaMs = fechaVencimiento.getTime() - hoy.getTime();
    const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return { texto: `⚠️ Vencida hace ${Math.abs(diasRestantes)} días`, clase: 'vencida', diasRestantes };
    } else if (diasRestantes <= 5) {
      return { texto: `⚡ Por vencer (${diasRestantes} días)`, clase: 'por-vencer', diasRestantes };
    } else {
      return { texto: `✅ Vigente (Quedan ${diasRestantes} días)`, clase: 'vigente', diasRestantes };
    }
  }

  async gestionarSolicitud(sol: SolicitudPlan, nuevoEstado: 'aprobado' | 'rechazado') {
    // REQUISITO: Si ya estaba aprobada y se intenta rechazar, validamos si la membresía de 1 mes sigue vigente
    if (sol.estado_solicitud === 'aprobado' && nuevoEstado === 'rechazado' && sol.fecha_respuesta) {
      const infoVencimiento = this.getAlertaVencimiento(sol.fecha_respuesta);
      
      if (infoVencimiento.diasRestantes >= 0) {
        const confirmar = window.confirm(
          `⚠️ ATENCIÓN: Esta membresía todavía NO ha vencido (le quedan ${infoVencimiento.diasRestantes} días de vigencia).\n\n¿Está seguro de que desea rechazar este plan activo?`
        );
        if (!confirmar) return; // Cancela la acción si el admin se arrepiente
      }
    }

    const supabase = this.authService.getSupabaseClient();
    const fechaActual = new Date().toISOString();

    const { error } = await supabase
      .from('solicitudes_plan')
      .update({
        estado_solicitud: nuevoEstado,
        fecha_respuesta: fechaActual,
        updated_at: fechaActual
      })
      .eq('id', sol.id);

    if (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar el estado de la solicitud.');
    } else {
      sol.estado_solicitud = nuevoEstado;
      sol.fecha_respuesta = fechaActual;
      this.listaSolicitudes = [...this.listaSolicitudes];
      alert(`La solicitud ha sido cambiada a: ${nuevoEstado.toUpperCase()}`);
    }
  }

  async actualizarNotas(sol: SolicitudPlan) {
    const supabase = this.authService.getSupabaseClient();
    await supabase
      .from('solicitudes_plan')
      .update({ notas_admin: sol.notas_admin, updated_at: new Date().toISOString() })
      .eq('id', sol.id);
  }
}