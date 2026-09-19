import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  estado: 'activo' | 'inactivo'; // O el tipo equivalente a estado_registro
  created_at: string;
}

@Component({
  selector: 'app-gestion-categorias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="admin-container">
      <div class="header-section">
        <div>
          <h2>⚙️ Gestión de Categorías</h2>
          <p class="subtitle">Crea, edita o cambia el estado de las categorías de publicaciones.</p>
        </div>
        <button class="btn-primary" (click)="abrirModal()">+ Nueva Categoría</button>
      </div>

      @if (cargando) {
        <div class="loading">Cargando categorías...</div>
      } @else {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ícono</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Fecha Creación</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (cat of categorias; track cat.id) {
                <tr>
                  <td><span class="icon-preview">{{ cat.icono || '📂' }}</span></td>
                  <td><strong>{{ cat.nombre }}</strong></td>
                  <td>
                    <span class="badge" [class.active]="cat.estado === 'activo'" [class.inactive]="cat.estado !== 'activo'">
                      {{ cat.estado | uppercase }}
                    </span>
                  </td>
                  <td>{{ cat.created_at | date:'mediumDate' }}</td>
                  <td class="text-right actions-cell">
                    <button class="btn-icon" title="Editar" (click)="editarCategoria(cat)">✏️</button>
                    @if (cat.estado === 'activo') {
                      <button class="btn-icon danger" title="Inactivar" (click)="cambiarEstado(cat, 'inactivo')">🚫</button>
                    } @else {
                      <button class="btn-icon success" title="Activar" (click)="cambiarEstado(cat, 'activo')">✅</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="empty-state">No hay categorías registradas.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- MODAL DE CREAR / EDITAR -->
      @if (modalAbierto) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <h3>{{ editandoId ? 'Editar Categoría' : 'Nueva Categoría' }}</h3>
            
            <form [formGroup]="catForm" (ngSubmit)="guardarCategoria()">
              <div class="form-group">
                <label>Nombre de la Categoría *</label>
                <input type="text" formControlName="nombre" placeholder="Ej. Tecnología, Inmobiliaria..." />
              </div>

              <div class="form-group">
                <label>Ícono (Emoji o Clase)</label>
                <input type="text" formControlName="icono" placeholder="Ej. 💻 o bi-laptop" />
              </div>

              @if (errorForm) {
                <div class="error-msg">{{ errorForm }}</div>
              }

              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="cerrarModal()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="guardando">
                  {{ guardando ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-container { padding: 30px; max-width: 1100px; margin: 0 auto; font-family: 'Segoe UI', Roboto, sans-serif; }
    .header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h2 { color: #002b66; margin: 0; font-size: 1.8rem; }
    .subtitle { color: #64748b; font-size: 0.9rem; margin-top: 4px; }
    
    .btn-primary { background: #002b66; color: #64d500; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; }
    
    .table-card { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
    .data-table th { background: #f8fafc; color: #002b66; padding: 14px 16px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: middle; }
    
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; }
    .badge.active { background: #ecfdf5; color: #059669; }
    .badge.inactive { background: #fef2f2; color: #dc2626; }
    
    .text-right { text-align: right; }
    .actions-cell { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-icon { background: #f1f5f9; border: none; width: 34px; height: 34px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn-icon:hover { background: #e2e8f0; }
    
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .modal-card { background: #fff; padding: 25px; border-radius: 16px; width: 100%; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
    .modal-card h3 { color: #002b66; margin-top: 0; margin-bottom: 20px; }
    
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    label { font-size: 0.85rem; font-weight: 700; color: #002b66; }
    input { padding: 10px 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 0.9rem; }
    input:focus { outline: none; border-color: #002b66; }
    
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .error-msg { color: #dc2626; font-size: 0.85rem; font-weight: 600; margin-bottom: 10px; }
    .loading { text-align: center; padding: 40px; color: #64748b; font-weight: 600; }
  `]
})
export class GestionCategoriasComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  categorias: Categoria[] = [];
  cargando = true;
  modalAbierto = false;
  guardando = false;
  editandoId: string | null = null;
  errorForm: string | null = null;

  catForm = this.fb.group({
    nombre: ['', Validators.required],
    icono: ['']
  });

  async ngOnInit() {
    await this.cargarCategorias();
  }

  async cargarCategorias() {
    this.cargando = true;
    try {
      const supabase = this.authService.getSupabaseClient();
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      if (data) this.categorias = data;
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    } finally {
      this.cargando = false;
    }
  }

  abrirModal() {
    this.editandoId = null;
    this.catForm.reset();
    this.errorForm = null;
    this.modalAbierto = true;
  }

  editarCategoria(cat: Categoria) {
    this.editandoId = cat.id;
    this.catForm.patchValue({
      nombre: cat.nombre,
      icono: cat.icono
    });
    this.errorForm = null;
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
  }

  async guardarCategoria() {
    if (this.catForm.invalid) {
      this.errorForm = 'El nombre de la categoría es obligatorio.';
      return;
    }

    this.guardando = true;
    this.errorForm = null;
    const formValues = this.catForm.value;

    try {
      const supabase = this.authService.getSupabaseClient();

      if (this.editandoId) {
        // Actualizar
        const { error } = await supabase
          .from('categorias')
          .update({
            nombre: formValues.nombre,
            icono: formValues.icono,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.editandoId);

        if (error) throw error;
      } else {
        // Crear nuevo (por defecto activo)
        const { error } = await supabase
          .from('categorias')
          .insert({
            nombre: formValues.nombre,
            icono: formValues.icono,
            estado: 'activo'
          });

        if (error) throw error;
      }

      this.cerrarModal();
      await this.cargarCategorias();
    } catch (err: any) {
      console.error('Error al guardar categoría:', err);
      this.errorForm = err.message || 'Ocurrió un error al guardar.';
    } finally {
      this.guardando = false;
    }
  }

  async cambiarEstado(cat: Categoria, nuevoEstado: 'activo' | 'inactivo') {
    try {
      const supabase = this.authService.getSupabaseClient();
      const { error } = await supabase
        .from('categorias')
        .update({ 
          estado: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq('id', cat.id);

      if (error) throw error;
      await this.cargarCategorias();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    }
  }
}