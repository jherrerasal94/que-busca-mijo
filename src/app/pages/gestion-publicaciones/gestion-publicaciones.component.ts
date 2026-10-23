import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LikeService } from '../../core/services/like.service';

export interface Publicacion {
  id: string;
  empresa_id: string;
  servicio_producto: string;
  categoria_id?: string | null;
  precio: number | null;
  descripcion: string | null;
  foto_1: string | null;
  foto_2: string | null;
  foto_3: string | null;
  estado?: string; // 'activo' o 'inactivo'
  created_at: string;
  slug?: string | null;
  destacado_hasta?: string | null;
}

export interface SolicitudDestacado {
  id: string;
  publicacion_id: string;
  dias_solicitados: number;
  estado_solicitud: 'pendiente' | 'aprobado' | 'rechazado';
  fecha_solicitud: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  icono?: string;
  estado: string;
}

export interface PlanInfo {
  nombre: string;
  limite_publicaciones: number | null; // null = ilimitado
}

@Component({
  selector: 'app-gestion-publicaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="gestion-container">
      <div class="header">
        <h2>📢 Gestión de Publicaciones</h2>
        <p>Crea y administra los productos o servicios asociados a tu empresa.</p>

        @if (!cargandoPlan) {
          @if (planInfo) {
            <div class="plan-usage-banner" [class.limite]="limiteAlcanzado">
              📊 Plan <strong>{{ planInfo.nombre }}</strong> —
              {{ publicacionesActivasCount }}
              @if (planInfo.limite_publicaciones !== null) {
                / {{ planInfo.limite_publicaciones }}
              } @else {
                (ilimitado)
              }
              publicaciones activas
            </div>
          } @else if (planVencido) {
            <div class="plan-usage-banner limite">
              ⚠️ Tu plan venció.
              <a routerLink="/adquirir-plan">Renueva aquí</a> para seguir publicando.
            </div>
          } @else {
            <div class="plan-usage-banner limite">
              ⚠️ No tienes un plan activo asignado.
              <a routerLink="/adquirir-plan">Solicita uno aquí</a> para poder publicar.
            </div>
          }
        }
      </div>

      <!-- RESUMEN DE MÉTRICAS -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-icon">📦</span>
          <div class="stat-body">
            <span class="stat-value">
              {{ publicacionesActivasCount }}@if (planInfo && planInfo.limite_publicaciones !== null) { / {{ planInfo.limite_publicaciones }} }
            </span>
            <span class="stat-label">Publicaciones activas</span>
          </div>
        </div>

        <div class="stat-card">
          <span class="stat-icon">❤️</span>
          <div class="stat-body">
            <span class="stat-value">{{ likesTotal }}</span>
            <span class="stat-label">Likes totales</span>
          </div>
        </div>

        <div class="stat-card">
          <span class="stat-icon">⭐</span>
          <div class="stat-body">
            <span class="stat-value">{{ ratingPromedio !== null ? ratingPromedio.toFixed(1) : '—' }}</span>
            <span class="stat-label">
              {{ totalReviews > 0 ? 'Rating promedio (' + totalReviews + ')' : 'Sin opiniones aún' }}
            </span>
          </div>
        </div>

        <div class="stat-card">
          <span class="stat-icon">🔥</span>
          <div class="stat-body">
            @if (publicacionMasPopular) {
              <span class="stat-value stat-value-text" [title]="publicacionMasPopular.servicio_producto">{{ publicacionMasPopular.servicio_producto }}</span>
              <span class="stat-label">Más popular · {{ likesCountMap[publicacionMasPopular.id] || 0 }} likes</span>
            } @else {
              <span class="stat-value">—</span>
              <span class="stat-label">Aún sin publicaciones</span>
            }
          </div>
        </div>
      </div>

      <div class="grid-layout">
        <!-- FORMULARIO DE CREACIÓN / EDICIÓN -->
        <div class="card form-card">
          <div class="form-header">
            <h3>{{ editingId ? 'Editar Publicación' : 'Crear Producto / Servicio' }}</h3>
            @if (editingId) {
              <button (click)="cancelarEdicion()" class="btn-cancel-top">Cancelar edición</button>
            }
          </div>

          <form [formGroup]="postForm" (ngSubmit)="onSubmit()">
            
            <div class="form-group">
              <label>Servicio o Producto *</label>
              <input type="text" formControlName="servicio_producto" placeholder="Ej: Mantenimiento Preventivo / Pizza Familiar" />
            </div>

            <!-- SELECCIÓN DE CATEGORÍA -->
            <div class="form-group">
              <label>Categoría *</label>
              <select formControlName="categoria_id">
                <option [value]="null" disabled>Selecciona una categoría...</option>
                @for (cat of categorias; track cat.id) {
                  <option [value]="cat.id">{{ cat.icono || '📁' }} {{ cat.nombre }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Precio ($)</label>
              <input type="number" formControlName="precio" placeholder="0.00" step="0.01" />
            </div>

            <div class="form-group">
              <label>Descripción</label>
              <textarea formControlName="descripcion" rows="3" placeholder="Detalles del producto o servicio..."></textarea>
            </div>

            <!-- CARGA DE FOTOS DESDE ARCHIVO -->
            <div class="section-title">Imágenes / Galería</div>
            
            <!-- Foto 1 -->
            <div class="form-group">
              <label>Foto Principal (Foto 1) *</label>
              <input type="file" accept="image/*" (change)="onFileSelected($event, 'foto_1')" />
              @if (uploadingFoto1) {
                <span class="uploading-text">Subiendo foto 1...</span>
              }
              @if (postForm.get('foto_1')?.value) {
                <div class="preview-box">
                  <img [src]="postForm.get('foto_1')?.value" alt="Preview Foto 1" />
                  <button type="button" (click)="removerFoto('foto_1')" class="btn-remove-img">✕</button>
                </div>
              }
            </div>

            <!-- Foto 2 -->
            <div class="form-group">
              <label>Foto 2 (Opcional)</label>
              <input type="file" accept="image/*" (change)="onFileSelected($event, 'foto_2')" />
              @if (uploadingFoto2) {
                <span class="uploading-text">Subiendo foto 2...</span>
              }
              @if (postForm.get('foto_2')?.value) {
                <div class="preview-box">
                  <img [src]="postForm.get('foto_2')?.value" alt="Preview Foto 2" />
                  <button type="button" (click)="removerFoto('foto_2')" class="btn-remove-img">✕</button>
                </div>
              }
            </div>

            <!-- Foto 3 -->
            <div class="form-group">
              <label>Foto 3 (Opcional)</label>
              <input type="file" accept="image/*" (change)="onFileSelected($event, 'foto_3')" />
              @if (uploadingFoto3) {
                <span class="uploading-text">Subiendo foto 3...</span>
              }
              @if (postForm.get('foto_3')?.value) {
                <div class="preview-box">
                  <img [src]="postForm.get('foto_3')?.value" alt="Preview Foto 3" />
                  <button type="button" (click)="removerFoto('foto_3')" class="btn-remove-img">✕</button>
                </div>
              }
            </div>

            @if (errorMessage) {
              <div class="error-banner">⚠️ {{ errorMessage }}</div>
            }

            <div class="actions-group">
              <button 
                type="submit" 
                class="btn-primary full-width" 
                [disabled]="submitting || uploadingFoto1 || uploadingFoto2 || uploadingFoto3 || (!editingId && limiteAlcanzado)">
                {{ submitting ? 'Guardando...' : (editingId ? 'Guardar Cambios' : (limiteAlcanzado ? 'Límite de publicaciones alcanzado' : 'Publicar Ahora')) }}
              </button>
              
              @if (editingId) {
                <button type="button" (click)="cancelarEdicion()" class="btn-secondary full-width">
                  Cancelar
                </button>
              }
            </div>
          </form>
        </div>

        <!-- LISTADO DE PUBLICACIONES -->
        <div class="card list-card">
          <h3>Tus Publicaciones</h3>

          @if (loadingPosts) {
            <p>Cargando publicaciones...</p>
          } @else if (publicaciones.length === 0) {
            <p class="empty-state">No has registrado ningún producto o servicio aún.</p>
          } @else {
            <div class="posts-list">
              @for (post of publicaciones; track post.id) {
                <div class="post-item" [class.selected]="editingId === post.id" [class.inactivo]="post.estado === 'inactivo'">
                  <div class="thumb-container">
                    @if (post.foto_1) {
                      <img [src]="post.foto_1" [alt]="post.servicio_producto" class="post-thumb" />
                    } @else {
                      <div class="no-thumb">📦</div>
                    }
                  </div>
                  
                  <div class="post-content">
                    <div class="title-row">
                      <h4>{{ post.servicio_producto }}</h4>
                      <span class="badge-estado" [class.activo]="post.estado !== 'inactivo'" [class.inactivo]="post.estado === 'inactivo'">
                        {{ post.estado === 'inactivo' ? 'Inactivo' : 'Activo' }}
                      </span>
                      @if (estaDestacada(post)) {
                        <span class="badge-destacado" [title]="'Destacada hasta ' + (post.destacado_hasta | date:'mediumDate')">⭐ Destacada</span>
                      }
                    </div>

                    @if (post.categoria_id) {
                      <span class="post-category">📁 {{ obtenerNombreCategoria(post.categoria_id) }}</span>
                    }

                    @if (post.precio) {
                      <span class="post-price">&#36;{{ post.precio | number:'1.0-2' }}</span>
                    }
                    <p class="post-desc">{{ post.descripcion }}</p>
                    
                    <div class="post-meta-row">
                      <span class="post-meta">📅 {{ post.created_at | date:'shortDate' }}</span>
                      <span class="post-likes">❤️ {{ likesCountMap[post.id] || 0 }} likes</span>
                    </div>
                  </div>

                  <div class="action-buttons">
                    <button (click)="cargarEnFormulario(post)" class="btn-icon btn-edit" title="Editar">
                      ✏️
                    </button>
                    <button 
                      (click)="toggleEstadoPublicacion(post)" 
                      class="btn-icon" 
                      [class.btn-activate]="post.estado === 'inactivo'"
                      [class.btn-deactivate]="post.estado !== 'inactivo'"
                      [disabled]="post.estado === 'inactivo' && limiteAlcanzado"
                      [title]="post.estado === 'inactivo' ? (limiteAlcanzado ? 'Alcanzaste el límite de tu plan' : 'Activar') : 'Desactivar'">
                      {{ post.estado === 'inactivo' ? '✅' : '🚫' }}
                    </button>

                    @if (!puedeDestacar) {
                      <span class="destacar-hint-disabled" title="Disponible solo en planes Pro y Premium">⭐</span>
                    } @else if (estaDestacada(post)) {
                      <span class="destacar-hint" [title]="'Hasta ' + (post.destacado_hasta | date:'mediumDate')">
                        ⭐ {{ post.destacado_hasta | date:'shortDate' }}
                      </span>
                    } @else if (obtenerSolicitudDestacado(post.id)?.estado_solicitud === 'pendiente') {
                      <span class="destacar-hint">⏳ Pendiente</span>
                    } @else if (publicacionEnSeleccionDestacado === post.id) {
                      <div class="destacar-picker">
                        <select [(ngModel)]="diasDestacadoSeleccionados" class="destacar-select">
                          <option [ngValue]="7">7 días</option>
                          <option [ngValue]="15">15 días</option>
                          <option [ngValue]="30">30 días</option>
                        </select>
                        <button (click)="confirmarSolicitudDestacado(post)" class="btn-icon btn-confirmar-destacado" title="Confirmar solicitud">✔️</button>
                        <button (click)="publicacionEnSeleccionDestacado = null" class="btn-icon" title="Cancelar">✕</button>
                      </div>
                    } @else {
                      <button (click)="publicacionEnSeleccionDestacado = post.id" class="btn-icon btn-destacar" title="Solicitar destacado">
                        ⭐
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gestion-container { max-width: 1100px; margin: 30px auto; padding: 0 20px; }
    .header { margin-bottom: 24px; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 16px; display: flex; align-items: center; gap: 12px;
    }
    .stat-icon { font-size: 1.8rem; flex-shrink: 0; }
    .stat-body { display: flex; flex-direction: column; min-width: 0; }
    .stat-value { font-size: 1.3rem; font-weight: 900; color: #0f172a; line-height: 1.2; }
    .stat-value-text { font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .stat-label { font-size: 0.75rem; color: #64748b; font-weight: 600; margin-top: 2px; }

    @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
    .grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 768px) { .grid-layout { grid-template-columns: 1fr; } }
    .card { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .form-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 16px; }
    .form-header h3 { margin: 0; color: #0f172a; }
    .btn-cancel-top { background: none; border: none; color: #ef4444; font-size: 0.8rem; font-weight: 700; cursor: pointer; text-decoration: underline; }
    h3 { margin-top: 0; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
    label { font-size: 0.85rem; font-weight: 700; color: #334155; }
    input, select, textarea { padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem; background: #fff; }
    .section-title { font-size: 0.85rem; font-weight: 800; color: #0284c7; margin: 14px 0 8px 0; }
    .actions-group { display: flex; gap: 10px; margin-top: 10px; }
    .btn-primary { background: #0284c7; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-primary:hover { background: #0369a1; }
    .btn-secondary { background: #e2e8f0; color: #334155; border: none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-secondary:hover { background: #cbd5e1; }
    .full-width { width: 100%; }
    
    .uploading-text { font-size: 0.75rem; color: #0284c7; font-weight: 600; }
    .preview-box { position: relative; width: 80px; height: 80px; margin-top: 6px; border-radius: 6px; overflow: hidden; border: 1px solid #cbd5e1; }
    .preview-box img { width: 100%; height: 100%; object-fit: cover; }
    .btn-remove-img { position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }

    .posts-list { display: flex; flex-direction: column; gap: 12px; }
    .post-item { display: flex; gap: 12px; align-items: center; border: 1px solid #f1f5f9; padding: 10px; border-radius: 8px; background: #fafafa; transition: all 0.2s; }
    .post-item.selected { border: 2px solid #0284c7; background: #f0f9ff; }
    .post-item.inactivo { opacity: 0.6; background: #f8fafc; }
    .thumb-container { width: 60px; height: 60px; flex-shrink: 0; }
    .post-thumb { width: 100%; height: 100%; border-radius: 6px; object-fit: cover; }
    .no-thumb { width: 100%; height: 100%; background: #e2e8f0; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .post-content { flex: 1; }
    .title-row { display: flex; justify-content: space-between; align-items: center; }
    .post-content h4 { margin: 0; font-size: 0.95rem; }
    
    .badge-estado { font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
    .badge-estado.activo { background: #dcfce7; color: #15803d; }
    .badge-estado.inactivo { background: #f1f5f9; color: #64748b; }

    .post-category { display: inline-block; font-size: 0.75rem; font-weight: 700; color: #0369a1; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; margin: 3px 0; }
    .post-price { font-weight: 800; color: #16a34a; font-size: 0.85rem; display: block; }
    .post-desc { margin: 4px 0; font-size: 0.85rem; color: #64748b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    
    .post-meta-row { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
    .post-meta { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
    .post-likes { font-size: 0.75rem; color: #e11d48; font-weight: 700; background: #ffe4e6; padding: 2px 6px; border-radius: 99px; }

    .action-buttons { display: flex; gap: 6px; }
    .btn-icon { border: none; padding: 8px; border-radius: 6px; cursor: pointer; }
    .btn-edit { background: #e0f2fe; }
    .btn-edit:hover { background: #bae6fd; }
    .btn-deactivate { background: #fee2e2; }
    .btn-deactivate:hover { background: #fca5a5; }
    .btn-activate { background: #dcfce7; }
    .btn-activate:hover { background: #bbf7d0; }

    .error-banner { background: #fee2e2; color: #b91c1c; padding: 8px; border-radius: 6px; font-size: 0.85rem; margin-bottom: 10px; }
    .empty-state { color: #94a3b8; font-style: italic; }

    .plan-usage-banner {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      background: #e0f2fe;
      color: #0369a1;
    }
    .plan-usage-banner.limite {
      background: #fee2e2;
      color: #b91c1c;
    }
    .plan-usage-banner a {
      color: inherit;
      text-decoration: underline;
      font-weight: 800;
    }

    .btn-icon:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .badge-destacado {
      background: #fef3c7; color: #92400e; font-size: 0.7rem; font-weight: 800;
      padding: 2px 8px; border-radius: 999px; white-space: nowrap;
    }

    .btn-destacar { background: #fef3c7; color: #92400e; }
    .destacar-hint {
      font-size: 0.75rem; font-weight: 800; color: #92400e; background: #fef3c7;
      padding: 6px 10px; border-radius: 6px; white-space: nowrap;
    }
    .destacar-hint-disabled {
      font-size: 0.9rem; opacity: 0.35; padding: 6px; cursor: not-allowed;
    }

    .destacar-picker { display: flex; align-items: center; gap: 4px; }
    .destacar-select { font-size: 0.78rem; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .btn-confirmar-destacado { background: #dcfce7; color: #166534; }
  `]
})
export class GestionPublicacionesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private likeService = inject(LikeService);

  publicaciones: Publicacion[] = [];
  categorias: Categoria[] = [];
  loadingPosts = true;
  submitting = false;
  errorMessage: string | null = null;
  
  uploadingFoto1 = false;
  uploadingFoto2 = false;
  uploadingFoto3 = false;

  likesCountMap: { [key: string]: number } = {};
  editingId: string | null = null;

  planInfo: PlanInfo | null = null;
  cargandoPlan = true;
  planVencido = false;

  // Destacados: exclusivo para Pro y Premium.
  solicitudesDestacadoMap: { [publicacionId: string]: SolicitudDestacado } = {};
  publicacionEnSeleccionDestacado: string | null = null;
  diasDestacadoSeleccionados: number = 7;

  get puedeDestacar(): boolean {
    return this.planInfo?.nombre === 'Pro' || this.planInfo?.nombre === 'Premium';
  }

  estaDestacada(post: Publicacion): boolean {
    return !!post.destacado_hasta && new Date(post.destacado_hasta) > new Date();
  }

  obtenerSolicitudDestacado(publicacionId: string): SolicitudDestacado | undefined {
    return this.solicitudesDestacadoMap[publicacionId];
  }

  ratingPromedio: number | null = null;
  totalReviews = 0;

  get likesTotal(): number {
    return Object.values(this.likesCountMap).reduce((acc, n) => acc + n, 0);
  }

  get publicacionMasPopular(): Publicacion | null {
    if (this.publicaciones.length === 0) return null;
    return this.publicaciones.reduce((max, p) => {
      const likesP = this.likesCountMap[p.id] || 0;
      const likesMax = this.likesCountMap[max.id] || 0;
      return likesP > likesMax ? p : max;
    }, this.publicaciones[0]);
  }

  get publicacionesActivasCount(): number {
    return this.publicaciones.filter(p => p.estado !== 'inactivo').length;
  }

  get limiteAlcanzado(): boolean {
    if (this.cargandoPlan) return true; // por seguridad, no permitir mientras carga
    if (!this.planInfo) return true; // sin plan asignado => no puede publicar
    if (this.planInfo.limite_publicaciones === null) return false; // ilimitado
    return this.publicacionesActivasCount >= this.planInfo.limite_publicaciones;
  }

  // Mismo criterio que la migración SQL de Fase 3: minúsculas, sin acentos,
  // espacios a guiones, + sufijo corto para evitar choques entre productos
  // con el mismo nombre. Se genera una sola vez al crear; nunca se
  // regenera en una edición, para no romper links ya compartidos.
  private generarSlug(texto: string): string {
    const base = texto
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    const sufijo = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

    return `${base}-${sufijo}`;
  }

  mensajeLimite(): string {
    if (this.cargandoPlan) {
      return 'Cargando información de tu plan, intenta de nuevo en un momento.';
    }
    if (this.planVencido) {
      return 'Tu plan venció. Renueva tu suscripción para poder seguir publicando.';
    }
    if (!this.planInfo) {
      return 'No tienes un plan activo asignado. Solicita un plan para poder publicar.';
    }
    return `Alcanzaste el límite de ${this.planInfo.limite_publicaciones} publicaciones activas de tu plan "${this.planInfo.nombre}". Desactiva alguna publicación o mejora tu plan para continuar.`;
  }

  postForm: FormGroup = this.fb.group({
    servicio_producto: ['', Validators.required],
    categoria_id: [null, Validators.required],
    precio: [null],
    descripcion: [''],
    foto_1: [''],
    foto_2: [''],
    foto_3: ['']
  });

  async ngOnInit() {
    await this.cargarPlanEmpresa();
    await this.cargarCategorias();
    await this.cargarPublicaciones();
    await this.cargarRatingEmpresa();
    await this.cargarSolicitudesDestacado();
  }

  async cargarSolicitudesDestacado() {
    const user = await this.authService.getUser();
    if (!user) return;

    const { data, error } = await this.authService.getSupabaseClient()
      .from('solicitudes_destacado')
      .select('id, publicacion_id, dias_solicitados, estado_solicitud, fecha_solicitud')
      .eq('empresa_id', user.id)
      .order('fecha_solicitud', { ascending: false });

    if (error || !data) return;

    // Solo nos interesa la solicitud más reciente por publicación
    // (la lista ya viene ordenada de más reciente a más antigua).
    const mapa: { [publicacionId: string]: SolicitudDestacado } = {};
    for (const sol of data as SolicitudDestacado[]) {
      if (!mapa[sol.publicacion_id]) {
        mapa[sol.publicacion_id] = sol;
      }
    }
    this.solicitudesDestacadoMap = mapa;
  }

  async confirmarSolicitudDestacado(post: Publicacion) {
    const user = await this.authService.getUser();
    if (!user) return;

    const { error } = await this.authService.getSupabaseClient()
      .from('solicitudes_destacado')
      .insert({
        publicacion_id: post.id,
        empresa_id: user.id,
        dias_solicitados: this.diasDestacadoSeleccionados,
        estado_solicitud: 'pendiente'
      });

    if (error) {
      console.error('Error al solicitar destacado:', error);
      alert('No pudimos registrar tu solicitud de destacado. Intenta de nuevo.');
      return;
    }

    this.publicacionEnSeleccionDestacado = null;
    await this.cargarSolicitudesDestacado();
  }

  async cargarRatingEmpresa() {
    const user = await this.authService.getUser();
    if (!user) return;

    const { data, error } = await this.authService.getSupabaseClient()
      .from('reviews_empresa')
      .select('rating')
      .eq('empresa_id', user.id)
      .eq('estado', 'activo');

    if (error || !data || data.length === 0) {
      this.ratingPromedio = null;
      this.totalReviews = 0;
      return;
    }

    const suma = data.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
    this.ratingPromedio = suma / data.length;
    this.totalReviews = data.length;
  }

  async cargarPlanEmpresa() {
    this.cargandoPlan = true;
    const user = await this.authService.getUser();
    if (!user) {
      this.planInfo = null;
      this.cargandoPlan = false;
      return;
    }

    // empresas.id = auth.users.id
    const { data, error } = await this.authService.getSupabaseClient()
      .from('empresas')
      .select(`
        plan_id,
        plan_valido_hasta,
        plan:planes (
          nombre,
          limite_publicaciones
        )
      `)
      .eq('id', user.id)
      .single();

    if (error || !data?.plan) {
      this.planInfo = null;
      this.planVencido = false;
    } else {
      // Un plan con plan_id asignado pero ya vencido NO debe tratarse
      // como activo -- hasta ahora nada verificaba esta fecha.
      const vencido = !!data.plan_valido_hasta && new Date(data.plan_valido_hasta) < new Date();

      if (vencido) {
        this.planInfo = null;
        this.planVencido = true;
      } else {
        this.planInfo = data.plan as unknown as PlanInfo;
        this.planVencido = false;
      }
    }
    this.cargandoPlan = false;
  }

  async cargarCategorias() {
    const { data, error } = await this.authService.getSupabaseClient()
      .from('categorias')
      .select('id, nombre, icono, estado')
      .eq('estado', 'activo')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al cargar categorías:', error);
    } else {
      this.categorias = (data as Categoria[]) || [];
    }
  }

  obtenerNombreCategoria(categoriaId: string): string {
    const cat = this.categorias.find(c => c.id === categoriaId);
    return cat ? `${cat.icono || ''} ${cat.nombre}` : 'Sin categoría';
  }

  async cargarPublicaciones() {
    this.loadingPosts = true;
    const user = await this.authService.getUser();
    if (!user) {
      this.loadingPosts = false;
      return;
    }

    const { data, error } = await this.authService.getSupabaseClient()
      .from('publicaciones')
      .select('*')
      .eq('empresa_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar publicaciones:', error);
    } else {
      this.publicaciones = (data as Publicacion[]) || [];
      await this.cargarLikesDePublicaciones();
    }
    this.loadingPosts = false;
  }

  async cargarLikesDePublicaciones() {
    for (const post of this.publicaciones) {
      const total = await this.likeService.contarLikes(post.id);
      this.likesCountMap[post.id] = total;
    }
  }

  // MÉTODO PARA SUBIR ARCHIVOS AL BUCKET 'publicaciones-media'
  async onFileSelected(event: any, campo: 'foto_1' | 'foto_2' | 'foto_3') {
    const file: File = event.target.files[0];
    if (!file) return;

    const user = await this.authService.getUser();
    if (!user) {
      this.errorMessage = 'Debes estar autenticado para subir imágenes.';
      return;
    }

    // Activar indicador de carga según el campo
    if (campo === 'foto_1') this.uploadingFoto1 = true;
    if (campo === 'foto_2') this.uploadingFoto2 = true;
    if (campo === 'foto_3') this.uploadingFoto3 = true;
    this.errorMessage = null;

    try {
      const supabase = this.authService.getSupabaseClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${campo}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('publicaciones-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('publicaciones-media')
        .getPublicUrl(fileName);

      // Asignar URL al formulario reactivo
      this.postForm.get(campo)?.setValue(publicUrl);
    } catch (err: any) {
      console.error('Error al subir imagen:', err);
      this.errorMessage = 'Error al subir la imagen: ' + (err.message || '');
    } finally {
      if (campo === 'foto_1') this.uploadingFoto1 = false;
      if (campo === 'foto_2') this.uploadingFoto2 = false;
      if (campo === 'foto_3') this.uploadingFoto3 = false;
    }
  }

  removerFoto(campo: 'foto_1' | 'foto_2' | 'foto_3') {
    this.postForm.get(campo)?.setValue('');
  }

  cargarEnFormulario(post: Publicacion) {
    this.editingId = post.id;
    this.errorMessage = null;

    this.postForm.patchValue({
      servicio_producto: post.servicio_producto,
      categoria_id: post.categoria_id || null,
      precio: post.precio,
      descripcion: post.descripcion || '',
      foto_1: post.foto_1 || '',
      foto_2: post.foto_2 || '',
      foto_3: post.foto_3 || ''
    });
  }

  cancelarEdicion() {
    this.editingId = null;
    this.postForm.reset({ categoria_id: null });
    this.errorMessage = null;
  }

  async onSubmit() {
    if (this.postForm.invalid) {
      this.errorMessage = 'Por favor completa los campos obligatorios: Producto/Servicio y Categoría.';
      return;
    }

    // Solo aplica al crear una publicación nueva (que nace en estado 'activo').
    // Editar una publicación existente no cambia su estado ni suma al conteo.
    if (!this.editingId && this.limiteAlcanzado) {
      this.errorMessage = this.mensajeLimite();
      return;
    }

    const user = await this.authService.getUser();
    if (!user) {
      this.errorMessage = 'Debes estar autenticado.';
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    const { servicio_producto, categoria_id, precio, descripcion, foto_1, foto_2, foto_3 } = this.postForm.value;

    const payload = {
      empresa_id: user.id,
      servicio_producto,
      categoria_id: categoria_id || null,
      precio: precio !== null ? precio : null,
      descripcion: descripcion || null,
      foto_1: foto_1 || null,
      foto_2: foto_2 || null,
      foto_3: foto_3 || null,
      updated_at: new Date().toISOString()
    };

    let error = null;

    if (this.editingId) {
      const publicacionActual = this.publicaciones.find(p => p.id === this.editingId);
      const updatePayload: any = { ...payload };

      // Red de seguridad: si por algún motivo esta publicación no tiene
      // slug (ej. no alcanzó el backfill de Fase 3), se le genera aquí.
      if (publicacionActual && !publicacionActual.slug) {
        updatePayload.slug = this.generarSlug(servicio_producto);
      }

      const res = await this.authService.getSupabaseClient()
        .from('publicaciones')
        .update(updatePayload)
        .eq('id', this.editingId);
      error = res.error;
    } else {
      const res = await this.authService.getSupabaseClient()
        .from('publicaciones')
        .insert({ ...payload, estado: 'activo', slug: this.generarSlug(servicio_producto) });
      error = res.error;
    }

    if (error) {
      this.errorMessage = error.message;
    } else {
      this.cancelarEdicion();
      await this.cargarPublicaciones();
    }
    this.submitting = false;
  }

  async toggleEstadoPublicacion(post: Publicacion) {
    const nuevoEstado = post.estado === 'inactivo' ? 'activo' : 'inactivo';

    // Si se está intentando activar y ya se alcanzó el límite del plan, se bloquea.
    if (nuevoEstado === 'activo' && this.limiteAlcanzado) {
      alert(this.mensajeLimite());
      return;
    }

    const accionTexto = nuevoEstado === 'inactivo' ? 'desactivar' : 'activar';

    if (!confirm(`¿Estás seguro de ${accionTexto} esta publicación?`)) return;

    const { error } = await this.authService.getSupabaseClient()
      .from('publicaciones')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', post.id);

    if (error) {
      alert('Error al cambiar el estado: ' + error.message);
    } else {
      await this.cargarPublicaciones();
    }
  }
}