import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { PublicacionesService, PublicacionConEmpresa } from '../../core/services/publicaciones.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, FooterComponent],
  template: `
    <div class="page-wrapper">
      <main class="main-content">

        @if (cargando) {
          <div class="loading-state">Cargando publicación...</div>
        } @else if (!publicacion) {
          <div class="empty-state">
            <span class="empty-icon">📦</span>
            <h2>No encontramos esta publicación</h2>
            <p>Puede que haya sido eliminada o que el enlace esté incompleto.</p>
            <a routerLink="/resultados" class="btn-primary">Ver todas las publicaciones</a>
          </div>
        } @else {

          <a routerLink="/resultados" class="back-link">← Volver a resultados</a>

          <div class="product-layout">

            <!-- GALERÍA -->
            <div class="gallery-col">
              <div class="gallery-main" [class.zoomed]="isZoomed" (click)="toggleZoom()">
                @if (imagenSeleccionada) {
                  <img [src]="imagenSeleccionada" [alt]="publicacion.servicio_producto" class="gallery-main-img" />
                } @else {
                  <div class="gallery-placeholder">🏷️</div>
                }
                <span class="zoom-hint">{{ isZoomed ? '🔍 Clic para alejar' : '🔍 Clic para ampliar' }}</span>
              </div>

              @if (fotosDisponibles.length > 1) {
                <div class="thumbnails-row">
                  @for (foto of fotosDisponibles; track foto) {
                    <button
                      type="button"
                      class="thumbnail-btn"
                      [class.active]="foto === imagenSeleccionada"
                      (click)="seleccionarImagen(foto)">
                      <img [src]="foto" alt="Miniatura" />
                    </button>
                  }
                </div>
              }
            </div>

            <!-- INFO -->
            <div class="info-col">
              @if (publicacion.categoria_id) {
                <span class="category-badge">📁 {{ obtenerNombreCategoria(publicacion.categoria_id) }}</span>
              }

              <h1 class="product-title">{{ publicacion.servicio_producto }}</h1>

              @if (publicacion.precio !== null) {
                <div class="price">&#36;{{ publicacion.precio | number:'1.0-2' }}</div>
              }

              <div class="business-card">
                <div class="business-avatar">
                  @if (publicacion.empresa?.logo) {
                    <img [src]="publicacion.empresa!.logo!" [alt]="publicacion.empresa?.nombre" />
                  } @else {
                    <span>{{ obtenerInicialesEmpresa(publicacion.empresa?.nombre || 'Negocio') }}</span>
                  }
                </div>
                <div class="business-info">
                  <span class="business-name">{{ publicacion.empresa?.nombre || 'Empresa local' }}</span>
                  <span class="business-location">📍 {{ obtenerUbicacionTexto(publicacion) }}</span>
                </div>
                <a class="business-link" [routerLink]="['/empresa', publicacion.empresa_id]">Ver negocio ➔</a>
              </div>

              <div class="description-block">
                <h2>Descripción</h2>
                <p>{{ publicacion.descripcion || 'Sin descripción disponible.' }}</p>
              </div>

              <div class="cta-row">
                @if (linkWhatsapp) {
                  <a class="btn-whatsapp" [href]="linkWhatsapp" target="_blank" rel="noopener noreferrer">
                    💬 Contactar por WhatsApp
                  </a>
                } @else {
                  <a class="btn-primary" [routerLink]="['/empresa', publicacion.empresa_id]">
                    🏢 Ver negocio para contactar
                  </a>
                }
              </div>
            </div>
          </div>
        }
      </main>

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

    * { box-sizing: border-box; }

    .page-wrapper {
      background-color: var(--bg-white);
      min-height: calc(100vh - 78px);
      display: flex;
      flex-direction: column;
    }

    .main-content {
      max-width: 1100px;
      margin: 0 auto;
      padding: 32px 20px 48px;
      width: 100%;
      flex: 1;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: var(--text-muted);
    }

    .empty-icon { font-size: 3rem; display: block; margin-bottom: 12px; }
    .empty-state h2 { color: var(--primary); margin: 0 0 8px 0; }
    .empty-state .btn-primary { display: inline-flex; margin-top: 20px; text-decoration: none; }

    .back-link {
      display: inline-block;
      color: var(--primary);
      text-decoration: none;
      font-weight: 700;
      font-size: 0.9rem;
      margin-bottom: 20px;
    }

    .back-link:hover { color: #65a30d; }

    .product-layout {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 40px;
      align-items: start;
    }

    /* GALERÍA */
    .gallery-main {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1;
      background: var(--bg-page);
      border-radius: 24px;
      overflow: hidden;
      cursor: zoom-in;
    }

    .gallery-main.zoomed {
      cursor: zoom-out;
    }

    .gallery-main-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.25s ease;
      display: block;
    }

    .gallery-main.zoomed .gallery-main-img {
      transform: scale(1.5);
      object-fit: contain;
    }

    .gallery-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      color: #cbd5e1;
    }

    .zoom-hint {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: rgba(0,0,0,0.55);
      color: #fff;
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 999px;
      pointer-events: none;
    }

    .thumbnails-row {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      overflow-x: auto;
    }

    .thumbnail-btn {
      flex-shrink: 0;
      width: 72px;
      height: 72px;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid transparent;
      padding: 0;
      cursor: pointer;
      opacity: 0.55;
      background: none;
    }

    .thumbnail-btn img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .thumbnail-btn.active { border-color: var(--primary); opacity: 1; }
    .thumbnail-btn:hover { opacity: 1; }

    /* INFO */
    .category-badge {
      display: inline-block;
      font-size: 0.78rem;
      font-weight: 700;
      color: #0369a1;
      background: #e0f2fe;
      padding: 4px 10px;
      border-radius: 999px;
      margin-bottom: 12px;
    }

    .product-title {
      color: var(--primary);
      font-size: 1.9rem;
      font-weight: 800;
      margin: 0 0 12px 0;
      line-height: 1.2;
    }

    .price {
      display: inline-block;
      background: var(--accent);
      color: var(--primary);
      font-weight: 900;
      font-size: 1.4rem;
      padding: 8px 20px;
      border-radius: 999px;
      margin-bottom: 24px;
    }

    .business-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-page);
      border-radius: 16px;
      padding: 14px 16px;
      margin-bottom: 24px;
    }

    .business-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.9rem;
      overflow: hidden;
      flex-shrink: 0;
    }

    .business-avatar img { width: 100%; height: 100%; object-fit: cover; }

    .business-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .business-name {
      font-weight: 800;
      color: var(--primary);
      font-size: 0.95rem;
    }

    .business-location {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .business-link {
      font-size: 0.85rem;
      font-weight: 700;
      color: #65a30d;
      text-decoration: none;
      white-space: nowrap;
    }

    .description-block h2 {
      color: var(--primary);
      font-size: 1.1rem;
      margin: 0 0 8px 0;
    }

    .description-block p {
      color: var(--text-muted);
      line-height: 1.7;
      margin: 0 0 28px 0;
    }

    .cta-row {
      display: flex;
    }

    .btn-whatsapp {
      background: #25d366;
      color: #fff;
      border: none;
      padding: 14px 24px;
      border-radius: 14px;
      font-weight: 800;
      font-size: 1rem;
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
    }

    .btn-primary {
      background: var(--primary);
      color: var(--accent);
      border: none;
      padding: 14px 24px;
      border-radius: 14px;
      font-weight: 800;
      font-size: 1rem;
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
    }

    @media (max-width: 768px) {
      .product-layout {
        grid-template-columns: 1fr;
        gap: 24px;
      }
      .product-title { font-size: 1.5rem; }
    }
  `]
})
export class ProductoDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private publicacionesService = inject(PublicacionesService);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  publicacion: PublicacionConEmpresa | null = null;
  categorias: { id: string; nombre: string; icono?: string }[] = [];
  cargando = true;

  imagenSeleccionada: string | null = null;
  isZoomed = false;
  linkWhatsapp: string | null = null;

  get fotosDisponibles(): string[] {
    if (!this.publicacion) return [];
    return [this.publicacion.foto_1, this.publicacion.foto_2, this.publicacion.foto_3]
      .filter((foto): foto is string => !!foto);
  }

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.categorias = await this.publicacionesService.cargarCategorias();

    if (slug) {
      this.publicacion = await this.publicacionesService.obtenerPublicacionPorSlug(slug);
    }

    if (this.publicacion) {
      this.imagenSeleccionada = this.fotosDisponibles[0] || null;
      this.linkWhatsapp = this.publicacionesService.obtenerLinkWhatsapp(this.publicacion);
      this.actualizarMetaTags(this.publicacion);
    }

    this.cargando = false;
  }

  // Esto es lo que hace que compartir el link por WhatsApp (o cualquier red)
  // muestre una tarjeta con la imagen, el título y el precio del producto,
  // en vez de un link pelado — la razón de ser de esta página.
  private actualizarMetaTags(pub: PublicacionConEmpresa) {
    const titulo = `${pub.servicio_producto} | Qué Busca Mijo`;
    const descripcion = (pub.descripcion || `Encuéntralo en ${pub.empresa?.nombre || 'un negocio local'} en Qué Busca Mijo.`).slice(0, 160);
    const imagen = pub.foto_1 || pub.foto_2 || pub.foto_3 || '';

    this.titleService.setTitle(titulo);

    this.metaService.updateTag({ name: 'description', content: descripcion });
    this.metaService.updateTag({ property: 'og:title', content: pub.servicio_producto });
    this.metaService.updateTag({ property: 'og:description', content: descripcion });
    this.metaService.updateTag({ property: 'og:type', content: 'product' });
    if (imagen) {
      this.metaService.updateTag({ property: 'og:image', content: imagen });
    }
    if (pub.precio !== null && pub.precio !== undefined) {
      this.metaService.updateTag({ property: 'product:price:amount', content: String(pub.precio) });
      this.metaService.updateTag({ property: 'product:price:currency', content: 'COP' });
    }
  }

  obtenerNombreCategoria(categoriaId: string): string {
    return this.publicacionesService.obtenerNombreCategoria(this.categorias as any, categoriaId);
  }

  obtenerUbicacionTexto(pub: PublicacionConEmpresa): string {
    return this.publicacionesService.obtenerUbicacionTexto(pub);
  }

  obtenerInicialesEmpresa(nombre: string): string {
    return nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
  }

  seleccionarImagen(foto: string) {
    this.imagenSeleccionada = foto;
    this.isZoomed = false;
  }

  toggleZoom() {
    this.isZoomed = !this.isZoomed;
  }
}