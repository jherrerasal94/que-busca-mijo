import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

export interface Plan {
  id: string;
  nombre: string;
  limite_publicaciones: number;
  created_at: string;
  descripcion: string | null;
  costo: number;
  beneficios: any; // Puede ser texto o un array/JSON dependiendo de cómo lo guardes en Supabase
}

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="planes-container">
      <div class="header-section">
        <span class="badge">💎 Impulsa tu negocio</span>
        <h2>Planes diseñados para tu empresa</h2>
        <p>Elige el plan que mejor se adapte a tus necesidades y comienza a llegar a más clientes.</p>
      </div>

      @if (cargando) {
        <div class="loading-state">Cargando planes disponibles...</div>
      } @else if (planes.length === 0) {
        <div class="empty-state">
          <p>Por el momento no hay planes disponibles.</p>
        </div>
      } @else {
        <div class="planes-grid">
          @for (plan of planes; track plan.id) {
            <div class="plan-card">
              <div class="plan-header">
                <h3 class="plan-name">{{ plan.nombre }}</h3>
                <div class="plan-price">
                  <span class="currency">$</span>
                  <span class="amount">{{ plan.costo | number:'1.0-2' }}</span>
                </div>
              </div>

              <p class="plan-desc">{{ plan.descripcion || 'Sin descripción adicional.' }}</p>

              <div class="plan-features">
                <div class="feature-limit">
                  📦 <strong>{{ plan.limite_publicaciones === -1 ? 'Publicaciones ilimitadas' : plan.limite_publicaciones + ' publicaciones' }}</strong>
                </div>

                @if (plan.beneficios) {
                  <div class="benefits-box">
                    <span class="benefits-title">Beneficios incluidos:</span>
                    <p class="benefits-text">{{ plan.beneficios }}</p>
                  </div>
                }
              </div>

              <button class="btn-select-plan" (click)="seleccionarPlan(plan)">
                Adquirir Plan
              </button>
            </div>
          }
        </div>
      }
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

    .planes-container {
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 20px;
    }

    .header-section {
      text-align: center;
      margin-bottom: 50px;
    }

    .badge {
      display: inline-block;
      background-color: var(--primary);
      color: var(--accent);
      padding: 6px 16px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.85rem;
      margin-bottom: 16px;
    }

    .header-section h2 {
      font-size: clamp(2rem, 4vw, 2.8rem);
      color: var(--primary);
      margin: 0 0 10px 0;
      font-weight: 900;
    }

    .header-section p {
      color: var(--text-muted);
      font-size: 1.1rem;
      margin: 0;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
      font-size: 1.1rem;
    }

    .planes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      align-items: stretch;
    }

    .plan-card {
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 24px;
      padding: 32px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    }

    .plan-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 30px rgba(0, 43, 102, 0.08);
      border-color: var(--accent);
    }

    .plan-header {
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }

    .plan-name {
      font-size: 1.4rem;
      color: var(--primary);
      font-weight: 800;
      margin: 0 0 12px 0;
    }

    .plan-price {
      display: flex;
      align-items: baseline;
      color: var(--primary);
    }

    .currency {
      font-size: 1.2rem;
      font-weight: 700;
      margin-right: 4px;
    }

    .amount {
      font-size: 2.5rem;
      font-weight: 900;
    }

    .plan-desc {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 24px;
      flex-grow: 1;
    }

    .plan-features {
      background: var(--bg-page);
      padding: 16px;
      border-radius: 16px;
      margin-bottom: 24px;
    }

    .feature-limit {
      font-size: 0.95rem;
      color: var(--primary);
      margin-bottom: 8px;
    }

    .benefits-box {
      margin-top: 10px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 10px;
    }

    .benefits-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      display: block;
      margin-bottom: 4px;
    }

    .benefits-text {
      font-size: 0.9rem;
      color: var(--text-main);
      margin: 0;
    }

    .btn-select-plan {
      background: var(--primary);
      color: var(--accent);
      border: none;
      width: 100%;
      padding: 14px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 1rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-select-plan:hover {
      opacity: 0.9;
    }
  `]
})
export class PlanesComponent implements OnInit {
  private authService = inject(AuthService);

  planes: Plan[] = [];
  cargando = true;

  async ngOnInit() {
    await this.cargarPlanes();
  }

  async cargarPlanes() {
    this.cargando = true;
    const { data, error } = await this.authService.getSupabaseClient()
      .from('planes')
      .select('id, nombre, limite_publicaciones, created_at, descripcion, costo, beneficios')
      .order('costo', { ascending: true }); // Ordenados del más económico al más costoso

    if (error) {
      console.error('Error al cargar los planes:', error);
    } else {
      this.planes = (data as Plan[]) || [];
    }
    this.cargando = false;
  }

  seleccionarPlan(plan: Plan) {
    // Aquí puedes manejar la lógica cuando el usuario haga clic en adquirir un plan
    // (ej. redirigir al login si no está autenticado, o abrir una pasarela de pago / pasarela de suscripción)
    console.log('Plan seleccionado:', plan);
    alert(`Has seleccionado el plan: ${plan.nombre}`);
  }
}