import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { LikeService } from '../../core/services/like.service';
import {
  PublicacionesService,
  PublicacionConEmpresa,
  Categoria,
  Pais,
  Departamento,
  Ciudad,
  OrdenPublicaciones
} from '../../core/services/publicaciones.service';
import { User } from '@supabase/supabase-js';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FooterComponent],
  template: `
    <div class="page-wrapper">
      <main class="main-content">

        <!-- BARRA DE BÚSQUEDA Y FILTROS -->
        <section class="search-section">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="aplicarFiltrosLocalYActualizarUrl()"
              placeholder="¿Qué servicio o producto buscas?..."
              class="search-input"
            />
            @if (hayFiltrosActivos()) {
              <button (click)="limpiarTodo()" class="btn-clear" title="Limpiar filtros">✕</button>
            }
          </div>

          <div class="filters-row">
            <select [(ngModel)]="filtroPaisId" (change)="onPaisChange(); aplicarFiltrosLocalYActualizarUrl()" class="filter-select">
              <option value="">🌍 Todos los países</option>
              @for (p of paises; track p.id) {
                <option [value]="p.id">{{ p.nombre }}</option>
              }
            </select>

            <select [(ngModel)]="filtroDepartamentoId" (change)="onDepartamentoChange(); aplicarFiltrosLocalYActualizarUrl()" class="filter-select" [disabled]="!filtroPaisId">
              <option value="">🗺️ Todos los departamentos</option>
              @for (d of departamentosFiltrados; track d.id) {
                <option [value]="d.id">{{ d.nombre }}</option>
              }
            </select>

            <select [(ngModel)]="filtroCiudadId" (change)="aplicarFiltrosLocalYActualizarUrl()" class="filter-select" [disabled]="!filtroDepartamentoId">
              <option value="">🏙️ Todas las ciudades</option>
              @for (c of ciudadesFiltradas; track c.id) {
                <option [value]="c.id">{{ c.nombre }}</option>
              }
            </select>

            <select [(ngModel)]="orden" (change)="aplicarFiltrosLocalYActualizarUrl()" class="filter-select">
              <option value="relevancia">⭐ Relevancia</option>
              <option value="recientes">🕒 Más recientes</option>
            </select>
          </div>

          <!-- CATEGORÍAS -->
          <div class="categories-row">
            <button
              class="category-chip"
              [class.active]="!categoriaSeleccionadaId"
              (click)="seleccionarCategoria(null)">
              🏠 Todas
            </button>
            @for (cat of categorias; track cat.id; let i = $index) {
              <button
                class="category-chip"
                [class.active]="categoriaSeleccionadaId === cat.id"
                [style.borderColor]="categoriaSeleccionadaId === cat.id ? colorCategoria(i).fg : 'transparent'"
                [style.background]="categoriaSeleccionadaId === cat.id ? colorCategoria(i).bg : '#f4f8f1'"
                [style.color]="categoriaSeleccionadaId === cat.id ? colorCategoria(i).fg : 'var(--primary)'"
                (click)="seleccionarCategoria(cat.id)">
                {{ cat.icono || '📁' }} {{ cat.nombre }}
              </button>
            }
          </div>
        </section>

        <!-- RESULTADOS -->
        <section class="results-section">
          <div class="results-header">
            @if (cargando) {
              <p class="results-count">Cargando...</p>
            } @else {
              <p class="results-count">
                {{ publicacionesOrdenadas.length }}
                {{ publicacionesOrdenadas.length === 1 ? 'resultado encontrado' : 'resultados encontrados' }}
                @if (searchQuery) { para "{{ searchQuery }}" }
              </p>
            }
          </div>

          @if (cargando) {
            <div class="loading-state">Buscando publicaciones...</div>
          } @else if (publicacionesOrdenadas.length === 0) {
            <div class="empty-state">
              <span class="empty-icon">📦</span>
              <h3>No se encontraron publicaciones</h3>
              <p>Intenta con otros términos, cambia de categoría o amplía la ubicación.</p>
            </div>
          } @else {
            <div class="cards-grid">
              @for (pub of publicacionesOrdenadas; track pub.id) {
                <div class="card" (click)="abrirModal(pub)">
                  <div class="card-image-container" [style.--bg-img]="pub.foto_1 ? 'url(' + pub.foto_1 + ')' : null">
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

                    <div class="card-hover-action">
                      <button class="btn-outline">Ver detalle ➔</button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
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

            <div
              class="modal-gallery-main"
              [class.is-fullscreen]="isZoomed"
              (click)="toggleZoomFullscreen()">
              @if (imagenSeleccionada) {
                <img [src]="imagenSeleccionada" [alt]="publicacionSeleccionada.servicio_producto" class="gallery-main-img" [class.zoomed]="isZoomed" />
              } @else {
                <div class="gallery-placeholder">🏷️</div>
              }

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

            @if (fotosPublicacionSeleccionada.length > 1) {
              <div class="modal-thumbnails">
                @for (foto of fotosPublicacionSeleccionada; track foto; let idx = $index) {
                  <button
                    type="button"
                    class="thumbnail-btn"
                    [class.active]="foto === imagenSeleccionada"
                    (click)="seleccionarImagen(foto)"
                    [title]="'Ver foto ' + (idx + 1)">
                    <img [src]="foto" [alt]="'Miniatura ' + (idx + 1)" />
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
                @if (publicacionSeleccionada.slug) {
                  <a class="btn-outline-modal" [routerLink]="['/producto', publicacionSeleccionada.slug]" (click)="cerrarModal()">
                    🔗 Compartir
                  </a>
                }
                @if (obtenerLinkWhatsapp(publicacionSeleccionada); as linkWhatsapp) {
                  <a class="btn-whatsapp" [href]="linkWhatsapp" target="_blank" rel="noopener noreferrer">
                    💬 WhatsApp
                  </a>
                }
                <a class="btn-primary" [routerLink]="['/empresa', publicacionSeleccionada.empresa_id]" (click)="cerrarModal()">
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
      padding: 32px 20px 40px;
      width: 100%;
      flex: 1;
    }

    /* BÚSQUEDA Y FILTROS */
    .search-section {
      margin-bottom: 32px;
    }

    .search-bar {
      display: flex;
      align-items: center;
      background: var(--bg-white);
      border: 2px solid var(--primary);
      border-radius: 999px;
      padding: 6px 6px 6px 20px;
      margin-bottom: 14px;
    }

    .search-input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      font-size: 1rem;
      padding: 10px;
      color: var(--text-main);
      background: transparent;
    }

    .btn-clear {
      background: #e2ebd8;
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      cursor: pointer;
      color: var(--primary);
      flex-shrink: 0;
    }

    .filters-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
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

    .categories-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .category-chip {
      background: #f4f8f1;
      border: 2px solid transparent;
      color: var(--primary);
      padding: 8px 16px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .category-chip:hover {
      transform: translateY(-1px);
    }

    /* RESULTADOS */
    .results-header {
      margin-bottom: 18px;
    }

    .results-count {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin: 0;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 24px;
    }

    /* TARJETA CON TAMAÑO FIJO ESTRICTO */
    .card {
      background: var(--bg-white);
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      cursor: pointer;
      height: 400px;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: box-shadow 0.3s ease;
    }

    .card:hover {
      box-shadow: 0 14px 30px rgba(0,0,0,0.12);
    }

    .card-image-container {
      position: relative;
      height: 210px;
      background: #0f172a;
      overflow: hidden;
      transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
    }

    .card:hover .card-image-container {
      height: 165px;
    }

    .card-image-container::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: var(--bg-img);
      background-size: cover;
      background-position: center;
      filter: blur(14px) brightness(0.75);
      transform: scale(1.2);
      z-index: 1;
    }

    .card-image {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .card:hover .card-image {
      transform: scale(1.06);
    }

    .card-image-placeholder {
      position: relative;
      z-index: 2;
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
      z-index: 3;
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
      z-index: 3;
    }

    .card-content {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
      position: relative;
      overflow: hidden;
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
      margin-bottom: 6px;
      align-self: flex-start;
    }

    .card-meta {
      display: flex;
      gap: 16px;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .business-name {
      font-size: 0.9rem;
      color: var(--text-main);
      font-weight: 600;
      margin: 0;
    }

    .card-hover-action {
      position: absolute;
      bottom: 14px;
      left: 20px;
      right: 20px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s ease;
    }

    .card:hover .card-hover-action {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .btn-outline {
      width: 100%;
      background: var(--bg-white);
      border: 2px solid #e2ebd8;
      color: #65a30d;
      padding: 9px;
      border-radius: 999px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      transition: all 0.2s;
    }

    .btn-outline:hover {
      border-color: var(--accent);
      color: var(--primary);
      background: #f4f8f1;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 12px;
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
      object-fit: contain;
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

    .modal-thumbnails {
      display: flex;
      gap: 10px;
      padding: 14px 28px 0;
      justify-content: center;
    }

    .thumbnail-btn {
      width: 70px;
      height: 70px;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid #e2e8f0;
      padding: 0;
      cursor: pointer;
      opacity: 0.6;
      transition: all 0.2s ease;
      background: #f8fafc;
    }

    .thumbnail-btn img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .thumbnail-btn.active {
      border-color: var(--primary);
      opacity: 1;
      transform: scale(1.05);
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    .thumbnail-btn:hover {
      opacity: 1;
      border-color: var(--accent);
    }

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

    @media (max-width: 768px) {
      .filters-row { grid-template-columns: 1fr 1fr; }
      .search-bar { padding: 4px 4px 4px 16px; }
      .modal-gallery-main { height: 240px; }
      .modal-body { padding: 20px; }
      .modal-actions { flex-direction: column-reverse; }
      .modal-actions .btn-primary,
      .modal-actions .btn-whatsapp { flex: none; }
    }

    @media (max-width: 480px) {
      .filters-row { grid-template-columns: 1fr; }
    }
  `]
})
export class ResultadosComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private likeService = inject(LikeService);
  private publicacionesService = inject(PublicacionesService);

  private queryParamsSub?: Subscription;

  currentUser: User | null = null;
  transeunteId = '';

  publicaciones: PublicacionConEmpresa[] = [];
  publicacionesOrdenadas: PublicacionConEmpresa[] = [];

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
  orden: OrdenPublicaciones = 'relevancia';

  publicacionSeleccionada: PublicacionConEmpresa | null = null;
  imagenSeleccionada: string | null = null;
  likesMap: { [key: string]: { total: number; hasLiked: boolean } } = {};

  isZoomed = false;

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
    ].filter((foto): foto is string => !!foto && foto.trim() !== '');
  }

  async ngOnInit() {
    this.currentUser = await this.authService.getUser();
    if (this.currentUser) {
      await this.obtenerTranseunteId();
    }

    await this.cargarCatalogosGeograficos();
    this.categorias = await this.publicacionesService.cargarCategorias();
    await this.cargarPublicaciones();

    this.queryParamsSub = this.route.queryParamMap.subscribe(params => {
      this.searchQuery = params.get('q') || '';
      this.categoriaSeleccionadaId = params.get('categoria');
      this.filtroPaisId = params.get('pais') || '';
      this.filtroDepartamentoId = params.get('departamento') || '';
      this.filtroCiudadId = params.get('ciudad') || '';
      this.orden = (params.get('orden') as OrdenPublicaciones) || 'relevancia';

      this.sincronizarCascadasGeograficas();
      this.recalcularResultados();
    });
  }

  ngOnDestroy() {
    this.queryParamsSub?.unsubscribe();
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
    const { paises, departamentos, ciudades } = await this.publicacionesService.cargarCatalogosGeograficos();
    this.paises = paises;
    this.departamentos = departamentos;
    this.ciudades = ciudades;
  }

  async cargarPublicaciones() {
    this.cargando = true;
    this.publicaciones = await this.publicacionesService.cargarPublicaciones();
    await this.cargarEstadoLikesParaTodas();
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
      const nuevoEstadoLike = await this.likeService.toggleLike(publicacionId, this.transeunteId, estadoActual.hasLiked);
      const nuevoTotal = nuevoEstadoLike ? estadoActual.total + 1 : Math.max(0, estadoActual.total - 1);
      this.likesMap[publicacionId] = { total: nuevoTotal, hasLiked: nuevoEstadoLike };
    } catch (error) {
      console.error('Error al procesar el like:', error);
    }
  }

  private sincronizarCascadasGeograficas() {
    this.departamentosFiltrados = this.filtroPaisId
      ? this.departamentos.filter(d => d.pais_id === this.filtroPaisId)
      : [];

    this.ciudadesFiltradas = this.filtroDepartamentoId
      ? this.ciudades.filter(c => c.departamento_id === this.filtroDepartamentoId)
      : [];
  }

  private recalcularResultados() {
    const filtradas = this.publicacionesService.filtrar(this.publicaciones, {
      query: this.searchQuery,
      categoriaId: this.categoriaSeleccionadaId,
      paisId: this.filtroPaisId,
      departamentoId: this.filtroDepartamentoId,
      ciudadId: this.filtroCiudadId
    });

    this.publicacionesOrdenadas = this.publicacionesService.ordenar(filtradas, this.orden, this.searchQuery);
  }

  onPaisChange() {
    this.filtroDepartamentoId = '';
    this.filtroCiudadId = '';
  }

  onDepartamentoChange() {
    this.filtroCiudadId = '';
  }

  seleccionarCategoria(categoriaId: string | null) {
    this.categoriaSeleccionadaId = categoriaId;
    this.aplicarFiltrosLocalYActualizarUrl();
  }

  hayFiltrosActivos(): boolean {
    return !!(this.searchQuery || this.categoriaSeleccionadaId || this.filtroPaisId || this.filtroDepartamentoId || this.filtroCiudadId);
  }

  limpiarTodo() {
    this.searchQuery = '';
    this.categoriaSeleccionadaId = null;
    this.filtroPaisId = '';
    this.filtroDepartamentoId = '';
    this.filtroCiudadId = '';
    this.orden = 'relevancia';
    this.aplicarFiltrosLocalYActualizarUrl();
  }

  aplicarFiltrosLocalYActualizarUrl() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.searchQuery || null,
        categoria: this.categoriaSeleccionadaId || null,
        pais: this.filtroPaisId || null,
        departamento: this.filtroDepartamentoId || null,
        ciudad: this.filtroCiudadId || null,
        orden: this.orden !== 'relevancia' ? this.orden : null
      },
      queryParamsHandling: 'merge'
    });
  }

  obtenerNombreCategoria(categoriaId: string): string {
    return this.publicacionesService.obtenerNombreCategoria(this.categorias, categoriaId);
  }

  obtenerUbicacionTexto(pub: PublicacionConEmpresa): string {
    return this.publicacionesService.obtenerUbicacionTexto(pub);
  }

  obtenerLinkWhatsapp(pub: PublicacionConEmpresa): string | null {
    return this.publicacionesService.obtenerLinkWhatsapp(pub);
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