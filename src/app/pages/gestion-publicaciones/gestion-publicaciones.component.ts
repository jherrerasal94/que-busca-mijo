import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
}

export interface Categoria {
  id: string;
  nombre: string;
  icono?: string;
  estado: string;
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
              <button type="submit" class="btn-primary full-width" [disabled]="submitting || uploadingFoto1 || uploadingFoto2 || uploadingFoto3">
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
                      [title]="post.estado === 'inactivo' ? 'Activar' : 'Desactivar'">
                      {{ post.estado === 'inactivo' ? '✅' : '🚫' }}
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
    await this.cargarCategorias();
    await this.cargarPublicaciones();
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
      const res = await this.authService.getSupabaseClient()
        .from('publicaciones')
        .update(payload)
        .eq('id', this.editingId);
      error = res.error;
    } else {
      const res = await this.authService.getSupabaseClient()
        .from('publicaciones')
        .insert({ ...payload, estado: 'activo' });
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