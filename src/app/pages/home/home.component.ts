import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LikeService } from '../../core/services/like.service';
import { User } from '@supabase/supabase-js';
import { FooterComponent } from '../../shared/components/footer/footer.component';

export interface RedSocial {
  id: string;
  empresa_id: string;
  plataforma?: string | null;
  plataforma_id?: string | null;
  url: string;
}

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
    logo?: string | null;
    ciudad_id?: string;
    redes_sociales?: RedSocial[];
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
  imports: [CommonModule, FormsModule, RouterLink, FooterComponent],
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
              <div class="category-icon category-icon-neutral" [class.active-cat]="!categoriaSeleccionadaId">
                🏠
              </div>
              <span class="category-name">Todas</span>
            </div>

            @for (cat of categorias; track cat.id; let i = $index) {
              <div class="category-item" (click)="seleccionarCategoria(cat.id)">
                <div
                  class="category-icon"
                  [class.active-cat]="categoriaSeleccionadaId === cat.id"
                  [style.background]="colorCategoria(i).bg"
                  [style.color]="colorCategoria(i).fg">
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
              <h2 class="section-title">🔥 Cerca de ti</h2>
              <p class="section-subtitle">
                Productos y servicios cerca de tu ubicación.
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
                      {{ likesMap[pub.id]?.hasLiked ? '❤' : '🤍' }}
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

        <!-- CTA PARA NEGOCIOS -->
        <section class="business-cta-section">
          <div class="business-cta-card">
            <div>
              <h3 class="business-cta-title">🏪 ¿Tienes un negocio?</h3>
              <p class="business-cta-subtitle">Haz que tus clientes te encuentren.</p>
            </div>
            <a routerLink="/register" class="btn-cta-negocio">Publicar gratis</a>
          </div>
        </section>

        <!-- NEGOCIOS DESTACADOS -->
        @if (empresasDestacadas.length > 0) {
          <section class="featured-section">
            <h2 class="section-title">⭐ Negocios destacados</h2>
            <div class="featured-list">
              @for (emp of empresasDestacadas; track emp.id; let i = $index) {
                <a class="featured-item" [routerLink]="['/empresa', emp.id]">
                  @if (emp.logo) {
                    <div class="featured-avatar featured-avatar-img-wrap">
                      <img [src]="emp.logo" [alt]="emp.nombre" class="featured-avatar-img" />
                    </div>
                  } @else {
                    <div
                      class="featured-avatar"
                      [style.background]="colorCategoria(i).bg"
                      [style.color]="colorCategoria(i).fg">
                      {{ obtenerInicialesEmpresa(emp.nombre) }}
                    </div>
                  }
                  <span class="featured-name">{{ emp.nombre }}</span>
                </a>
              }
            </div>
          </section>
        }

        <!-- SECCIÓN DE BENEFICIOS / FEATURES -->
        <section class="features-section-wrapper">
          <h2 class="section-title features-title">¿Por qué nosotros?</h2>
          <div class="features-section">
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
          </div>
        </section>
      </main>

      <!-- MODAL DETALLE DE PUBLICACIÓN -->
      @if (publicacionSeleccionada) {
        <div
          class="modal-overlay"
          (click)="cerrarModal()"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <button class="btn-close-modal" (click)="cerrarModal()" title="Cerrar" aria-label="Cerrar detalle">✕</button>

            <!-- IMAGEN PRINCIPAL CON ZOOM POR CLIC -->
            <div
              class="modal-gallery-main"
              [class.is-fullscreen]="isZoomed"
              (click)="toggleZoomFullscreen()">
              @if (imagenSeleccionada) {
                <img
                  [src]="imagenSeleccionada"
                  [alt]="publicacionSeleccionada.servicio_producto"
                  class="gallery-main-img"
                  [class.zoomed]="isZoomed" />
              } @else {
                <div class="gallery-placeholder">🏷️</div>
              }

              <!-- Indicador visual de zoom -->
              <div class="zoom-hint">
                {{ isZoomed ? '🔍 Clic para alejar' : '🔍 Haz clic para ampliar imagen' }}
              </div>

              @if (publicacionSeleccionada.categoria_id) {
                <span class="modal-category-badge">📁 {{ obtenerNombreCategoria(publicacionSeleccionada.categoria_id) }}</span>
              }

              @if (publicacionSeleccionada.precio !== null) {
                <div class="modal-price-badge">&#36;{{ publicacionSeleccionada.precio | number:'1.0-2' }}</div>
              }
            </div>

            <!-- MINIATURAS -->
            @if (fotosPublicacionSeleccionada.length > 1) {
              <div class="modal-thumbnails">
                @for (foto of fotosPublicacionSeleccionada; track foto) {
                  <button
                    type="button"
                    class="thumbnail-btn"
                    [class.active]="foto === imagenSeleccionada"
                    (click)="seleccionarImagen(foto)">
                    <img [src]="foto" alt="Miniatura de la publicación" />
                  </button>
                }
              </div>
            }

            <div class="modal-body">
              <h2 class="modal-title" id="modal-title">{{ publicacionSeleccionada.servicio_producto }}</h2>

              <div class="modal-meta-row">
                <span class="modal-business">🏢 {{ publicacionSeleccionada.empresa?.nombre || 'Empresa Local' }}</span>
                <span class="modal-location">📍 {{ obtenerUbicacionTexto(publicacionSeleccionada) }}</span>
              </div>

              <div class="modal-desc">
                <h4>Descripción</h4>
                <p>{{ publicacionSeleccionada.descripcion || 'Sin descripción disponible.' }}</p>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-outline-modal" (click)="cerrarModal()">Cerrar</button>
                @if (obtenerLinkWhatsapp(publicacionSeleccionada); as linkWhatsapp) {
                  <a
                    class="btn-whatsapp"
                    [href]="linkWhatsapp"
                    target="_blank"
                    rel="noopener noreferrer">
                    💬 WhatsApp
                  </a>
                }
                <a
                  class="btn-primary"
                  [routerLink]="['/empresa', publicacionSeleccionada.empresa_id]"
                  (click)="cerrarModal()">
                  🏢 Ver negocio
                </a>
              </div>
            </div>
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

    /* Evita que padding + width:100% desborde el contenedor (causa real
       de los botones "deformados" en mobile: Buscar y Publicar gratis). */
    * {
      box-sizing: border-box;
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
      background: var(--primary);
      border-radius: 28px;
      padding: 56px 32px;
      text-align: center;
      margin-bottom: 40px;
    }

    .badge {
      display: inline-block;
      background-color: var(--accent);
      color: var(--primary);
      padding: 6px 16px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.85rem;
      margin-bottom: 24px;
    }

    .hero-title {
      font-size: clamp(2.5rem, 5vw, 3.5rem);
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 16px;
      line-height: 1.1;
    }

    .text-gradient {
      color: var(--accent);
    }

    .hero-subtitle {
      font-size: 1.1rem;
      color: #b8c6dd;
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
      border: 2px solid var(--bg-white);
      border-radius: 999px;
      padding: 6px 6px 6px 20px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    }

    .search-input {
      flex: 1;
      min-width: 0;
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
      flex-shrink: 0;
      white-space: nowrap;
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
      background: var(--bg-white);
      border: none;
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 0.9rem;
      color: var(--text-main);
      outline: none;
      cursor: pointer;
    }

    .filter-select:disabled {
      background: #dbe6ef;
      color: #94a3b8;
      cursor: not-allowed;
    }

    /* CATEGORÍAS */
    .categories-section {
      margin-bottom: 50px;
      overflow-x: auto;
      padding-bottom: 10px;
      -webkit-overflow-scrolling: touch;
      scroll-snap-type: x proximity;
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
      scroll-snap-align: start;
    }

    .category-item:hover {
      transform: translateY(-3px);
    }

    .category-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      border: 2px solid transparent;
      transition: all 0.2s;
    }

    .category-icon-neutral {
      background: var(--bg-page);
      color: var(--primary);
    }

    .category-icon.active-cat {
      border-color: var(--primary);
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

    /* CTA NEGOCIOS */
    .business-cta-section {
      margin-bottom: 50px;
    }

    .business-cta-card {
      background: #eaf3de;
      border-radius: 20px;
      padding: 28px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }

    .business-cta-title {
      margin: 0 0 4px 0;
      color: var(--primary);
      font-size: 1.2rem;
    }

    .business-cta-subtitle {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .btn-cta-negocio {
      display: inline-block;
      background: var(--primary);
      color: #ffffff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.95rem;
      white-space: nowrap;
      transition: opacity 0.2s;
    }

    .btn-cta-negocio:hover {
      opacity: 0.9;
    }

    /* DESTACADOS */
    .featured-section {
      margin-bottom: 50px;
    }

    .featured-list {
      display: flex;
      gap: 24px;
      overflow-x: auto;
      padding-bottom: 4px;
      -webkit-overflow-scrolling: touch;
      scroll-snap-type: x proximity;
    }

    .featured-item {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      flex-shrink: 0;
      scroll-snap-align: start;
    }

    .featured-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.85rem;
      flex-shrink: 0;
    }

    .featured-avatar-img-wrap {
      background: var(--bg-page);
      overflow: hidden;
    }

    .featured-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .featured-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--primary);
      white-space: nowrap;
    }

    /* FEATURES BOTTOM */
    .features-section-wrapper {
      padding-top: 40px;
      border-top: 1px solid #e2e8f0;
    }

    .features-title {
      margin-bottom: 20px;
    }

    .features-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
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
      background: rgba(0, 43, 102, 0.55);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 2000; padding: 20px; box-sizing: border-box;
      animation: overlayFadeIn 0.2s ease-out;
    }

    .modal-content {
      background: #fff;
      border-radius: 24px;
      max-width: 640px; width: 100%;
      max-height: 90vh; overflow-y: auto;
      position: relative;
      box-shadow: 0 25px 60px rgba(0, 43, 102, 0.35);
      animation: modalPopIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes overlayFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalPopIn {
      from { opacity: 0; transform: scale(0.94) translateY(12px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .btn-close-modal {
      position: absolute; top: 16px; right: 16px; z-index: 5;
      background: rgba(255,255,255,0.92); border: none; border-radius: 50%;
      width: 38px; height: 38px; font-weight: bold; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--primary); box-shadow: 0 2px 10px rgba(0,0,0,0.18);
      transition: transform 0.15s, background 0.15s;
    }

    .btn-close-modal:hover {
      background: #fff;
      transform: scale(1.08);
    }

    /* GALERÍA PRINCIPAL Y ZOOM POR CLIC */
    .modal-gallery-main {
      position: relative;
      width: 100%;
      height: 360px;
      background: var(--bg-page);
      border-radius: 24px 24px 0 0;
      overflow: hidden;
      cursor: zoom-in;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: height 0.3s ease, background-color 0.3s ease;
    }

    .modal-gallery-main.is-fullscreen {
      height: 500px;
      background: #0b0f19;
      cursor: zoom-out;
    }

    .gallery-main-img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain; /* Evita recortes de imagen */
      display: block;
      transition: transform 0.3s ease;
    }

    .gallery-main-img.zoomed {
      transform: scale(1.5);
    }

    .zoom-hint {
      position: absolute;
      bottom: 12px;
      left: 16px;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.75rem;
      pointer-events: none;
      backdrop-filter: blur(4px);
      z-index: 2;
      transition: opacity 0.2s;
    }

    .gallery-placeholder {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      font-size: 3.5rem; color: #cbd5e1;
    }

    .modal-category-badge {
      position: absolute; top: 16px; left: 16px;
      background: rgba(0, 43, 102, 0.85); color: #fff;
      padding: 5px 14px; border-radius: 999px;
      font-size: 0.8rem; font-weight: 700;
      backdrop-filter: blur(4px);
      z-index: 2;
    }

    .modal-price-badge {
      position: absolute; bottom: 16px; right: 16px;
      background: var(--accent); color: var(--primary);
      padding: 8px 20px; border-radius: 999px;
      font-size: 1.2rem; font-weight: 900;
      box-shadow: 0 6px 16px rgba(0,0,0,0.25);
      white-space: nowrap;
      z-index: 2;
    }

    /* MINIATURAS */
    .modal-thumbnails {
      display: flex; gap: 8px;
      padding: 12px 24px 0;
      overflow-x: auto;
    }

    .thumbnail-btn {
      flex-shrink: 0; width: 64px; height: 64px;
      border-radius: 12px; overflow: hidden;
      border: 2px solid transparent; padding: 0; cursor: pointer;
      opacity: 0.55; transition: opacity 0.2s, border-color 0.2s;
      background: none;
    }

    .thumbnail-btn img { width: 100%; height: 100%; object-fit: cover; display: block; }

    .thumbnail-btn.active { border-color: var(--primary); opacity: 1; }
    .thumbnail-btn:hover { opacity: 1; }

    /* CUERPO DEL MODAL */
    .modal-body { padding: 24px 28px 28px; }

    .modal-title {
      color: var(--primary); font-size: 1.5rem; font-weight: 800;
      margin: 0 0 12px 0; line-height: 1.25;
    }

    .modal-meta-row {
      display: flex; flex-wrap: wrap; gap: 8px 18px;
      margin-bottom: 20px; padding-bottom: 18px;
      border-bottom: 1px solid #eef2f6;
    }

    .modal-business, .modal-location {
      font-size: 0.88rem; color: var(--text-muted); font-weight: 600;
    }

    .modal-desc h4 { color: var(--primary); margin: 0 0 8px 0; font-size: 1rem; }
    .modal-desc p { color: var(--text-muted); margin: 0; line-height: 1.6; font-size: 0.95rem; }

    .modal-actions {
      display: flex; flex-wrap: wrap; gap: 10px; margin-top: 26px;
    }

    .btn-outline-modal {
      flex: 1 1 100px; background: transparent; border: 2px solid #e2e8f0;
      color: var(--text-muted); padding: 12px; border-radius: 14px;
      font-weight: 700; cursor: pointer; transition: all 0.2s;
    }

    .btn-outline-modal:hover { border-color: var(--primary); color: var(--primary); }

    .modal-actions .btn-primary,
    .modal-actions .btn-whatsapp { flex: 1 1 150px; margin-top: 0; }

    .btn-primary {
      background: var(--primary); color: var(--accent); border: none;
      padding: 12px; border-radius: 14px; font-weight: 800; cursor: pointer;
      margin-top: 24px; transition: opacity 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      text-decoration: none; text-align: center;
    }
    .btn-primary:hover { opacity: 0.9; color: var(--accent); }

    .btn-whatsapp {
      background: #25d366; color: #fff; border: none;
      padding: 12px; border-radius: 14px; font-weight: 800; cursor: pointer;
      transition: opacity 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      text-decoration: none; text-align: center;
    }
    .btn-whatsapp:hover { opacity: 0.9; color: #fff; }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .main-content { padding: 24px 16px; }

      .hero-section { padding: 32px 20px; border-radius: 20px; margin-bottom: 28px; }
      .hero-title { font-size: clamp(1.8rem, 7vw, 3rem); }
      .hero-subtitle { font-size: 0.95rem; margin-bottom: 24px; }
      .search-bar { padding: 4px 4px 4px 16px; }
      .search-input { font-size: 0.9rem; }
      .btn-buscar { padding: 10px 20px; }

      .categories-section { margin-bottom: 32px; }
      .categories-list { justify-content: flex-start; }
      .category-icon { width: 52px; height: 52px; font-size: 1.4rem; }

      .section-header { flex-direction: column; align-items: flex-start; gap: 10px; margin-bottom: 18px; }
      .filters-row { grid-template-columns: 1fr; }
      .cards-grid { gap: 16px; margin-bottom: 36px; }

      .business-cta-section { margin-bottom: 32px; }
      .business-cta-card { flex-direction: column; align-items: flex-start; text-align: left; padding: 22px 20px; }
      .btn-cta-negocio { width: 100%; text-align: center; }

      .featured-section { margin-bottom: 32px; }

      .features-section-wrapper { padding-top: 28px; }

      .modal-gallery-main { height: 240px; }
      .modal-gallery-main.is-fullscreen { height: 360px; }
      .modal-price-badge { font-size: 1.05rem; padding: 7px 16px; bottom: 12px; right: 12px; }
      .modal-body { padding: 20px; }
      .modal-actions { flex-direction: column-reverse; }
      .modal-actions .btn-primary,
      .modal-actions .btn-whatsapp { flex: none; }
    }

    @media (max-width: 480px) {
      .hero-section { padding: 24px 16px; }
      .badge { font-size: 0.75rem; padding: 5px 12px; }

      .search-bar {
        flex-wrap: wrap;
        justify-content: center;
        padding: 10px 14px;
        gap: 8px;
      }
      .search-input {
        flex: 1 1 100%;
      }
      .btn-buscar {
        width: auto;
        padding: 10px 36px;
      }

      .card-image-container { height: 170px; }
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
  imagenSeleccionada: string | null = null;
  likesMap: { [key: string]: { total: number; hasLiked: boolean } } = {};

  // Variable de estado para el Zoom por clic
  isZoomed = false;

  private readonly PLATAFORMA_WHATSAPP_ID = '4e35d5d5-8d91-4131-8b04-dc44b5195527';

  private readonly PALETA_CATEGORIAS = [
    { bg: '#fef3c7', fg: '#92400e' },
    { bg: '#fbeaf0', fg: '#993556' },
    { bg: '#eaf3de', fg: '#3b6d11' },
    { bg: '#e6f1fb', fg: '#185fa5' },
    { bg: '#eeedfe', fg: '#534ab7' },
    { bg: '#faece7', fg: '#993c1d' },
  ];

  colorCategoria(index: number): { bg: string; fg: string } {
    return this.PALETA_CATEGORIAS[index % this.PALETA_CATEGORIAS.length];
  }

  get fotosPublicacionSeleccionada(): string[] {
    if (!this.publicacionSeleccionada) return [];
    return [
      this.publicacionSeleccionada.foto_1,
      this.publicacionSeleccionada.foto_2,
      this.publicacionSeleccionada.foto_3
    ].filter((foto): foto is string => !!foto);
  }

  get empresasDestacadas(): { id: string; nombre: string; logo: string | null }[] {
    const vistos = new Set<string>();
    const resultado: { id: string; nombre: string; logo: string | null }[] = [];

    for (const pub of this.publicaciones) {
      if (!pub.empresa_id || vistos.has(pub.empresa_id)) continue;
      vistos.add(pub.empresa_id);
      resultado.push({
        id: pub.empresa_id,
        nombre: pub.empresa?.nombre || 'Negocio local',
        logo: pub.empresa?.logo || null
      });
      if (resultado.length >= 6) break;
    }

    return resultado;
  }

  obtenerInicialesEmpresa(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  }

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

    // 🌍 Detección automática de la ubicación del usuario
    this.detectarUbicacionUsuario();
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

  detectarUbicacionUsuario() {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=es`);
          const data = await response.json();

          if (data && data.address) {
            const nombrePaisDetectado = data.address.country;
            const nombreDeptoDetectado = data.address.state || data.address.region;
            const nombreCiudadDetectado = data.address.city || data.address.town || data.address.village;

            if (nombrePaisDetectado && this.paises.length > 0) {
              const paisEncontrado = this.paises.find(p => 
                p.nombre.toLowerCase().includes(nombrePaisDetectado.toLowerCase()) || 
                nombrePaisDetectado.toLowerCase().includes(p.nombre.toLowerCase())
              );

              if (paisEncontrado) {
                this.filtroPaisId = paisEncontrado.id;
                this.onPaisChange();

                if (nombreDeptoDetectado && this.departamentosFiltrados.length > 0) {
                  const deptoEncontrado = this.departamentosFiltrados.find(d => 
                    d.nombre.toLowerCase().includes(nombreDeptoDetectado.toLowerCase()) ||
                    nombreDeptoDetectado.toLowerCase().includes(d.nombre.toLowerCase())
                  );

                  if (deptoEncontrado) {
                    this.filtroDepartamentoId = deptoEncontrado.id;
                    this.onDepartamentoChange();

                    if (nombreCiudadDetectado && this.ciudadesFiltradas.length > 0) {
                      const ciudadEncontrada = this.ciudadesFiltradas.find(c => 
                        c.nombre.toLowerCase().includes(nombreCiudadDetectado.toLowerCase()) ||
                        nombreCiudadDetectado.toLowerCase().includes(c.nombre.toLowerCase())
                      );

                      if (ciudadEncontrada) {
                        this.filtroCiudadId = ciudadEncontrada.id;
                      }
                    }
                  }
                }

                this.filtrarPublicaciones();
              }
            }
          }
        } catch (error) {
          console.error('Error al geocodificar la ubicación:', error);
        }
      },
      (error) => {
        console.log('Geolocalización denegada o no disponible:', error.message);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
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

    const { data, error } = await this.authService.getSupabaseClient()
      .from('publicaciones')
      .select(`
        *,
        empresa:empresas (
          nombre,
          direccion,
          logo,
          ciudad_id,
          redes_sociales (
            url,
            plataforma,
            plataforma_id
          ),
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

  obtenerUbicacionTexto(pub: PublicacionConEmpresa): string {
    const partes = [
      pub.empresa?.ciudad?.nombre,
      pub.empresa?.ciudad?.departamento?.nombre,
      pub.empresa?.ciudad?.departamento?.pais?.nombre
    ].filter((parte): parte is string => !!parte);

    return partes.length ? partes.join(', ') : 'Ubicación no especificada';
  }

  obtenerLinkWhatsapp(pub: PublicacionConEmpresa): string | null {
    const redes = pub.empresa?.redes_sociales || [];

    const redWhatsapp = redes.find(r =>
      r.plataforma_id === this.PLATAFORMA_WHATSAPP_ID ||
      (r.plataforma || '').toLowerCase().includes('whatsapp')
    );

    if (!redWhatsapp?.url) return null;

    const valor = redWhatsapp.url.trim();

    if (/^https?:\/\//i.test(valor)) {
      return valor;
    }

    let numero = valor.replace(/\D/g, '');
    if (!numero) return null;

    if (numero.length <= 10) {
      numero = '57' + numero;
    }

    const mensaje = encodeURIComponent(
      `Hola, vi tu publicación "${pub.servicio_producto}" en Qué Busca Mijo y quisiera más información.`
    );
    return `https://wa.me/${numero}?text=${mensaje}`;
  }

  abrirModal(pub: PublicacionConEmpresa) {
    this.publicacionSeleccionada = pub;
    this.imagenSeleccionada = pub.foto_1 || pub.foto_2 || pub.foto_3 || null;
    this.isZoomed = false;
    document.body.style.overflow = 'hidden';
  }

  seleccionarImagen(foto: string) {
    this.imagenSeleccionada = foto;
    this.isZoomed = false;
  }

  cerrarModal() {
    this.publicacionSeleccionada = null;
    this.imagenSeleccionada = null;
    this.isZoomed = false;
    document.body.style.overflow = '';
  }

  toggleZoomFullscreen() {
    this.isZoomed = !this.isZoomed;
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    if (this.publicacionSeleccionada) {
      this.cerrarModal();
    }
  }
}