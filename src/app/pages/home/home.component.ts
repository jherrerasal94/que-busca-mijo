import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LikeService } from '../../core/services/like.service'; // 1. Importar el servicio de likes
import { User } from '@supabase/supabase-js';
import { FooterComponent } from '../../shared/components/footer/footer.component';

export interface PublicacionConEmpresa {
  id: string;
  empresa_id: string;
  servicio_producto: string;
  precio: number | null;
  descripcion: string | null;
  foto_1: string | null;
  foto_2: string | null;
  foto_3: string | null;
  created_at: string;
  empresa?: {
    nombre_empresa?: string;
    ciudad?: string;
    departamento?: string;
    telefono?: string;
  };
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

          <!-- BUSCADOR PRINCIPAL -->
          <div class="search-container">
            <div class="search-bar">
              <span class="search-icon">🔍</span>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (input)="filtrarPublicaciones()" 
                placeholder="¿Qué servicio o producto buscas hoy? (Ej: Pizza, Plomería, Mantenimiento)"
                class="search-input"
              />
              @if (searchQuery) {
                <button (click)="limpiarBuscador()" class="btn-clear">✕</button>
              }
              <button class="btn-buscar">Buscar</button>
            </div>
          </div>
        </section>

        <!-- CATEGORÍAS (MOCKUP VISUAL) -->
        <section class="categories-section">
          <div class="categories-list">
            @for (cat of categorias; track cat.nombre) {
              <div class="category-item">
                <div class="category-icon" [class.ver-mas]="cat.nombre === 'Ver más'">
                  {{ cat.icono }}
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
              <p class="section-subtitle">Descubre lo mejor de los negocios de tu región.</p>
            </div>
            <a href="#" class="view-all-link">Ver todas las ofertas ></a>
          </div>

          @if (cargando) {
            <div class="loading-state">Cargando ofertas...</div>
          } @else if (publicacionesFiltradas.length === 0) {
            <div class="empty-state">
              <span class="empty-icon">📦</span>
              <h3>No se encontraron publicaciones</h3>
              <p>Intenta con otros términos de búsqueda.</p>
            </div>
          } @else {
            <div class="cards-grid">
              @for (pub of publicacionesFiltradas; track pub.id) {
                <div class="card" (click)="abrirModal(pub)">
                  <!-- Imagen y Overlays -->
                  <div class="card-image-container">
                    @if (pub.foto_1) {
                      <img [src]="pub.foto_1" [alt]="pub.servicio_producto" class="card-image" />
                    } @else {
                      <div class="card-image-placeholder">🏷️</div>
                    }
                    
                    <!-- BOTÓN DE LIKE INTERactivo -->
                    <button 
                      class="btn-favorite" 
                      [class.liked]="likesMap[pub.id].hasLiked"
                      (click)="$event.stopPropagation(); onToggleLike(pub.id)"
                      title="Dar Me gusta">
                      {{ likesMap[pub.id].hasLiked ? '❤️' : '🤍' }}
                    </button>

                    @if (pub.precio !== null) {
                      <div class="price-tag">&#36;{{ pub.precio | number:'1.0-2' }}</div>
                    }
                  </div>

                  <!-- Info de la Tarjeta -->
                  <div class="card-content">
                    <h3 class="card-title">{{ pub.servicio_producto }}</h3>
                    
                    <div class="card-meta">
                      <!-- CONTADOR DE LIKES VISUAL -->
                      <span class="meta-item">❤️ {{ likesMap[pub.id].total || 0 }} likes</span>
                      <span class="meta-item">📍 1.2 km</span>
                    </div>
                    
                    <p class="business-name">{{ pub.empresa?.nombre_empresa || 'Empresa Local' }}</p>
                    
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

    /* BUSCADOR */
    .search-container {
      max-width: 700px;
      margin: 0 auto;
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

    /* CATEGORÍAS */
    .categories-section {
      margin-bottom: 50px;
      overflow-x: auto;
      padding-bottom: 10px;
    }

    .categories-list {
      display: flex;
      justify-content: center;
      gap: 30px;
      min-width: max-content;
      margin: 0 auto;
    }

    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
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
    }

    .category-icon.ver-mas {
      background: var(--primary);
      color: var(--bg-white);
    }

    .category-name {
      font-size: 0.85rem;
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

    .view-all-link {
      color: #65a30d;
      font-weight: 700;
      text-decoration: none;
      font-size: 0.9rem;
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
      margin: 0 0 8px 0;
      color: var(--primary);
      font-size: 1.1rem;
      font-weight: 800;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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

    .modal-title { color: var(--primary); font-size: 1.6rem; margin: 0 0 10px 0; padding-right: 40px; }
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
    }
  `]
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private likeService = inject(LikeService); // Inyectamos el LikeService

  currentUser: User | null = null;
  transeunteId: string = ''; // ID del transeúnte en la tabla transeuntes
  publicaciones: PublicacionConEmpresa[] = [];
  publicacionesFiltradas: PublicacionConEmpresa[] = [];

  cargando = true;
  searchQuery = '';
  publicacionSeleccionada: PublicacionConEmpresa | null = null;

  // Mapa para almacenar los likes por ID de publicación: { [pubId]: { total, hasLiked } }
  likesMap: { [key: string]: { total: number; hasLiked: boolean } } = {};

  categorias = [
    { nombre: 'Comida', icono: '🍔' },
    { nombre: 'Servicios', icono: '🔧' },
    { nombre: 'Productos', icono: '🛍️' },
    { nombre: 'Belleza', icono: '✂️' },
    { nombre: 'Automotriz', icono: '🚗' },
    { nombre: 'Hogar', icono: '🏠' },
    { nombre: 'Tecnología', icono: '💻' },
    { nombre: 'Eventos', icono: '🎉' },
    { nombre: 'Ver más', icono: '➔' }
  ];

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

    await this.cargarPublicaciones();
  }

  // Obtiene el ID del transeúnte correspondiente al usuario logueado
  async obtenerTranseunteId() {
    if (!this.currentUser) return;
    const { data, error } = await this.authService.getSupabaseClient()
      .from('transeuntes')
      .select('id')
      .eq('id', this.currentUser.id)
      .maybeSingle();

    if (data) {
      this.transeunteId = data.id;
    }
  }

  async cargarPublicaciones() {
    this.cargando = true;
    const { data, error } = await this.authService.getSupabaseClient()
      .from('publicaciones')
      .select('*')
      .eq('estado', 'activo') // <- Opcional pero recomendado para ocultar las inactivas del feed principal
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar publicaciones:', error);
    } else {
      this.publicaciones = (data as PublicacionConEmpresa[]) || [];
      this.publicacionesFiltradas = [...this.publicaciones];

      // Inicializar o cargar los likes de cada publicación obtenida.
      await this.cargarEstadoLikesParaTodas();
    }
    this.cargando = false;
  }

  // Carga el conteo y si el usuario actual le dio like a cada publicación
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

  // Acción al hacer clic en el botón de me gusta
  async onToggleLike(publicacionId: string) {
    if (!this.transeunteId) {
      console.warn('Debes iniciar sesión como transeúnte para dar me gusta.');
      // Opcional: Redirigir al login o mostrar alerta
      return;
    }

    const estadoActual = this.likesMap[publicacionId] || { total: 0, hasLiked: false };

    try {
      // Alternar en Supabase a través del servicio
      const nuevoEstadoLike = await this.likeService.toggleLike(
        publicacionId,
        this.transeunteId,
        estadoActual.hasLiked
      );

      // Actualizar el mapa local instantáneamente
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
    if (!query) {
      this.publicacionesFiltradas = [...this.publicaciones];
      return;
    }

    this.publicacionesFiltradas = this.publicaciones.filter(pub =>
      pub.servicio_producto.toLowerCase().includes(query) ||
      (pub.descripcion && pub.descripcion.toLowerCase().includes(query))
    );
  }

  limpiarBuscador() {
    this.searchQuery = '';
    this.filtrarPublicaciones();
  }

  abrirModal(pub: PublicacionConEmpresa) {
    this.publicacionSeleccionada = pub;
  }

  cerrarModal() {
    this.publicacionSeleccionada = null;
  }
}