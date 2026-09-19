import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LikeService } from '../../core/services/like.service';
import { User } from '@supabase/supabase-js';
import { FooterComponent } from '../../shared/components/footer/footer.component';

export interface PublicacionConEmpresa {
  id: string;
  empresa_id: string;
  categoria_id: string | null;
  servicio_producto: string;
  precio: number | null;
  descripcion: string | null;
  foto_1: string | null;
  foto_2: string | null;
  foto_3: string | null;
  created_at: string;
  empresa?: {
    nombre?: string;
    direccion?: string;
    ciudad_id?: string;
    ciudad?: {
      id?: string;
      nombre?: string;
      departamento?: {
        id?: string;
        nombre?: string;
        pais?: {
          id?: string;
          nombre?: string;
        };
      };
    };
  };
}

export interface Categoria {
  id: string;
  nombre: string;
  icono?: string;
  estado: string;
}

export interface Pais {
  id: string;
  nombre: string;
}

export interface Departamento {
  id: string;
  pais_id: string;
  nombre: string;
}

export interface Ciudad {
  id: string;
  departamento_id: string;
  nombre: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, FooterComponent],
  template: `
    <div class="page-wrapper">
      <main class="main-content">
        
        <!-- HERO SECTION -->
        <section class="hero-section">
          <div class="badge">
            ✨ ¡La plataforma que todo lo encuentra!
          </div>
          
          <h1 class="hero-title">
            ¿Y usted, <span class="text-gradient">qué busca mijo?</span>
          </h1>
          
          <p class="hero-subtitle">
            Explora los productos y servicios ofrecidos por empresas de tu región.<br>
            Rápido, seguro y sin intermediarios.
          </p>

          <!-- BUSCADOR Y FILTROS DE UBICACIÓN -->
          <div class="search-container">
            <div class="search-bar">
              <span class="search-icon">🔍</span>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (input)="filtrarPublicaciones()" 
                placeholder="¿Qué servicio o producto buscas hoy?..."
                class="search-input"
              />
              @if (searchQuery || categoriaSeleccionadaId || filtroPaisId || filtroDepartamentoId || filtroCiudadId) {
                <button (click)="limpiarBuscador()" class="btn-clear" title="Limpiar filtros">✕</button>
              }
              <button class="btn-buscar">Buscar</button>
            </div>

            <!-- FILTROS GEOGRÁFICOS EN CASCADA -->
            <div class="filters-row">
              <select [(ngModel)]="filtroPaisId" (change)="onPaisChange(); filtrarPublicaciones()" class="filter-select">
                <option value="">🌍 Todos los países</option>
                @for (p of paises; track p.id) {
                  <option [value]="p.id">{{ p.nombre }}</option>
                }
              </select>

              <select [(ngModel)]="filtroDepartamentoId" (change)="onDepartamentoChange(); filtrarPublicaciones()" class="filter-select" [disabled]="!filtroPaisId">
                <option value="">🗺️ Todos los departamentos</option>
                @for (d of departamentosFiltrados; track d.id) {
                  <option [value]="d.id">{{ d.nombre }}</option>
                }
              </select>

              <select [(ngModel)]="filtroCiudadId" (change)="filtrarPublicaciones()" class="filter-select" [disabled]="!filtroDepartamentoId">
                <option value="">🏙️ Todas las ciudades</option>
                @for (c of ciudadesFiltradas; track c.id) {
                  <option [value]="c.id">{{ c.nombre }}</option>
                }
              </select>
            </div>
          </div>
        </section>

        <!-- CATEGORÍAS DINÁMICAS -->
        <section class="categories-section">
          <div class="categories-list">
            <div class="category-item" (click)="seleccionarCategoria(null)">
              <div class="category-icon" [class.active-cat]="!categoriaSeleccionadaId">
                🏠
              </div>
              <span class="category-name">Todas</span>
            </div>

            @for (cat of categorias; track cat.id) {
              <div class="category-item" (click)="seleccionarCategoria(cat.id)">
                <div class="category-icon" [class.active-cat]="categoriaSeleccionadaId === cat.id">
                  {{ cat.icono || '📁' }}
                </div>
                <span class="category-name">{{ cat.nombre }}</span>
              </div>
            }
          </div>
        </section>

        <!-- SECCIÓN DE OFERTAS -->
        <section class="offers-section">
          <div class="section-header">
            <div>
              <h2 class="section-title">🛍️ Ofertas cerca de ti</h2>
              <p class="section-subtitle">
                Descubre lo mejor de los negocios de tu región seleccionada.
              </p>
            </div>
          </div>

          @if (cargando) {
            <div class="loading-state">Cargando ofertas...</div>
          } @else if (publicacionesFiltradas.length === 0) {
            <div class="empty-state">
              <span class="empty-icon">📦</span>
              <h3>No se encontraron publicaciones</h3>
              <p>Intenta con otros términos, cambia de categoría o amplía tu ubicación.</p>
            </div>
          } @else {
            <div class="cards-grid">
              @for (pub of publicacionesFiltradas; track pub.id) {
                <div class="card" (click)="abrirModal(pub)">
                  <div class="card-image-container">
                    @if (pub.foto_1) {
                      <img [src]="pub.foto_1" [alt]="pub.servicio_producto" class="card-image" />
                    } @else {
                      <div class="card-image-placeholder">🏷️</div>
                    }
                    
                    <button 
                      class="btn-favorite" 
                      [class.liked]="likesMap[pub.id]?.hasLiked"
                      (click)="$event.stopPropagation(); onToggleLike(pub.id)"
                      title="Dar Me gusta">
                      {{ likesMap[pub.id]?.hasLiked ? '❤️' : '🤍' }}
                    </button>

                    @if (pub.precio !== null) {
                      <div class="price-tag">&#36;{{ pub.precio | number:'1.0-2' }}</div>
                    }
                  </div>

                  <div class="card-content">
                    <h3 class="card-title">{{ pub.servicio_producto }}</h3>

                    @if (pub.categoria_id) {
                      <span class="card-category-badge">📁 {{ obtenerNombreCategoria(pub.categoria_id) }}</span>
                    }
                    
                    <div class="card-meta">
                      <span class="meta-item">❤️ {{ likesMap[pub.id]?.total || 0 }} likes</span>
                      <span class="meta-item">📍 {{ pub.empresa?.ciudad?.nombre || 'Región' }}</span>
                    </div>
                    
                    <p class="business-name">🏢 {{ pub.empresa?.nombre || 'Empresa Local' }}</p>
                    
                    <button class="btn-outline">
                      Ver detalle ➔
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <!-- SECCIÓN DE BENEFICIOS / FEATURES -->
        <section class="features-section">
          <div class="feature-item">
            <div class="feature-icon">🛡️</div>
            <div class="feature-text">
              <h4>Negocios verificados</h4>
              <p>Empresas confiables de tu región</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📍</div>
            <div class="feature-text">
              <h4>Cerca de ti</h4>
              <p>Encuentra opciones en tu zona</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🤝</div>
            <div class="feature-text">
              <h4>Sin intermediarios</h4>
              <p>Trato directo con el negocio</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🔒</div>
            <div class="feature-text">
              <h4>Pago seguro</h4>
              <p>Tus datos siempre protegidos</p>
            </div>
          </div>
        </section>
      </main>

      <!-- MODAL DETALLE DE PUBLICACIÓN -->
      @if (publicacionSeleccionada) {
        <div class="modal-overlay" (click)="cerrarModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <button class="btn-close-modal" (click)="cerrarModal()">✕</button>
            
            <h2 class="modal-title">{{ publicacionSeleccionada.servicio_producto }}</h2>
            <p class="business-name" style="margin-bottom: 8px;">🏢 {{ publicacionSeleccionada.empresa?.nombre || 'Empresa Local' }}</p>
            <p class="text-muted" style="font-size: 0.9rem; margin-top:0;">
              📍 {{ publicacionSeleccionada.empresa?.ciudad?.nombre }}, 
              {{ publicacionSeleccionada.empresa?.ciudad?.departamento?.nombre }}, 
              {{ publicacionSeleccionada.empresa?.ciudad?.departamento?.pais?.nombre }}
            </p>

            @if (publicacionSeleccionada.precio !== null) {
              <div class="modal-price">&#36;{{ publicacionSeleccionada.precio | number:'1.0-2' }}</div>
            }

            <div class="modal-gallery">
              @if (publicacionSeleccionada.foto_1) { <img [src]="publicacionSeleccionada.foto_1" alt="Foto 1" /> }
              @if (publicacionSeleccionada.foto_2) { <img [src]="publicacionSeleccionada.foto_2" alt="Foto 2" /> }
              @if (publicacionSeleccionada.foto_3) { <img [src]="publicacionSeleccionada.foto_3" alt="Foto 3" /> }
            </div>

            <div class="modal-desc">
              <h4>Descripción:</h4>
              <p>{{ publicacionSeleccionada.descripcion || 'Sin descripción disponible.' }}</p>
            </div>
            
            <button class="btn-primary full-width" (click)="cerrarModal()">Cerrar Detalle</button>
          </div>
        </div>
      }

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
      --bg-white: #ffffff;
      font-family: 'Segoe UI', Roboto, sans-serif;
    }

    .page-wrapper {
      background-color: var(--bg-white);
      min-height: calc(100vh - 78px);
      display: flex;
      flex-direction: column;
    }

    .main-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      width: 100%;
      box-sizing: border-box;
      flex: 1;
    }

    /* HERO SECTION */
    .hero-section {
      text-align: center;
      margin-bottom: 40px;
    }

    .badge {
      display: inline-block;
      background-color: var(--primary);
      color: var(--accent);
      padding: 6px 16px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.85rem;
      margin-bottom: 24px;
    }

    .hero-title {
      font-size: clamp(2.5rem, 5vw, 3.5rem);
      font-weight: 900;
      color: var(--primary);
      margin-bottom: 16px;
      line-height: 1.1;
    }

    .text-gradient {
      color: var(--accent);
    }

    .hero-subtitle {
      font-size: 1.1rem;
      color: var(--text-muted);
      margin-bottom: 32px;
      line-height: 1.5;
    }

    /* BUSCADOR Y FILTROS */
    .search-container {
      max-width: 750px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .search-bar {
      display: flex;
      align-items: center;
      background: var(--bg-white);
      border: 2px solid var(--primary);
      border-radius: 999px;
      padding: 6px 6px 6px 20px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 1rem;
      padding: 10px;
      color: var(--text-main);
    }

    .search-input::placeholder {
      color: #94a3b8;
    }

    .btn-buscar {
      background: var(--accent);
      color: var(--primary);
      border: none;
      padding: 12px 28px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 1rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-buscar:hover {
      opacity: 0.9;
    }

    .btn-clear {
      background: #e2ebd8;
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      cursor: pointer;
      color: var(--primary);
      margin-right: 10px;
    }

    .filters-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .filter-select {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 0.9rem;
      color: var(--text-main);
      outline: none;
      cursor: pointer;
    }

    .filter-select:disabled {
      background: #f1f5f9;
      color: #94a3b8;
      cursor: not-allowed;
    }

    /* CATEGORÍAS */
    .categories-section {
      margin-bottom: 50px;
      overflow-x: auto;
      padding-bottom: 10px;
    }

    .categories-list {
      display: flex;
      justify-content: center;
      gap: 20px;
      min-width: max-content;
      margin: 0 auto;
    }

    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .category-item:hover {
      transform: translateY(-3px);
    }

    .category-icon {
      width: 60px;
      height: 60px;
      background: var(--bg-page);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      border: 2px solid transparent;
      transition: all 0.2s;
    }

    .category-icon.active-cat {
      border-color: var(--primary);
      background: #e0f2fe;
    }

    .category-name {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--primary);
    }

    /* OFERTAS */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 1.5rem;
      color: var(--primary);
      margin: 0 0 4px 0;
    }

    .section-subtitle {
      color: var(--text-muted);
      margin: 0;
      font-size: 0.95rem;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 24px;
      margin-bottom: 60px;
    }

    .card {
      background: var(--bg-white);
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.2s;
    }

    .card:hover {
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
      transform: translateY(-4px);
    }

    .card-image-container {
      position: relative;
      height: 200px;
      background: var(--bg-page);
    }

    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .card-image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
    }

    .btn-favorite {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(255,255,255,0.9);
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 1.2rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }

    .btn-favorite:hover {
      transform: scale(1.1);
    }

    .btn-favorite.liked {
      background: #fee2e2;
    }

    .price-tag {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: var(--accent);
      color: var(--primary);
      font-weight: 900;
      padding: 6px 14px;
      border-radius: 12px;
      font-size: 0.95rem;
    }

    .card-content {
      padding: 20px;
    }

    .card-title {
      margin: 0 0 6px 0;
      color: var(--primary);
      font-size: 1.1rem;
      font-weight: 800;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-category-badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      color: #0369a1;
      background: #e0f2fe;
      padding: 2px 6px;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .card-meta {
      display: flex;
      gap: 16px;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .business-name {
      font-size: 0.9rem;
      color: var(--text-main);
      font-weight: 600;
      margin: 0 0 16px 0;
    }

    .btn-outline {
      width: 100%;
      background: transparent;
      border: 2px solid #e2ebd8;
      color: #65a30d;
      padding: 10px;
      border-radius: 999px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-outline:hover {
      border-color: var(--accent);
      color: var(--primary);
      background: #f4f8f1;
    }

    /* FEATURES BOTTOM */
    .features-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      padding-top: 40px;
      border-top: 1px solid #e2e8f0;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .feature-icon {
      font-size: 1.5rem;
      background: var(--bg-page);
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
    }

    .feature-text h4 {
      margin: 0 0 4px 0;
      color: var(--primary);
      font-size: 0.95rem;
    }

    .feature-text p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    /* MODAL */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 43, 102, 0.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 2000; padding: 20px; box-sizing: border-box;
    }

    .modal-content {
      background: #fff;
      border-radius: 24px;
      max-width: 600px; width: 100%;
      max-height: 90vh; overflow-y: auto;
      padding: 28px; position: relative;
    }

    .btn-close-modal {
      position: absolute; top: 16px; right: 16px;
      background: #f1f5f9; border: none; border-radius: 50%;
      width: 36px; height: 36px; font-weight: bold; cursor: pointer;
    }

    .modal-title { color: var(--primary); font-size: 1.6rem; margin: 0 0 4px 0; padding-right: 40px; }
    .modal-price { font-size: 1.5rem; font-weight: 900; color: #4eb200; margin-bottom: 16px; }
    .modal-gallery { display: flex; gap: 10px; overflow-x: auto; margin-bottom: 20px; }
    .modal-gallery img { height: 200px; border-radius: 12px; object-fit: cover; }
    .modal-desc h4 { color: var(--primary); margin: 0 0 6px 0; }
    .modal-desc p { color: var(--text-muted); margin: 0; line-height: 1.5; }
    
    .btn-primary {
      background: var(--primary); color: var(--accent); border: none;
      padding: 12px; border-radius: 14px; font-weight: 800; cursor: pointer;
      margin-top: 24px;
    }
    .full-width { width: 100%; }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .search-bar { padding: 4px 4px 4px 16px; }
      .search-input { font-size: 0.9rem; }
      .btn-buscar { padding: 10px 20px; }
      .categories-list { justify-content: flex-start; }
      .section-header { flex-direction: column; align-items: flex-start; gap: 10px; }
      .filters-row { grid-template-columns: 1fr; }
    }
  `]
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private likeService = inject(LikeService);

  currentUser: User | null = null;
  transeunteId: string = '';
  publicaciones: PublicacionConEmpresa[] = [];
  publicacionesFiltradas: PublicacionConEmpresa[] = [];
  
  categorias: Categoria[] = [];
  paises: Pais[] = [];
  departamentos: Departamento[] = [];
  departamentosFiltrados: Departamento[] = [];
  ciudades: Ciudad[] = [];
  ciudadesFiltradas: Ciudad[] = [];

  cargando = true;
  searchQuery = '';
  categoriaSeleccionadaId: string | null = null;
  
  filtroPaisId = '';
  filtroDepartamentoId = '';
  filtroCiudadId = '';

  publicacionSeleccionada: PublicacionConEmpresa | null = null;
  likesMap: { [key: string]: { total: number; hasLiked: boolean } } = {};

  async ngOnInit() {
    this.currentUser = await this.authService.getUser();

    if (this.currentUser) {
      await this.obtenerTranseunteId();
    }

    this.authService.onAuthStateChange(async (_event, session) => {
      this.currentUser = session ? session.user : null;
      if (this.currentUser) {
        await this.obtenerTranseunteId();
      } else {
        this.transeunteId = '';
      }
    });

    await this.cargarCatalogosGeograficos();
    await this.cargarCategorias();
    await this.cargarPublicaciones();
  }

  async obtenerTranseunteId() {
    if (!this.currentUser) return;
    const { data } = await this.authService.getSupabaseClient()
      .from('transeuntes')
      .select('id')
      .eq('id', this.currentUser.id)
      .maybeSingle();

    if (data) {
      this.transeunteId = data.id;
    }
  }

  async cargarCatalogosGeograficos() {
    const supabase = this.authService.getSupabaseClient();

    const resPaises = await supabase.from('paises').select('id, nombre').order('nombre');
    this.paises = resPaises.data || [];

    const resDepts = await supabase.from('departamentos').select('id, pais_id, nombre').order('nombre');
    this.departamentos = resDepts.data || [];

    const resCiudades = await supabase.from('ciudades').select('id, departamento_id, nombre').order('nombre');
    this.ciudades = resCiudades.data || [];
  }

  onPaisChange() {
    this.filtroDepartamentoId = '';
    this.filtroCiudadId = '';
    this.ciudadesFiltradas = [];

    if (this.filtroPaisId) {
      this.departamentosFiltrados = this.departamentos.filter(d => d.pais_id === this.filtroPaisId);
    } else {
      this.departamentosFiltrados = [];
    }
  }

  onDepartamentoChange() {
    this.filtroCiudadId = '';
    if (this.filtroDepartamentoId) {
      this.ciudadesFiltradas = this.ciudades.filter(c => c.departamento_id === this.filtroDepartamentoId);
    } else {
      this.ciudadesFiltradas = [];
    }
  }

  async cargarCategorias() {
    const { data } = await this.authService.getSupabaseClient()
      .from('categorias')
      .select('id, nombre, icono, estado')
      .eq('estado', 'activo')
      .order('nombre', { ascending: true });

    this.categorias = (data as Categoria[]) || [];
  }

  obtenerNombreCategoria(categoriaId: string): string {
    const cat = this.categorias.find(c => c.id === categoriaId);
    return cat ? `${cat.icono || ''} ${cat.nombre}` : 'Categoría';
  }

  async cargarPublicaciones() {
    this.cargando = true;
    
    // Consulta multinivel partiendo correctamente desde la empresa hacia la ciudad, departamento y país
    const { data, error } = await this.authService.getSupabaseClient()
      .from('publicaciones')
      .select(`
        *,
        empresa:empresas (
          nombre,
          direccion,
          ciudad_id,
          ciudad:ciudades (
            id,
            nombre,
            departamento:departamentos (
              id,
              nombre,
              pais:paises (
                id,
                nombre
              )
            )
          )
        )
      `)
      .eq('estado', 'activo')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar publicaciones con ubicación de empresa:', error);
    } else {
      this.publicaciones = (data as PublicacionConEmpresa[]) || [];
      this.publicacionesFiltradas = [...this.publicaciones];
      await this.cargarEstadoLikesParaTodas();
    }
    this.cargando = false;
  }

  async cargarEstadoLikesParaTodas() {
    for (const pub of this.publicaciones) {
      const total = await this.likeService.contarLikes(pub.id);
      let hasLiked = false;

      if (this.transeunteId) {
        hasLiked = await this.likeService.verificarSiDioLike(pub.id, this.transeunteId);
      }

      this.likesMap[pub.id] = { total, hasLiked };
    }
  }

  async onToggleLike(publicacionId: string) {
    if (!this.transeunteId) {
      console.warn('Debes iniciar sesión como transeúnte para dar me gusta.');
      return;
    }

    const estadoActual = this.likesMap[publicacionId] || { total: 0, hasLiked: false };

    try {
      const nuevoEstadoLike = await this.likeService.toggleLike(
        publicacionId,
        this.transeunteId,
        estadoActual.hasLiked
      );

      const nuevoTotal = nuevoEstadoLike ? estadoActual.total + 1 : Math.max(0, estadoActual.total - 1);

      this.likesMap[publicacionId] = {
        total: nuevoTotal,
        hasLiked: nuevoEstadoLike
      };
    } catch (error) {
      console.error('Error al procesar el like:', error);
    }
  }

  filtrarPublicaciones() {
    const query = this.searchQuery.toLowerCase().trim();

    this.publicacionesFiltradas = this.publicaciones.filter(pub => {
      const cumpleQuery = !query || 
        pub.servicio_producto.toLowerCase().includes(query) ||
        (pub.descripcion && pub.descripcion.toLowerCase().includes(query)) ||
        (pub.empresa?.nombre && pub.empresa.nombre.toLowerCase().includes(query)) ||
        (pub.empresa?.ciudad?.nombre && pub.empresa.ciudad.nombre.toLowerCase().includes(query));

      const cumpleCategoria = !this.categoriaSeleccionadaId || pub.categoria_id === this.categoriaSeleccionadaId;

      const ciudadObj = pub.empresa?.ciudad;
      const deptoObj = ciudadObj?.departamento;
      const paisObj = deptoObj?.pais;

      const cumplePais = !this.filtroPaisId || paisObj?.id === this.filtroPaisId;
      const cumpleDepto = !this.filtroDepartamentoId || deptoObj?.id === this.filtroDepartamentoId;
      const cumpleCiudad = !this.filtroCiudadId || ciudadObj?.id === this.filtroCiudadId;

      return cumpleQuery && cumpleCategoria && cumplePais && cumpleDepto && cumpleCiudad;
    });
  }

  seleccionarCategoria(categoriaId: string | null) {
    this.categoriaSeleccionadaId = categoriaId;
    this.filtrarPublicaciones();
  }

  limpiarBuscador() {
    this.searchQuery = '';
    this.categoriaSeleccionadaId = null;
    this.filtroPaisId = '';
    this.filtroDepartamentoId = '';
    this.filtroCiudadId = '';
    this.departamentosFiltrados = [];
    this.ciudadesFiltradas = [];
    this.filtrarPublicaciones();
  }

  abrirModal(pub: PublicacionConEmpresa) {
    this.publicacionSeleccionada = pub;
  }

  cerrarModal() {
    this.publicacionSeleccionada = null;
  }
}