import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface EmpresaAdmin {
  id: string;
  nombre: string;
  correo_empresarial?: string;
  correo_registro: string;
  rep_telefono?: string;
  plan_valido_hasta?: string;
  estado: string;
  created_at: string;
  ciudad?: { nombre: string };
}

@Component({
  selector: 'app-admin-empresas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-wrapper">
      <div class="header-section">
        <div>
          <h1 class="page-title">🏢 Directorio y Control de Empresas</h1>
          <p class="page-subtitle">Panel optimizado tipo Excel para supervisar las empresas registradas y el estado de sus planes.</p>
        </div>
        <button class="btn-excel" (click)="exportarExcel()">
          📊 Exportar a Excel (CSV)
        </button>
      </div>

      <!-- Filtros de Búsqueda -->
      <div class="filter-bar">
        <div class="search-box">
          <input type="text" [(ngModel)]="busqueda" placeholder="Buscar por nombre o correo..." />
        </div>
      </div>

      @if (cargando) {
        <div class="loading-state">Cargando registros de empresas...</div>
      } @else {
        <div class="table-container">
          <table class="excel-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Ciudad</th>
                <th>Vencimiento Plan</th>
                <th>Estado Registro</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (emp of empresasFiltradas; track emp.id) {
                <tr>
                  <!-- Nombre -->
                  <td>
                    <div class="empresa-cell">
                      <strong>{{ emp.nombre || 'Sin nombre' }}</strong>
                      <small>ID: {{ emp.id.substring(0, 8) }}...</small>
                    </div>
                  </td>

                  <!-- Contacto -->
                  <td>
                    <div class="contact-cell">
                      <span>✉️ {{ emp.correo_empresarial || emp.correo_registro || 'Sin correo' }}</span>
                      <span>📞 {{ emp.rep_telefono || 'Sin teléfono' }}</span>
                    </div>
                  </td>

                  <!-- Ciudad -->
                  <td>📍 {{ emp.ciudad?.nombre || 'General' }}</td>

                  <!-- Plan Válido Hasta -->
                  <td>
                    <span class="plan-tag">
                      {{ emp.plan_valido_hasta ? (emp.plan_valido_hasta | date:'mediumDate') : 'Sin plan activo' }}
                    </span>
                  </td>

                  <!-- Estado -->
                  <td>
                    <span class="badge-estado">
                      {{ emp.estado || 'Activo' }}
                    </span>
                  </td>

                  <!-- Fecha Registro -->
                  <td>{{ emp.created_at | date:'mediumDate' }}</td>

                  <!-- Acciones -->
                  <td>
                    <div class="acciones-cell">
                      <a [routerLink]="['/empresa', emp.id]" class="btn-action btn-ver" target="_blank" title="Ver perfil">👁️ Ver</a>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="empty-row">No se encontraron empresas registradas.</td>
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
    .header-section { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 15px; }
    .page-title { color: var(--primary); font-size: 1.8rem; font-weight: 900; margin: 0 0 4px 0; }
    .page-subtitle { color: #64748b; margin: 0; font-size: 0.95rem; }

    .btn-excel {
      background: #107c41; color: #fff; border: none; padding: 10px 18px;
      border-radius: 10px; font-weight: 800; cursor: pointer; display: flex;
      align-items: center; gap: 8px; font-size: 0.88rem; box-shadow: 0 4px 12px rgba(16, 124, 65, 0.2);
    }
    .btn-excel:hover { opacity: 0.9; }

    .filter-bar { display: flex; justify-content: flex-end; align-items: center; margin-bottom: 20px; gap: 15px; flex-wrap: wrap; }
    .search-box input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; width: 280px; outline: none; }
    .search-box input:focus { border-color: var(--primary); }

    .loading-state { text-align: center; padding: 40px; color: #64748b; font-weight: 600; }

    /* Estilo Tabla Excel */
    .table-container { background: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; overflow-x: auto; }
    .excel-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; }
    .excel-table th { background: #f8fafc; color: var(--primary); font-weight: 800; padding: 12px 14px; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
    .excel-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .excel-table tr:hover { background: #fcfdfe; }

    .empresa-cell strong { display: block; color: var(--primary); }
    .empresa-cell small { color: #64748b; font-size: 0.78rem; }
    .contact-cell { display: flex; flex-direction: column; gap: 2px; font-size: 0.83rem; color: #475569; }
    .plan-tag { font-weight: 700; color: #0369a1; background: #e0f2fe; padding: 3px 8px; border-radius: 6px; font-size: 0.78rem; }

    /* Estados Badges */
    .badge-estado { padding: 4px 10px; border-radius: 99px; font-size: 0.78rem; font-weight: 800; display: inline-block; white-space: nowrap; background: #ecfdf5; color: #047857; }

    .acciones-cell { display: flex; gap: 8px; align-items: center; }
    .btn-action { padding: 5px 10px; border-radius: 6px; border: none; font-weight: 700; font-size: 0.78rem; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .btn-ver { background: #eff8e6; color: #388e3c; }
    .btn-ver:hover { background: #e2ebd8; }

    .empty-row { text-align: center; color: #94a3b8; padding: 30px !important; }
  `]
})
export class AdminEmpresasComponent implements OnInit {
  private authService = inject(AuthService);

  listaEmpresas: EmpresaAdmin[] = [];
  cargando = true;
  busqueda: string = '';

  async ngOnInit() {
    await this.cargarEmpresas();
  }

  async cargarEmpresas() {
    this.cargando = true;
    const supabase = this.authService.getSupabaseClient();
    
    const { data, error } = await supabase
      .from('empresas')
      .select(`
        id,
        nombre,
        correo_empresarial,
        correo_registro,
        rep_telefono,
        plan_valido_hasta,
        estado,
        created_at,
        ciudad:ciudades(nombre)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar empresas:', error);
    } else {
      this.listaEmpresas = (data || []).map((item: any) => ({
        ...item,
        ciudad: Array.isArray(item.ciudad) ? item.ciudad[0] : item.ciudad
      }));
    }
    this.cargando = false;
  }

  get empresasFiltradas() {
    return this.listaEmpresas.filter(emp => {
      const textoBusqueda = this.busqueda.toLowerCase();
      const nombreEmpresa = emp.nombre?.toLowerCase() || '';
      const correoEmpresa = (emp.correo_empresarial || emp.correo_registro || '').toLowerCase();
      return !this.busqueda || nombreEmpresa.includes(textoBusqueda) || correoEmpresa.includes(textoBusqueda);
    });
  }

  exportarExcel() {
    const headers = ['ID', 'Nombre Empresa', 'Correo', 'Teléfono', 'Estado Registro', 'Fecha Registro'];
    const rows = this.empresasFiltradas.map(e => [
      e.id,
      `"${e.nombre}"`,
      e.correo_empresarial || e.correo_registro || '',
      e.rep_telefono || '',
      e.estado || '',
      e.created_at ? new Date(e.created_at).toLocaleDateString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'empresas_registradas_qbm.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}