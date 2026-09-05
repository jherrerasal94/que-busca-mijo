import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

export interface Publicacion {
  id: string;
  empresa_id: string;
  servicio_producto: string;
  precio: number | null;
  descripcion: string | null;
  foto_1: string | null;
  foto_2: string | null;
  foto_3: string | null;
  estado?: string;
  created_at: string;
}

@Component({
  selector: 'app-gestion-publicaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="gestion-container">
      <div class="header">
        <h2>📢 Gestión de Publicaciones</h2>
        <p>Crea y administra los productos o servicios asociados a tu empresa.</p>
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

            <div class="form-group">
              <label>Precio ($)</label>
              <input type="number" formControlName="precio" placeholder="0.00" step="0.01" />
            </div>

            <div class="form-group">
              <label>Descripción</label>
              <textarea formControlName="descripcion" rows="3" placeholder="Detalles del producto o servicio..."></textarea>
            </div>

            <!-- FOTOS -->
            <div class="section-title">Imágenes / Galería (URLs)</div>
            
            <div class="form-group">
              <label>Foto Principal (Foto 1)</label>
              <input type="url" formControlName="foto_1" placeholder="https://ejemplo.com/foto1.jpg" />
            </div>

            <div class="form-group">
              <label>Foto 2 (Opcional)</label>
              <input type="url" formControlName="foto_2" placeholder="https://ejemplo.com/foto2.jpg" />
            </div>

            <div class="form-group">
              <label>Foto 3 (Opcional)</label>
              <input type="url" formControlName="foto_3" placeholder="https://ejemplo.com/foto3.jpg" />
            </div>

            @if (errorMessage) {
              <div class="error-banner">⚠️ {{ errorMessage }}</div>
            }

            <div class="actions-group">
              <button type="submit" class="btn-primary full-width" [disabled]="submitting">
                {{ submitting ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Publicar Ahora') }}
              </button>
              
              @if (editingId) {
                <button type="button" (click)="cancelarEdicion()" class="btn-secondary full-width">
                  Cancelar
                </button>
              }
            </div>
          </form>
        </div>

        <!-- LISTADO DE PUBLICACIONES ACTIVAS -->
        <div class="card list-card">
          <h3>Tus Publicaciones</h3>

          @if (loadingPosts) {
            <p>Cargando publicaciones...</p>
          } @else if (publicaciones.length === 0) {
            <p class="empty-state">No has registrado ningún producto o servicio aún.</p>
          } @else {
            <div class="posts-list">
              @for (post of publicaciones; track post.id) {
                <div class="post-item" [class.selected]="editingId === post.id">
                  <div class="thumb-container">
                    @if (post.foto_1) {
                      <img [src]="post.foto_1" [alt]="post.servicio_producto" class="post-thumb" />
                    } @else {
                      <div class="no-thumb">📦</div>
                    }
                  </div>
                  
                  <div class="post-content">
                    <h4>{{ post.servicio_producto }}</h4>
                    @if (post.precio) {
                      <span class="post-price">&#36;{{ post.precio | number:'1.0-2' }}</span>
                    }
                    <p class="post-desc">{{ post.descripcion }}</p>
                    <span class="post-meta">
                      📅 {{ post.created_at | date:'shortDate' }}
                    </span>
                  </div>

                  <div class="action-buttons">
                    <button (click)="cargarEnFormulario(post)" class="btn-icon btn-edit" title="Editar">
                      ✏️
                    </button>
                    <button (click)="eliminarPublicacion(post.id)" class="btn-icon btn-delete" title="Eliminar">
                      🗑️
                    </button>
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
    .grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 768px) { .grid-layout { grid-template-columns: 1fr; } }
    .card { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .form-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 16px; }
    .form-header h3 { margin: 0; color: #0f172a; }
    .btn-cancel-top { background: none; border: none; color: #ef4444; font-size: 0.8rem; font-weight: 700; cursor: pointer; text-decoration: underline; }
    h3 { margin-top: 0; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
    label { font-size: 0.85rem; font-weight: 700; color: #334155; }
    input, textarea { padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem; }
    .section-title { font-size: 0.85rem; font-weight: 800; color: #0284c7; margin: 14px 0 8px 0; }
    .actions-group { display: flex; gap: 10px; margin-top: 10px; }
    .btn-primary { background: #0284c7; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-primary:hover { background: #0369a1; }
    .btn-secondary { background: #e2e8f0; color: #334155; border: none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-secondary:hover { background: #cbd5e1; }
    .full-width { width: 100%; }
    .posts-list { display: flex; flex-direction: column; gap: 12px; }
    .post-item { display: flex; gap: 12px; align-items: center; border: 1px solid #f1f5f9; padding: 10px; border-radius: 8px; background: #fafafa; transition: border-color 0.2s; }
    .post-item.selected { border: 2px solid #0284c7; background: #f0f9ff; }
    .thumb-container { width: 60px; height: 60px; flex-shrink: 0; }
    .post-thumb { width: 100%; height: 100%; border-radius: 6px; object-fit: cover; }
    .no-thumb { width: 100%; height: 100%; background: #e2e8f0; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .post-content { flex: 1; }
    .post-content h4 { margin: 0; font-size: 0.95rem; }
    .post-price { font-weight: 800; color: #16a34a; font-size: 0.85rem; }
    .post-desc { margin: 4px 0; font-size: 0.85rem; color: #64748b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .post-meta { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
    .action-buttons { display: flex; gap: 6px; }
    .btn-icon { border: none; padding: 8px; border-radius: 6px; cursor: pointer; }
    .btn-edit { background: #e0f2fe; }
    .btn-edit:hover { background: #bae6fd; }
    .btn-delete { background: #fee2e2; }
    .btn-delete:hover { background: #fca5a5; }
    .error-banner { background: #fee2e2; color: #b91c1c; padding: 8px; border-radius: 6px; font-size: 0.85rem; margin-bottom: 10px; }
    .empty-state { color: #94a3b8; font-style: italic; }
  `]
})
export class GestionPublicacionesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  publicaciones: Publicacion[] = [];
  loadingPosts = true;
  submitting = false;
  errorMessage: string | null = null;
  
  // ID para determinar si estamos creando o editando
  editingId: string | null = null;

  postForm: FormGroup = this.fb.group({
    servicio_producto: ['', Validators.required],
    precio: [null],
    descripcion: [''],
    foto_1: [''],
    foto_2: [''],
    foto_3: ['']
  });

  async ngOnInit() {
    await this.cargarPublicaciones();
  }

  /* Cargar publicaciones */
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
    }
    this.loadingPosts = false;
  }

  /* Cargar datos en el formulario para editar */
  cargarEnFormulario(post: Publicacion) {
    this.editingId = post.id;
    this.errorMessage = null;

    this.postForm.patchValue({
      servicio_producto: post.servicio_producto,
      precio: post.precio,
      descripcion: post.descripcion || '',
      foto_1: post.foto_1 || '',
      foto_2: post.foto_2 || '',
      foto_3: post.foto_3 || ''
    });
  }

  /* Cancelar la edición */
  cancelarEdicion() {
    this.editingId = null;
    this.postForm.reset();
    this.errorMessage = null;
  }

  /* Crear o Editar según el estado de editingId */
  async onSubmit() {
    if (this.postForm.invalid) {
      this.errorMessage = 'Por favor ingresa el nombre del servicio o producto.';
      return;
    }

    const user = await this.authService.getUser();
    if (!user) {
      this.errorMessage = 'Debes estar autenticado.';
      return;
    }

    this.submitting = true;
    this.errorMessage = null;

    const { servicio_producto, precio, descripcion, foto_1, foto_2, foto_3 } = this.postForm.value;

    const payload = {
      empresa_id: user.id,
      servicio_producto,
      precio: precio !== null ? precio : null,
      descripcion: descripcion || null,
      foto_1: foto_1 || null,
      foto_2: foto_2 || null,
      foto_3: foto_3 || null,
      updated_at: new Date().toISOString()
    };

    let error = null;

    if (this.editingId) {
      // MODO EDICIÓN (UPDATE)
      const res = await this.authService.getSupabaseClient()
        .from('publicaciones')
        .update(payload)
        .eq('id', this.editingId);
      error = res.error;
    } else {
      // MODO CREACIÓN (INSERT)
      const res = await this.authService.getSupabaseClient()
        .from('publicaciones')
        .insert(payload);
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

  /* Eliminar publicación */
  async eliminarPublicacion(id: string) {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    const { error } = await this.authService.getSupabaseClient()
      .from('publicaciones')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error al eliminar: ' + error.message);
    } else {
      if (this.editingId === id) {
        this.cancelarEdicion();
      }
      await this.cargarPublicaciones();
    }
  }
}