
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export interface Plan {
  id: string;
  nombre: string;
  limite_publicaciones: number;
  created_at: string;
  descripcion: string | null;
  costo: number;
  beneficios: string[] | null;
}

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="planes-page">

      <!-- Encabezado principal -->
      <section class="hero">
        <div class="hero-content">
          <span class="eyebrow">
            <span class="eyebrow-dot"></span>
            ¿QUÉ BUSCA MIJO?
          </span>

          <h1>
            Tu negocio merece
            <span>ser encontrado.</span>
          </h1>

          <p class="hero-copy">
            Elige el plan que se ajuste a tu negocio y descubre nuevas
            oportunidades para conectar con más clientes.
          </p>

          <div class="hero-points">
            <span><b>✓</b> Opciones para tu negocio</span>
            <span><b>✓</b> Beneficios claros</span>
            <span><b>✓</b> Elección sencilla</span>
          </div>
        </div>

        <div class="hero-art" aria-hidden="true">
          <div class="orbit orbit-one"></div>
          <div class="orbit orbit-two"></div>

          <div class="art-card">
            <div class="art-icon">↗</div>
            <div class="art-lines">
              <i></i>
              <i></i>
              <i></i>
            </div>
            <div class="art-pill">Tu negocio, más visible</div>
          </div>

          <span class="art-spark spark-one">✦</span>
          <span class="art-spark spark-two">✳</span>
        </div>
      </section>

      <!-- Listado de planes -->
      <section class="plans-section">
        <header class="section-heading">
          <span class="section-kicker">ENCUENTRA TU OPCIÓN</span>

          <h2>Planes para crecer a tu manera</h2>

          <p>
            Compara los detalles y selecciona el que mejor encaje
            con tus objetivos.
          </p>
        </header>

        @if (cargando) {
          <div class="state-card" role="status">
            <span class="loader" aria-hidden="true"></span>
            <p>Cargando planes disponibles...</p>
          </div>
        } @else if (errorCarga) {
          <div class="state-card" role="alert">
            <div class="state-icon">!</div>
            <h3>No pudimos cargar los planes</h3>
            <p>Inténtalo de nuevo en unos momentos.</p>

            <button
              class="btn-retry"
              type="button"
              (click)="cargarPlanes()">
              Volver a intentar
            </button>
          </div>
        } @else if (planes.length === 0) {
          <div class="state-card">
            <div class="state-icon">⌁</div>
            <h3>Estamos preparando nuestros planes</h3>
            <p>
              Por el momento no hay planes disponibles.
              Vuelve pronto.
            </p>
          </div>
        } @else {
          <div class="planes-grid">
            @for (plan of planes; track plan.id) {
              <article class="plan-card">

                <div class="card-topline"></div>

                <div class="plan-card-content">
                  <span class="plan-label">PLAN</span>

                  <h3 class="plan-name">
                    {{ plan.nombre }}
                  </h3>

                  <p class="plan-desc">
                    {{
                      plan.descripcion ||
                      'Una opción para impulsar la presencia de tu negocio.'
                    }}
                  </p>

                  <div class="price-block">
                    <span class="currency">$</span>
                    <span class="amount">
                      {{ plan.costo | number:'1.0-2' }}
                    </span>
                  </div>

                  <p class="price-note">Precio del plan</p>

                  <div class="feature-limit">
                    <span class="feature-icon" aria-hidden="true">▦</span>

                    <span>
                      <strong>
                        {{
                          plan.limite_publicaciones === -1
                            ? 'Publicaciones ilimitadas'
                            : plan.limite_publicaciones + ' publicaciones'
                        }}
                      </strong>
                      <small>Incluidas en este plan</small>
                    </span>
                  </div>

                  @if (plan.beneficios?.length) {
                    <div class="benefits">
                      <h4>Lo que incluye</h4>

                      <ul>
                        @for (
                          beneficio of plan.beneficios;
                          track $index
                        ) {
                          <li>
                            <span class="check" aria-hidden="true">✓</span>
                            <span>{{ beneficio }}</span>
                          </li>
                        }
                      </ul>
                    </div>
                  }
                </div>

                <footer class="plan-card-footer">
                  <button
                    class="btn-select-plan"
                    type="button"
                    (click)="seleccionarPlan(plan)">
                    Elegir este plan
                    <span aria-hidden="true">→</span>
                  </button>

                  <p class="secure-note">
                    Continúa para solicitar tu plan
                  </p>
                </footer>

              </article>
            }
          </div>
        }

        <p class="plans-footnote">
          Los planes y sus beneficios se muestran según la
          información disponible.
        </p>
      </section>
    </main>
  `,
  styles: [`
    :host {
      --primary: #062b66;
      --primary-deep: #00204f;
      --accent: #64d500;
      --ink: #18263c;
      --muted: #637189;
      --line: #e3eaf2;

      display: block;
      color: var(--ink);
      font-family: 'Segoe UI', Roboto, Arial, sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    .planes-page {
      overflow: hidden;
      padding: 28px 22px 76px;
      background: #f7f9fc;
    }

    /* HERO */

    .hero {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(240px, .75fr);
      align-items: center;
      gap: 28px;
      width: min(1160px, 100%);
      min-height: 350px;
      margin: 0 auto;
      padding: clamp(32px, 5vw, 66px);
      overflow: hidden;
      border-radius: 30px;
      color: #fff;
      background: linear-gradient(
        118deg,
        #00204f 0%,
        #062b66 65%,
        #10417f 100%
      );
      box-shadow: 0 22px 50px rgba(0, 35, 83, .13);
    }

    .hero::after {
      position: absolute;
      right: -110px;
      bottom: -220px;
      width: 440px;
      height: 440px;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 50%;
      content: '';
    }

    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 650px;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      color: #d5f7b5;
      font-size: .76rem;
      font-weight: 850;
      letter-spacing: .13em;
    }

    .eyebrow-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 5px rgba(100,213,0,.14);
    }

    .hero h1 {
      max-width: 650px;
      margin: 22px 0 16px;
      font-size: clamp(2.25rem, 5vw, 4rem);
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: -.045em;
    }

    .hero h1 span {
      color: var(--accent);
    }

    .hero-copy {
      max-width: 580px;
      margin: 0;
      color: #d6e1f0;
      font-size: clamp(1rem, 1.7vw, 1.13rem);
      line-height: 1.75;
    }

    .hero-points {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 22px;
      margin-top: 26px;
      color: #f3f7fd;
      font-size: .86rem;
      font-weight: 650;
    }

    .hero-points > span {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .hero-points b {
      color: var(--accent);
      font-size: 1.1rem;
    }

    /* Ilustración decorativa creada con CSS */

    .hero-art {
      position: relative;
      z-index: 1;
      display: grid;
      min-height: 230px;
      place-items: center;
    }

    .orbit {
      position: absolute;
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 50%;
    }

    .orbit-one {
      width: 270px;
      height: 270px;
    }

    .orbit-two {
      width: 210px;
      height: 210px;
      border-style: dashed;
    }

    .art-card {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 210px;
      min-height: 190px;
      padding: 24px;
      border: 1px solid rgba(255,255,255,.55);
      border-radius: 24px;
      background: linear-gradient(
        145deg,
        rgba(255,255,255,.98),
        rgba(239,247,255,.94)
      );
      box-shadow: 0 25px 55px rgba(0,0,0,.2);
      transform: rotate(4deg);
    }

    .art-icon {
      display: grid;
      width: 52px;
      height: 52px;
      margin-bottom: 19px;
      place-items: center;
      border-radius: 16px;
      color: var(--primary);
      background: #e6f7d8;
      font-size: 2rem;
      font-weight: 900;
    }

    .art-lines {
      display: grid;
      gap: 8px;
    }

    .art-lines i {
      display: block;
      height: 7px;
      border-radius: 9px;
      background: #d8e1ed;
    }

    .art-lines i:first-child {
      width: 90%;
      background: #9cb0c8;
    }

    .art-lines i:last-child {
      width: 57%;
    }

    .art-pill {
      align-self: flex-start;
      margin-top: 18px;
      padding: 7px 10px;
      border-radius: 20px;
      color: var(--primary);
      background: #e8f8d9;
      font-size: .69rem;
      font-weight: 800;
    }

    .art-spark {
      position: absolute;
      color: var(--accent);
      font-size: 2rem;
    }

    .spark-one {
      top: 17px;
      right: 23px;
    }

    .spark-two {
      bottom: 16px;
      left: 18px;
      font-size: 1.5rem;
    }

    /* TÍTULO DE LA SECCIÓN */

    .plans-section {
      width: min(1160px, 100%);
      margin: 76px auto 0;
    }

    .section-heading {
      max-width: 720px;
      margin: 0 auto 38px;
      text-align: center;
    }

    .section-kicker {
      color: #467d13;
      font-size: .74rem;
      font-weight: 900;
      letter-spacing: .15em;
    }

    .section-heading h2 {
      margin: 12px 0;
      color: var(--primary);
      font-size: clamp(1.8rem, 3.4vw, 2.65rem);
      font-weight: 900;
      letter-spacing: -.035em;
      line-height: 1.15;
    }

    .section-heading p {
      margin: 0;
      color: var(--muted);
      font-size: 1rem;
      line-height: 1.7;
    }

    /* TARJETAS */

    .planes-grid {
      display: grid;
      grid-template-columns: repeat(
        auto-fit,
        minmax(min(100%, 285px), 1fr)
      );
      align-items: stretch;
      gap: 24px;
    }

    .plan-card {
      position: relative;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 22px;
      background: #fff;
      box-shadow: 0 8px 26px rgba(10, 38, 77, .045);
      transition:
        transform .2s ease,
        box-shadow .2s ease,
        border-color .2s ease;
    }

    .plan-card:hover {
      transform: translateY(-5px);
      border-color: rgba(100,213,0,.8);
      box-shadow: 0 18px 38px rgba(10, 38, 77, .1);
    }

    .card-topline {
      height: 5px;
      background: linear-gradient(90deg, var(--primary), var(--accent));
    }

    .plan-card-content {
      display: flex;
      flex: 1;
      flex-direction: column;
      padding: 28px 27px 12px;
    }

    .plan-label {
      color: #67809f;
      font-size: .7rem;
      font-weight: 900;
      letter-spacing: .14em;
    }

    .plan-name {
      margin: 9px 0 8px;
      color: var(--primary);
      font-size: 1.55rem;
      font-weight: 900;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }

    .plan-desc {
      min-height: 48px;
      margin: 0 0 20px;
      color: var(--muted);
      font-size: .91rem;
      line-height: 1.6;
    }

    .price-block {
      display: flex;
      align-items: baseline;
      gap: 3px;
      color: var(--primary);
    }

    .currency {
      font-size: 1.15rem;
      font-weight: 800;
    }

    .amount {
      font-size: clamp(2rem, 3vw, 2.55rem);
      font-weight: 950;
      letter-spacing: -.045em;
      overflow-wrap: anywhere;
    }

    .price-note {
      margin: 0 0 23px;
      color: #8491a3;
      font-size: .76rem;
    }

    .feature-limit {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 15px;
      border-radius: 14px;
      background: #f3f8ee;
      color: var(--primary);
    }

    .feature-icon {
      display: grid;
      flex: 0 0 38px;
      width: 38px;
      height: 38px;
      place-items: center;
      border-radius: 11px;
      background: #e0f4cd;
      font-size: 1.35rem;
    }

    .feature-limit strong {
      display: block;
      font-size: .9rem;
      line-height: 1.4;
    }

    .feature-limit small {
      display: block;
      margin-top: 3px;
      color: #6e7d91;
      font-size: .74rem;
    }

    /* Beneficios: cada valor del text[] se muestra como elemento */

    .benefits {
      margin-top: 25px;
    }

    .benefits h4 {
      margin: 0 0 14px;
      color: var(--primary);
      font-size: .92rem;
      font-weight: 850;
    }

    .benefits ul {
      display: grid;
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .benefits li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      color: #4d5b70;
      font-size: .87rem;
      line-height: 1.5;
      overflow-wrap: anywhere;
    }

    .check {
      display: grid;
      flex: 0 0 20px;
      width: 20px;
      height: 20px;
      margin-top: 1px;
      place-items: center;
      border-radius: 50%;
      color: #356b00;
      background: #e8f8da;
      font-size: .72rem;
      font-weight: 900;
    }

    .plan-card-footer {
      padding: 22px 27px 25px;
      margin-top: auto;
    }

    .btn-select-plan {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      min-height: 50px;
      padding: 13px 18px;
      border: 2px solid var(--primary);
      border-radius: 13px;
      color: var(--accent);
      background: var(--primary);
      font: inherit;
      font-size: .92rem;
      font-weight: 850;
      cursor: pointer;
      transition: background .18s ease, color .18s ease;
    }

    .btn-select-plan span {
      font-size: 1.2rem;
      transition: transform .18s ease;
    }

    .btn-select-plan:hover {
      color: var(--primary);
      background: var(--accent);
      border-color: var(--accent);
    }

    .btn-select-plan:hover span {
      transform: translateX(3px);
    }

    .btn-select-plan:focus-visible,
    .btn-retry:focus-visible {
      outline: 3px solid #9acbff;
      outline-offset: 3px;
    }

    .secure-note {
      margin: 13px 0 0;
      color: #7c899b;
      font-size: .72rem;
      text-align: center;
    }

    .plans-footnote {
      margin: 26px 0 0;
      color: #7c899b;
      font-size: .78rem;
      text-align: center;
    }

    /* ESTADOS DE CARGA, ERROR Y LISTA VACÍA */

    .state-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      border: 1px solid var(--line);
      border-radius: 20px;
      background: #fff;
      color: var(--muted);
      text-align: center;
    }

    .state-card h3 {
      margin: 14px 0 5px;
      color: var(--primary);
      font-size: 1.2rem;
    }

    .state-card p {
      margin: 8px 0 0;
      line-height: 1.6;
    }

    .state-icon {
      display: grid;
      width: 44px;
      height: 44px;
      place-items: center;
      border-radius: 50%;
      color: var(--primary);
      background: #eef4fb;
      font-size: 1.5rem;
      font-weight: 900;
    }

    .loader {
      width: 32px;
      height: 32px;
      border: 3px solid #e2ebf4;
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }

    .btn-retry {
      margin-top: 20px;
      padding: 11px 20px;
      border: 0;
      border-radius: 10px;
      color: var(--accent);
      background: var(--primary);
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* TABLET Y MÓVIL */

    @media (max-width: 760px) {
      .planes-page {
        padding: 16px 14px 52px;
      }

      .hero {
        grid-template-columns: 1fr;
        gap: 8px;
        min-height: auto;
        padding: 34px 25px 20px;
        border-radius: 23px;
      }

      .hero h1 {
        margin-top: 18px;
        font-size: clamp(2.2rem, 10vw, 3.25rem);
      }

      .hero-art {
        min-height: 205px;
      }

      .orbit-one {
        width: 230px;
        height: 230px;
      }

      .orbit-two {
        width: 185px;
        height: 185px;
      }

      .art-card {
        width: 190px;
        min-height: 170px;
      }

      .plans-section {
        margin-top: 55px;
      }

      .section-heading {
        margin-bottom: 27px;
      }

      .planes-grid {
        grid-template-columns: 1fr;
        gap: 18px;
        max-width: 480px;
        margin: 0 auto;
      }

      .plan-card-content {
        padding: 25px 23px 10px;
      }

      .plan-card-footer {
        padding: 18px 23px 23px;
      }

      .plan-desc {
        min-height: auto;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: .01ms !important;
      }
    }
  `]
})
export class PlanesComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  planes: Plan[] = [];
  cargando = true;
  errorCarga = false;

  async ngOnInit(): Promise<void> {
    await this.cargarPlanes();
  }

  async cargarPlanes(): Promise<void> {
    this.cargando = true;
    this.errorCarga = false;

    try {
      const { data, error } = await this.authService
        .getSupabaseClient()
        .from('planes')
        .select(
          'id, nombre, limite_publicaciones, created_at, descripcion, costo, beneficios'
        )
        .order('costo', { ascending: true });

      if (error) {
        console.error('Error al cargar los planes:', error);
        this.errorCarga = true;
        return;
      }

      this.planes = (data as Plan[] | null) ?? [];
    } catch (err) {
      console.error('Error inesperado al cargar los planes:', err);
      this.errorCarga = true;
    } finally {
      this.cargando = false;
    }
  }

  async seleccionarPlan(plan: Plan): Promise<void> {
    try {
      const user = await this.authService.getUser();

      if (user) {
        await this.router.navigate(['/adquirir-plan'], {
          queryParams: { plan: plan.id }
        });
      } else {
        await this.router.navigate(['/register'], {
          queryParams: { planSeleccionado: plan.id }
        });
      }
    } catch (err) {
      console.error('Error al validar la sesión del usuario:', err);
      await this.router.navigate(['/register']);
    }
  }
}
