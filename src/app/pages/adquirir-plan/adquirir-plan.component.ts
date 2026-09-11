import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';

interface Plan {
  id: string;
  nombre: string;
  descripcion: string;
  costo: number;
  limite_publicaciones: number;
  beneficios?: string[];
}

@Component({
  selector: 'app-adquirir-plan',
  standalone: true,
  imports: [CommonModule, FooterComponent],
  template: `
    <div class="page-wrapper">
      <main class="main-content">
        
        <div class="header-section">
          <button type="button" class="btn-back" (click)="volverAlPerfil()">← Volver al Perfil</button>
          <h1 class="page-title">💳 Adquirir Nuevo Plan</h1>
          <p class="page-subtitle">Selecciona el plan corporativo de tu preferencia para enviar tu solicitud de activación al equipo administrativo.</p>
        </div>

        @if (cargando) {
          <div class="loading-state">Cargando información y planes disponibles...</div>
        } @else {
          
          <!-- DETALLE AMPLIADO DE LA SOLICITUD ACTUAL O RECHAZADA -->
          @if (solicitudActiva) {
            <div class="solicitud-detail-card" [class.rejected]="solicitudActiva.estado_solicitud === 'rechazado'">
              <div class="solicitud-header">
                <span class="badge-status" [class.badge-rejected]="solicitudActiva.estado_solicitud === 'rechazado'">
                  ⏳ Estado: {{ solicitudActiva.estado_solicitud | uppercase }}
                </span>
                <h3>Detalles de tu Última Solicitud</h3>
              </div>
              
              <div class="solicitud-body-grid">
                <div class="info-item">
                  <span class="info-label">Plan Solicitado:</span>
                  <span class="info-value highlight-text">{{ solicitudActiva.planes?.nombre || 'Plan general' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Fecha de Solicitud:</span>
                  <span class="info-value">{{ solicitudActiva.fecha_solicitud | date:'medium' }}</span>
                </div>
                @if (solicitudActiva.fecha_respuesta) {
                  <div class="info-item">
                    <span class="info-label">Fecha de Respuesta:</span>
                    <span class="info-value">{{ solicitudActiva.fecha_respuesta | date:'medium' }}</span>
                  </div>
                }
                @if (solicitudActiva.notas_admin) {
                  <div class="info-item full-width">
                    <span class="info-label">Notas del Administrador:</span>
                    <p class="admin-notes-box">{{ solicitudActiva.notas_admin }}</p>
                  </div>
                }
              </div>

              @if (solicitudActiva.estado_solicitud === 'pendiente') {
                <p class="solicitud-advice">Tu solicitud está siendo validada por nuestros administradores. No puedes realizar una nueva solicitud hasta que esta sea procesada.</p>
              } @else if (solicitudActiva.estado_solicitud === 'rechazado') {
                <p class="solicitud-advice rejected-text">Tu solicitud anterior fue rechazada. Puedes revisar las notas del administrador y enviar una nueva postulación seleccionando un plan abajo.</p>
              } @else {
                <p class="solicitud-advice">Ya cuentas con un plan aprobado o procesado.</p>
              }
            </div>
          }

          <div class="planes-grid">
            @for (plan of listaPlanes; track plan.id) {
              <div class="plan-card" [class.highlight]="plan.costo > 0">
                <div class="plan-card-header">
                  <h3>{{ plan.nombre }}</h3>
                  <div class="price-tag">
                    <span class="currency">$</span>
                    <span class="amount">{{ plan.costo | number:'1.0-2' }}</span>
                  </div>
                </div>

                <p class="plan-desc">{{ plan.descripcion || 'Sin descripción detallada.' }}</p>

                <div class="plan-features">
                  <div class="feature-item">
                    <span>📦 Límite de publicaciones:</span>
                    <strong>{{ plan.limite_publicaciones === -1 ? 'Ilimitado' : plan.limite_publicaciones }}</strong>
                  </div>
                </div>

                <button 
                  type="button" 
                  class="btn-select-plan" 
                  [disabled]="enviando || (solicitudActiva && solicitudActiva.estado_solicitud === 'pendiente')"
                  (click)="enviarSolicitud(plan.id)">
                  @if (enviando && planSeleccionadoId === plan.id) {
                    Procesando solicitud...
                  } @else {
                    Confirmar Adquisición
                  }
                </button>
              </div>
            }
          </div>
        }

        <!-- Mensajes de feedback -->
        @if (mensajeExito) {
          <div class="alert success">{{ mensajeExito }}</div>
        }
        @if (mensajeError) {
          <div class="alert error">{{ mensajeError }}</div>
        }

      </main>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    :host {
      --primary: #002b66;
      --accent: #64d500;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --bg-page: #f4f8f1;
      font-family: 'Segoe UI', Roboto, sans-serif;
    }

    .page-wrapper {
      background-color: var(--bg-page);
      min-height: calc(100vh - 78px);
      display: flex;
      flex-direction: column;
    }

    .main-content {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 20px;
      width: 100%;
      box-sizing: border-box;
      flex: 1;
    }

    .header-section {
      margin-bottom: 30px;
    }

    .btn-back {
      background: none;
      border: none;
      color: var(--primary);
      font-weight: 700;
      cursor: pointer;
      padding: 0;
      margin-bottom: 15px;
      font-size: 0.95rem;
    }

    .btn-back:hover {
      text-decoration: underline;
    }

    .page-title {
      font-size: 2.2rem;
      font-weight: 900;
      color: var(--primary);
      margin: 0 0 8px 0;
    }

    .page-subtitle {
      color: var(--text-muted);
      font-size: 1rem;
      margin: 0;
    }

    .loading-state {
      text-align: center;
      padding: 50px;
      color: var(--text-muted);
      font-weight: 600;
    }

    /* ESTILOS DE LA TARJETA DETALLADA DE SOLICITUD */
    .solicitud-detail-card {
      background: #ffffff;
      border: 2px solid #f59e0b;
      border-radius: 20px;
      padding: 25px;
      margin-bottom: 35px;
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.1);
    }

    .solicitud-detail-card.rejected {
      border-color: #ef4444;
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.1);
    }

    .solicitud-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      border-bottom: 2px solid #fef3c7;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }

    .solicitud-header h3 {
      color: var(--primary);
      font-size: 1.2rem;
      margin: 0;
      font-weight: 800;
    }

    .badge-status {
      background-color: #fef3c7;
      color: #b45309;
      padding: 5px 14px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.8rem;
      letter-spacing: 0.5px;
    }

    .badge-rejected {
      background-color: #fee2e2 !important;
      color: #b91c1c !important;
    }

    .solicitud-body-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .info-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .info-value {
      font-size: 1rem;
      color: var(--text-main);
      font-weight: 700;
    }

    .highlight-text {
      color: var(--primary);
    }

    .admin-notes-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px;
      border-radius: 10px;
      color: var(--text-main);
      font-size: 0.95rem;
      margin: 4px 0 0 0;
    }

    .solicitud-advice {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin: 15px 0 0 0;
      border-top: 1px dashed #e2e8f0;
      padding-top: 10px;
    }

    .rejected-text {
      color: #b91c1c;
      font-weight: 600;
    }

    .planes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 25px;
      margin-bottom: 30px;
    }

    .plan-card {
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 20px;
      padding: 25px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
      transition: transform 0.2s, border-color 0.2s;
    }

    .plan-card.highlight {
      border-color: var(--accent);
    }

    .plan-card:hover {
      transform: translateY(-4px);
    }

    .plan-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }

    .plan-card-header h3 {
      font-size: 1.4rem;
      color: var(--primary);
      margin: 0;
      font-weight: 800;
    }

    .price-tag {
      display: flex;
      align-items: flex-start;
      color: var(--primary);
    }

    .currency {
      font-size: 0.9rem;
      font-weight: 700;
      margin-right: 2px;
    }

    .amount {
      font-size: 1.5rem;
      font-weight: 900;
    }

    .plan-desc {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin: 0 0 20px 0;
      flex: 1;
    }

    .plan-features {
      border-top: 1px solid #f1f5f9;
      padding-top: 15px;
      margin-bottom: 20px;
    }

    .feature-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      color: var(--text-main);
    }

    .btn-select-plan {
      background: var(--primary);
      color: var(--accent);
      border: none;
      padding: 12px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 0.95rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-select-plan:hover:not(:disabled) {
      opacity: 0.9;
    }

    .btn-select-plan:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .alert {
      padding: 14px 18px;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      margin-top: 20px;
      text-align: center;
    }

    .alert.success {
      background-color: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .alert.error {
      background-color: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }
  `]
})
export class AdquirirPlanComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  listaPlanes: Plan[] = [];
  cargando = true;
  enviando = false;
  planSeleccionadoId: string | null = null;
  solicitudActiva: any = null;
  userId = '';

  mensajeExito = '';
  mensajeError = '';

  async ngOnInit() {
    await this.verificarEmpresaYEstado();
    await this.cargarPlanes();
  }

  async verificarEmpresaYEstado() {
    try {
      const user = await this.authService.getUser();
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
      this.userId = user.id;
      const supabase = this.authService.getSupabaseClient();

      // Buscamos la solicitud más reciente de la empresa sin filtrar únicamente por 'pendiente'
      // para poder traer también los rechazos y mostrar notas o permitir reintentar si fue rechazada.
      const { data } = await supabase
        .from('solicitudes_plan')
        .select('*, planes(nombre, costo)')
        .eq('empresa_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        this.solicitudActiva = data;
      }
    } catch (err) {
      console.error('Error al verificar la última solicitud:', err);
    }
  }

  async cargarPlanes() {
    try {
      const supabase = this.authService.getSupabaseClient();
      const { data, error } = await supabase
        .from('planes')
        .select('*')
        .order('costo', { ascending: true });

      if (error) throw error;
      if (data) {
        this.listaPlanes = data;
      }
    } catch (err) {
      console.error('Error al cargar planes:', err);
      this.mensajeError = 'No se pudieron cargar los planes disponibles.';
    } finally {
      this.cargando = false;
    }
  }

  async enviarSolicitud(planId: string) {
    // Protección adicional por si el botón estuviera expuesto
    if (this.solicitudActiva && this.solicitudActiva.estado_solicitud === 'pendiente') {
      this.mensajeError = 'Ya cuentas con una solicitud pendiente. No puedes realizar otra.';
      return;
    }

    this.enviando = true;
    this.planSeleccionadoId = planId;
    this.mensajeExito = '';
    this.mensajeError = '';

    try {
      const supabase = this.authService.getSupabaseClient();

      const { error } = await supabase
        .from('solicitudes_plan')
        .insert({
          empresa_id: this.userId,
          plan_solicitado_id: planId,
          estado_solicitud: 'pendiente',
          fecha_solicitud: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      this.mensajeExito = '¡Solicitud de plan registrada con éxito! Redirigiendo a tu perfil...';

      await this.verificarEmpresaYEstado();

      setTimeout(() => {
        this.router.navigate(['/perfil']);
      }, 3000);

    } catch (err: any) {
      console.error('Error al registrar la solicitud:', err);
      this.mensajeError = err.message || 'Ocurrió un error al procesar tu solicitud.';
    } finally {
      this.enviando = false;
      this.planSeleccionadoId = null;
    }
  }

  volverAlPerfil() {
    this.router.navigate(['/perfil']);
  }
}