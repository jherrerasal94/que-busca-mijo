import { Component, OnInit, OnDestroy, Renderer2, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl, Title, Meta } from '@angular/platform-browser';
import { AuthService } from '../../core/services/auth.service';
import { LikeService } from '../../core/services/like.service';
import { PublicacionesService, PublicacionConEmpresa, Categoria } from '../../core/services/publicaciones.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';

export interface RedSocial {
  id: string;
  url: string;
  plataformas_sociales?: {
    nombre: string;
    icono: string;
  };
}

export interface Empresa {
  id: string;
  nombre: string;
  alias?: string | null;
  nit?: string;
  rep_telefono?: string | null;
  correo_empresarial?: string | null;
  direccion?: string | null;
  logo?: string | null;
  img_empresa_1?: string | null;
  img_empresa_2?: string | null;
  verificado?: boolean;
  sobre_nosotros?: string | null;
  ciudad?: {
    nombre?: string;
    departamento?: {
      nombre?: string;
    };
  };
}

export interface GrupoCategoria {
  categoriaId: string | null;
  categoriaNombre: string;
  categoriaIcono: string;
  publicaciones: PublicacionConEmpresa[];
}

export interface ReviewEmpresa {
  id: string;
  rating: number;
  comentario: string | null;
  created_at: string;
  transeunte_id: string;
  transeunte?: {
    nombres?: string;
    apellidos?: string;
  };
}

@Component({
  selector: 'app-empresa-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FooterComponent],
  template: `
    <div class="page-wrapper">
      <main class="main-content">
        
        <!-- BOTÓN DE REGRESO -->
        <div class="back-nav">
          <a routerLink="/" class="btn-back">⬅ Volver al inicio</a>
        </div>

        @if (cargando) {
          <div class="loading-state">Cargando información de la empresa...</div>
        } @else if (!empresa) {
          <div class="empty-state">
            <span class="empty-icon">🏢</span>
            <h3>Empresa no encontrada</h3>
            <p>La empresa que buscas no existe o ya no está disponible.</p>
          </div>
        } @else {
          
          <!-- ENCABEZADO / PERFIL DE LA EMPRESA -->
          <section class="company-header-card">
            <div class="company-logo-container">
              @if (empresa.logo) {
                <img [src]="empresa.logo" [alt]="empresa.nombre" class="company-logo clickable" (click)="abrirModalImagen(empresa.logo)" title="Ampliar logo" />
              } @else {
                <div class="company-logo-placeholder">🏢</div>
              }
            </div>

            <div class="company-info">
              <div class="company-title-row">
                <h1 class="company-title">{{ empresa.nombre }}</h1>
                @if (empresa.verificado) {
                  <span class="verified-badge" title="Negocio verificado por Qué Busca Mijo">✔️ Verificado</span>
                }
              </div>
              @if (empresa.alias) {
                <p class="company-alias">&#64;{{ empresa.alias }}</p>
              }

              <!-- CTA PRINCIPALES: WHATSAPP Y LLAMAR -->
              @if (linkWhatsappEmpresa || empresa.rep_telefono) {
                <div class="main-cta-row">
                  @if (linkWhatsappEmpresa) {
                    <a [href]="linkWhatsappEmpresa" target="_blank" rel="noopener noreferrer" class="btn-cta-whatsapp">
                      💬 WhatsApp
                    </a>
                  }
                  @if (empresa.rep_telefono) {
                    <a [href]="'tel:' + empresa.rep_telefono" class="btn-cta-llamar">
                      📞 Llamar
                    </a>
                  }
                </div>
              }
              
              <div class="company-meta-grid">
                @if (empresa.direccion) {
                  <span class="meta-element">📍 {{ empresa.direccion }}</span>
                }
                @if (empresa.ciudad?.nombre) {
                  <span class="meta-element">🏙️ {{ empresa.ciudad?.nombre }}</span>
                }
                @if (empresa.correo_empresarial) {
                  <span class="meta-element">✉️ {{ empresa.correo_empresarial }}</span>
                }
                @if (empresa.rep_telefono) {
                  <span class="meta-element">📞 {{ empresa.rep_telefono }}</span>
                }
              </div>

              <!-- REDES SOCIALES -->
              @if (redesSociales.length > 0) {
                <div class="social-links-container">
                  <span class="social-label">Redes sociales:</span>
                  <div class="social-badges">
                    @for (red of redesSociales; track red.id) {
                      <a [href]="red.url" target="_blank" rel="noopener noreferrer" class="social-badge">
                        <span>{{ red.plataformas_sociales?.icono || '🌐' }}</span>
                        <span>{{ red.plataformas_sociales?.nombre || 'Red social' }}</span>
                      </a>
                    }
                  </div>
                </div>
              }

              <!-- GALERÍA DE IMÁGENES DE LA EMPRESA (CLICKABLES) -->
              @if (empresa.img_empresa_1 || empresa.img_empresa_2) {
                <div class="company-gallery-preview">
                  @if (empresa.img_empresa_1) { 
                    <img [src]="empresa.img_empresa_1" alt="Local 1" (click)="abrirModalImagen(empresa.img_empresa_1)" title="Ampliar imagen" /> 
                  }
                  @if (empresa.img_empresa_2) { 
                    <img [src]="empresa.img_empresa_2" alt="Local 2" (click)="abrirModalImagen(empresa.img_empresa_2)" title="Ampliar imagen" /> 
                  }
                </div>
              }
            </div>
          </section>

          <!-- SOBRE NOSOTROS -->
          @if (empresa.sobre_nosotros) {
            <section class="about-section">
              <h2 class="section-title">Sobre nosotros</h2>
              <p class="about-text">{{ empresa.sobre_nosotros }}</p>
            </section>
          }

          <!-- SECCIÓN DE PUBLICACIONES DE LA EMPRESA, AGRUPADAS POR CATEGORÍA -->
          <section class="company-offers-section">
            @if (publicaciones.length === 0) {
              <h2 class="section-title">📦 Publicaciones de {{ empresa.nombre }}</h2>
              <div class="empty-state-small">
                <p>Esta empresa aún no cuenta con publicaciones activas.</p>
              </div>
            } @else {
              @for (grupo of publicacionesAgrupadas; track grupo.categoriaId) {
                <div class="category-group">
                  <h2 class="section-title">{{ grupo.categoriaIcono }} {{ grupo.categoriaNombre }}</h2>
                  <div class="cards-grid">
                    @for (pub of grupo.publicaciones; track pub.id) {
                      <div class="card" (click)="abrirModalPublicacion(pub)">
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
                            title="Me gusta">
                            {{ likesMap[pub.id]?.hasLiked ? '❤️' : '🤍' }}
                          </button>

                          @if (pub.precio !== null) {
                            <div class="price-tag">&#36;{{ pub.precio | number:'1.0-2' }}</div>
                          }
                        </div>

                        <div class="card-content">
                          <h3 class="card-title">{{ pub.servicio_producto }}</h3>
                          <p class="card-desc-preview">{{ pub.descripcion || 'Sin descripción.' }}</p>

                          <div class="card-meta">
                            <span class="meta-item">❤️ {{ likesMap[pub.id]?.total || 0 }} likes</span>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </section>

          <!-- OPINIONES -->
          <section class="reviews-section">
            <h2 class="section-title">⭐ Opiniones</h2>

            @if (reviews.length > 0) {
              <div class="rating-summary">
                <span class="rating-number">{{ promedioRating.toFixed(1) }}</span>
                <span class="rating-stars">{{ '⭐'.repeat(promedioRedondeado) }}</span>
                <span class="rating-count">({{ reviews.length }} {{ reviews.length === 1 ? 'opinión' : 'opiniones' }})</span>
              </div>

              <div class="reviews-list">
                @for (review of reviews; track review.id) {
                  <div class="review-item">
                    <div class="review-header">
                      <span class="review-author">{{ review.transeunte?.nombres || 'Usuario' }} {{ review.transeunte?.apellidos || '' }}</span>
                      <span class="review-stars">{{ '⭐'.repeat(review.rating) }}</span>
                    </div>
                    @if (review.comentario) {
                      <p class="review-comment">{{ review.comentario }}</p>
                    }
                    <span class="review-date">{{ review.created_at | date:'mediumDate' }}</span>
                  </div>
                }
              </div>
            } @else {
              <p class="empty-reviews">Este negocio todavía no tiene opiniones.</p>
            }

            @if (transeunteId && !miReview) {
              <div class="review-form">
                <h4>Deja tu opinión</h4>
                <div class="star-picker">
                  @for (n of [1,2,3,4,5]; track n) {
                    <button type="button" class="star-btn" [class.active]="n <= nuevoRating" (click)="nuevoRating = n">⭐</button>
                  }
                </div>
                <textarea
                  [(ngModel)]="nuevoComentario"
                  placeholder="¿Cómo fue tu experiencia con este negocio? (opcional)"
                  class="review-textarea"
                  rows="3">
                </textarea>
                <button class="btn-enviar-review" [disabled]="enviandoReview" (click)="enviarReview()">
                  {{ enviandoReview ? 'Enviando...' : 'Publicar opinión' }}
                </button>
              </div>
            } @else if (!transeunteId && currentUserChecked) {
              <p class="login-prompt">
                <a routerLink="/login">Inicia sesión</a> como usuario para dejar tu opinión.
              </p>
            } @else if (miReview) {
              <p class="ya-opinaste">✓ Ya dejaste tu opinión en este negocio.</p>
            }
          </section>

          <!-- SECCIÓN DE MAPA / UBICACIÓN -->
          @if (empresa.direccion) {
            <section class="company-map-section">
              <h2 class="section-title">📍 Ubicación del negocio</h2>
              <p class="section-subtitle">{{ empresa.direccion }} {{ empresa.ciudad?.nombre ? '- ' + empresa.ciudad?.nombre : '' }}</p>
              
              <div class="map-container">
                <iframe
                  width="100%"
                  height="350"
                  style="border:0; border-radius: 16px;"
                  loading="lazy"
                  allowfullscreen
                  [src]="urlMapaSegura">
                </iframe>
              </div>
            </section>
          }

        }
      </main>

      <!-- MODAL PARA AMPLIAR IMÁGENES / LOGO -->
      @if (imagenModalAbierta) {
        <div class="modal-backdrop" (click)="cerrarModalImagen()">
          <div class="modal-image-content" (click)="$event.stopPropagation()">
            <button class="btn-close-modal" (click)="cerrarModalImagen()">✕</button>
            <img [src]="imagenSeleccionada" alt="Imagen ampliada" class="modal-full-img" />
          </div>
        </div>
      }

      <!-- MODAL PARA VER DETALLE DE LA PUBLICACIÓN -->
      @if (pubSeleccionadaModal) {
        <div class="modal-backdrop" (click)="cerrarModalPublicacion()">
          <div class="modal-pub-content" (click)="$event.stopPropagation()">
            <button class="btn-close-modal" (click)="cerrarModalPublicacion()">✕</button>
            
            <div class="modal-pub-grid">
              <div class="modal-pub-img-container">
                @if (pubSeleccionadaModal.foto_1) {
                  <img [src]="pubSeleccionadaModal.foto_1" [alt]="pubSeleccionadaModal.servicio_producto" class="modal-pub-img" />
                } @else {
                  <div class="modal-pub-placeholder">🏷️</div>
                }
                @if (pubSeleccionadaModal.precio !== null) {
                  <div class="price-tag-large">&#36;{{ pubSeleccionadaModal.precio | number:'1.0-2' }}</div>
                }
              </div>

              <div class="modal-pub-details">
                <h2 class="modal-pub-title">{{ pubSeleccionadaModal.servicio_producto }}</h2>
                <span class="modal-pub-date">Publicado el: {{ pubSeleccionadaModal.created_at | date:'mediumDate' }}</span>
                
                <div class="modal-pub-desc-box">
                  <h4>Descripción:</h4>
                  <p>{{ pubSeleccionadaModal.descripcion || 'Este negocio no agregó una descripción detallada para esta publicación.' }}</p>
                </div>

                <div class="modal-pub-footer">
                  <button 
                    class="btn-like-action" 
                    [class.liked]="likesMap[pubSeleccionadaModal.id]?.hasLiked"
                    (click)="onToggleLike(pubSeleccionadaModal.id)">
                    {{ likesMap[pubSeleccionadaModal.id]?.hasLiked ? '❤️ Te gusta' : '🤍 Dar Me gusta' }} 
                    ({{ likesMap[pubSeleccionadaModal.id]?.total || 0 }})
                  </button>

                  @if (linkWhatsappEmpresa) {
                    <a [href]="linkWhatsappEmpresa" target="_blank" rel="noopener noreferrer" class="btn-whatsapp">
                      💬 Contactar por WhatsApp
                    </a>
                  }
                </div>
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
    .page-wrapper { background-color: var(--bg-white); min-height: calc(100vh - 78px); display: flex; flex-direction: column; }
    .main-content { max-width: 1200px; margin: 0 auto; padding: 40px 20px; width: 100%; box-sizing: border-box; flex: 1; }
    
    .back-nav { margin-bottom: 24px; }
    .btn-back { color: var(--primary); font-weight: 700; text-decoration: none; font-size: 0.95rem; }
    .btn-back:hover { text-decoration: underline; }

    .company-header-card {
      background: var(--bg-page);
      border-radius: 24px;
      padding: 32px;
      display: flex;
      gap: 32px;
      align-items: center;
      margin-bottom: 40px;
      border: 1px solid #e2ebd8;
    }

    .company-logo-container { flex-shrink: 0; }
    .company-logo { width: 120px; height: 120px; border-radius: 20px; object-fit: cover; border: 3px solid var(--primary); }
    .company-logo.clickable { cursor: pointer; transition: transform 0.2s; }
    .company-logo.clickable:hover { transform: scale(1.05); }
    .company-logo-placeholder { width: 120px; height: 120px; border-radius: 20px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 3rem; }

    .company-info { flex: 1; }

    .company-title-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .company-title { margin: 0 0 4px 0; color: var(--primary); font-size: 2.2rem; font-weight: 900; }

    .verified-badge {
      background: #e0f2fe; color: #0369a1; font-weight: 800; font-size: 0.8rem;
      padding: 4px 12px; border-radius: 999px; white-space: nowrap;
    }

    .company-alias { color: var(--text-muted); font-weight: 600; margin: 0 0 16px 0; }

    .main-cta-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .btn-cta-whatsapp, .btn-cta-llamar {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 20px; border-radius: 999px; font-weight: 800; font-size: 0.9rem;
      text-decoration: none;
    }
    .btn-cta-whatsapp { background: #25d366; color: #fff; }
    .btn-cta-whatsapp:hover { opacity: 0.9; }
    .btn-cta-llamar { background: var(--primary); color: #fff; }
    .btn-cta-llamar:hover { opacity: 0.9; }

    .about-section { margin-bottom: 40px; }
    .about-text { color: var(--text-main); line-height: 1.7; font-size: 1rem; white-space: pre-line; }

    .category-group { margin-bottom: 20px; }
    
    .company-meta-grid { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; }
    .meta-element { background: #fff; padding: 6px 14px; border-radius: 10px; font-size: 0.9rem; color: var(--text-main); font-weight: 600; box-shadow: 0 2px 5px rgba(0,0,0,0.03); }

    .social-links-container { margin-bottom: 16px; }
    .social-label { display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; }
    .social-badges { display: flex; flex-wrap: wrap; gap: 10px; }
    .social-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--primary); color: var(--accent);
      padding: 6px 14px; border-radius: 999px;
      font-size: 0.85rem; font-weight: 700; text-decoration: none;
      transition: opacity 0.2s;
    }
    .social-badge:hover { opacity: 0.9; }

    .company-gallery-preview { display: flex; gap: 10px; }
    .company-gallery-preview img { height: 60px; width: 90px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; cursor: pointer; transition: transform 0.2s; }
    .company-gallery-preview img:hover { transform: scale(1.05); }

    .section-title { font-size: 1.6rem; color: var(--primary); margin: 0 0 6px 0; }
    .section-subtitle { color: var(--text-muted); margin: 0 0 24px 0; }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; margin-bottom: 50px; }
    .card { background: var(--bg-white); border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.02); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0,0,0,0.06); }
    .card-image-container { position: relative; height: 180px; background: var(--bg-page); }
    .card-image { width: 100%; height: 100%; object-fit: cover; }
    .card-image-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
    
    .btn-favorite { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.9); border: none; width: 34px; height: 34px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2; }
    .btn-favorite.liked { background: #fee2e2; }
    .price-tag { position: absolute; bottom: 12px; right: 12px; background: var(--accent); color: var(--primary); font-weight: 900; padding: 4px 10px; border-radius: 10px; font-size: 0.9rem; }

    .card-content { padding: 16px; }
    .card-title { margin: 0 0 6px 0; color: var(--primary); font-size: 1rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card-desc-preview { font-size: 0.85rem; color: var(--text-muted); margin: 0 0 12px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-meta { font-size: 0.8rem; color: var(--text-muted); }

    /* OPINIONES */
    .reviews-section { margin-top: 20px; margin-bottom: 40px; }

    .rating-summary { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .rating-number { font-size: 2rem; font-weight: 900; color: var(--primary); }
    .rating-stars { font-size: 1.1rem; }
    .rating-count { color: var(--text-muted); font-size: 0.9rem; }

    .reviews-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
    .review-item { background: var(--bg-page); border-radius: 14px; padding: 16px 18px; }
    .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px; }
    .review-author { font-weight: 800; color: var(--primary); font-size: 0.92rem; }
    .review-stars { font-size: 0.85rem; }
    .review-comment { color: var(--text-main); margin: 0 0 6px 0; line-height: 1.5; font-size: 0.92rem; }
    .review-date { color: var(--text-muted); font-size: 0.78rem; }

    .empty-reviews { color: var(--text-muted); margin-bottom: 20px; }

    .review-form {
      background: #fff; border: 1px solid #e2ebd8; border-radius: 16px;
      padding: 20px; max-width: 460px;
    }
    .review-form h4 { margin: 0 0 12px 0; color: var(--primary); }

    .star-picker { display: flex; gap: 4px; margin-bottom: 12px; }
    .star-btn {
      background: none; border: none; font-size: 1.5rem; cursor: pointer;
      opacity: 0.3; filter: grayscale(1); transition: opacity 0.15s, filter 0.15s;
      padding: 0;
    }
    .star-btn.active { opacity: 1; filter: grayscale(0); }

    .review-textarea {
      width: 100%; border: 1px solid #cbd5e1; border-radius: 12px; padding: 10px 12px;
      font-family: inherit; font-size: 0.9rem; resize: vertical; margin-bottom: 12px;
      box-sizing: border-box;
    }

    .btn-enviar-review {
      background: var(--primary); color: var(--accent); border: none;
      padding: 10px 20px; border-radius: 12px; font-weight: 800; cursor: pointer;
    }
    .btn-enviar-review:disabled { opacity: 0.6; cursor: not-allowed; }

    .login-prompt, .ya-opinaste { color: var(--text-muted); font-size: 0.9rem; }
    .login-prompt a { color: var(--primary); font-weight: 700; }

    /* ESTILOS MAPA */
    .company-map-section { margin-top: 20px; margin-bottom: 30px; }
    .map-container {
      background: var(--bg-page);
      border-radius: 20px;
      padding: 10px;
      border: 1px solid #e2ebd8;
      box-shadow: 0 4px 15px rgba(0,0,0,0.02);
    }

    /* ESTILOS MODALES */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 20px; backdrop-filter: blur(4px);
    }
    .modal-image-content { position: relative; max-width: 90%; max-height: 90vh; }
    .modal-full-img { width: 100%; height: auto; max-height: 85vh; border-radius: 16px; object-fit: contain; }
    
    .modal-pub-content {
      background: #fff; width: 100%; max-width: 800px; border-radius: 24px;
      overflow: hidden; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }
    .modal-pub-grid { display: flex; flex-direction: column; max-height: 85vh; overflow-y: auto; }
    .modal-pub-img-container { position: relative; width: 100%; height: 300px; background: #000; }
    .modal-pub-img { width: 100%; height: 100%; object-fit: cover; }
    .modal-pub-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 4rem; background: var(--bg-page); }
    .price-tag-large { position: absolute; bottom: 16px; right: 16px; background: var(--accent); color: var(--primary); font-weight: 900; padding: 6px 14px; border-radius: 12px; font-size: 1.2rem; }

    .modal-pub-details { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .modal-pub-title { margin: 0; color: var(--primary); font-size: 1.8rem; font-weight: 900; }
    .modal-pub-date { font-size: 0.85rem; color: var(--text-muted); }
    .modal-pub-desc-box h4 { margin: 0 0 6px 0; color: var(--text-main); font-size: 1rem; }
    .modal-pub-desc-box p { margin: 0; color: var(--text-muted); line-height: 1.5; font-size: 0.95rem; }

    .modal-pub-footer { display: flex; gap: 12px; margin-top: 10px; flex-wrap: wrap; }
    .btn-like-action { background: #f1f5f9; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; color: var(--text-main); }
    .btn-like-action.liked { background: #fee2e2; color: #dc2626; }
    .btn-whatsapp { background: #25d366; color: white; text-decoration: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; display: inline-flex; align-items: center; }

    .btn-close-modal {
      position: absolute; top: 16px; right: 16px; background: rgba(0,0,0,0.6); color: white;
      border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 1.2rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center; z-index: 10; transition: background 0.2s;
    }
    .btn-close-modal:hover { background: rgba(0,0,0,0.8); }

    .loading-state, .empty-state, .empty-state-small { text-align: center; padding: 40px; color: var(--text-muted); }

    @media (min-width: 768px) {
      .modal-pub-grid { flex-direction: row; }
      .modal-pub-img-container { width: 50%; height: auto; min-height: 400px; }
      .modal-pub-details { width: 50%; }
    }

    @media (max-width: 768px) {
      .company-header-card { flex-direction: column; text-align: center; align-items: center; }
      .company-meta-grid { justify-content: center; }
      .social-badges { justify-content: center; }
      .company-gallery-preview { justify-content: center; }
    }
  `]
})
export class EmpresaDetalleComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private likeService = inject(LikeService);
  private sanitizer = inject(DomSanitizer);
  private publicacionesService = inject(PublicacionesService);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private renderer2 = inject(Renderer2);
  private document = inject(DOCUMENT);

  // ID de la plataforma "WhatsApp Business" en plataformas_sociales (mismo
  // valor usado en PublicacionesService, pero aquí redesSociales viene en
  // una forma distinta -join a plataformas_sociales por nombre-, así que
  // se resuelve por nombre en vez de por este id).
  private readonly PLATAFORMA_WHATSAPP_ID = '4e35d5d5-8d91-4131-8b04-dc44b5195527';

  empresaId: string | null = null;
  empresa: Empresa | null = null;
  publicaciones: PublicacionConEmpresa[] = [];
  categorias: Categoria[] = [];
  redesSociales: RedSocial[] = [];
  cargando = true;
  transeunteId = '';
  likesMap: { [key: string]: { total: number; hasLiked: boolean } } = {};
  urlMapaSegura: SafeResourceUrl | '' = '';

  // Estados para las Modales
  imagenModalAbierta = false;
  imagenSeleccionada = '';
  pubSeleccionadaModal: PublicacionConEmpresa | null = null;

  // Opiniones
  reviews: ReviewEmpresa[] = [];
  miReview: ReviewEmpresa | null = null;
  nuevoRating = 5;
  nuevoComentario = '';
  enviandoReview = false;
  // Evita mostrar "inicia sesión" antes de que termine de resolverse el
  // usuario actual (transeunteId empieza en '' tanto si no hay sesión
  // como mientras todavía se está consultando).
  currentUserChecked = false;

  get promedioRating(): number {
    if (this.reviews.length === 0) return 0;
    return this.reviews.reduce((suma, r) => suma + r.rating, 0) / this.reviews.length;
  }

  get promedioRedondeado(): number {
    return Math.round(this.promedioRating);
  }

  get linkWhatsappEmpresa(): string | null {
    const redWhatsapp = this.redesSociales.find(r =>
      (r.plataformas_sociales?.nombre || '').toLowerCase().includes('whatsapp')
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
      `Hola, vi el perfil de ${this.empresa?.nombre || 'tu negocio'} en Qué Busca Mijo y quisiera más información.`
    );
    return `https://wa.me/${numero}?text=${mensaje}`;
  }

  get publicacionesAgrupadas(): GrupoCategoria[] {
    const grupos = new Map<string, GrupoCategoria>();

    for (const pub of this.publicaciones) {
      const clave = pub.categoria_id || '_sin_categoria';
      if (!grupos.has(clave)) {
        const cat = this.categorias.find(c => c.id === pub.categoria_id);
        grupos.set(clave, {
          categoriaId: pub.categoria_id,
          categoriaNombre: cat?.nombre || 'Otras publicaciones',
          categoriaIcono: cat?.icono || '📁',
          publicaciones: []
        });
      }
      grupos.get(clave)!.publicaciones.push(pub);
    }

    return Array.from(grupos.values());
  }

  async ngOnInit() {
    // Esta página se sirve desde dos rutas distintas: /empresa/:id (UUID,
    // usado internamente) y /miempresa/:alias (amigable, para compartir).
    // Solo uno de los dos parámetros estará presente según cuál ruta matcheó.
    const idParam = this.route.snapshot.paramMap.get('id');
    const aliasParam = this.route.snapshot.paramMap.get('alias');

    const user = await this.authService.getUser();
    if (user) {
      const { data } = await this.authService.getSupabaseClient().from('transeuntes').select('id').eq('id', user.id).maybeSingle();
      if (data) this.transeunteId = data.id;
    }

    this.categorias = await this.publicacionesService.cargarCategorias();

    if (idParam) {
      await this.cargarDatosEmpresa('id', idParam);
    } else if (aliasParam) {
      await this.cargarDatosEmpresa('alias', aliasParam);
    }

    if (this.empresa) {
      // IMPORTANTE: a partir de aquí usamos siempre el id real de la fila
      // (this.empresa.id), sin importar si llegamos por id o por alias,
      // porque redes_sociales y publicaciones filtran por empresa_id (uuid).
      this.empresaId = this.empresa.id;
      this.actualizarMetaTags(this.empresa);
      this.actualizarJsonLd(this.empresa);
      await this.cargarRedesSociales();
      await this.cargarPublicacionesDeEmpresa();
      await this.cargarReviews();
    }

    this.currentUserChecked = true;
    this.cargando = false;
  }

  // Mismo propósito que en /producto/:slug (Fase 3): que compartir el
  // perfil de un negocio por WhatsApp/redes muestre una tarjeta con su
  // logo, nombre y descripción, en vez de un link pelado.
  private actualizarMetaTags(empresa: Empresa) {
    const titulo = `${empresa.nombre} | Qué Busca Mijo`;
    const ciudadTxt = empresa.ciudad?.nombre ? ` en ${empresa.ciudad.nombre}` : '';
    const descripcion = (
      empresa.sobre_nosotros || `Encuentra productos y servicios de ${empresa.nombre}${ciudadTxt} en Qué Busca Mijo.`
    ).slice(0, 160);

    this.titleService.setTitle(titulo);
    this.metaService.updateTag({ name: 'description', content: descripcion });
    this.metaService.updateTag({ property: 'og:title', content: empresa.nombre });
    this.metaService.updateTag({ property: 'og:description', content: descripcion });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    if (empresa.logo) {
      this.metaService.updateTag({ property: 'og:image', content: empresa.logo });
    }
  }

  // Datos estructurados (schema.org/LocalBusiness). Se llama dos veces:
  // apenas carga la empresa (sin rating todavía), y de nuevo al final de
  // cargarReviews() para incluir aggregateRating una vez están disponibles.
  private actualizarJsonLd(empresa: Empresa) {
    const jsonLd: any = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: empresa.nombre
    };

    if (empresa.logo) jsonLd.image = empresa.logo;
    if (empresa.sobre_nosotros) jsonLd.description = empresa.sobre_nosotros;

    if (empresa.direccion || empresa.ciudad?.nombre) {
      jsonLd.address = { '@type': 'PostalAddress', addressCountry: 'CO' };
      if (empresa.direccion) jsonLd.address.streetAddress = empresa.direccion;
      if (empresa.ciudad?.nombre) jsonLd.address.addressLocality = empresa.ciudad.nombre;
    }

    if (this.reviews.length > 0) {
      jsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: this.promedioRating.toFixed(1),
        reviewCount: this.reviews.length
      };
    }

    this.insertarJsonLd(jsonLd);
  }

  private insertarJsonLd(datos: object) {
    this.eliminarJsonLd();
    const script = this.renderer2.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'ld-json-empresa';
    script.text = JSON.stringify(datos);
    this.renderer2.appendChild(this.document.head, script);
  }

  private eliminarJsonLd() {
    const existente = this.document.getElementById('ld-json-empresa');
    if (existente) {
      this.renderer2.removeChild(this.document.head, existente);
    }
  }

  ngOnDestroy() {
    this.eliminarJsonLd();
  }

  async cargarReviews() {
    if (!this.empresaId) return;

    const { data, error } = await this.authService.getSupabaseClient()
      .from('reviews_empresa')
      .select(`
        id,
        rating,
        comentario,
        created_at,
        transeunte_id,
        transeunte:transeuntes (
          nombres,
          apellidos
        )
      `)
      .eq('empresa_id', this.empresaId)
      .eq('estado', 'activo')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar opiniones:', error);
      return;
    }

    this.reviews = (data as unknown as ReviewEmpresa[]) || [];

    if (this.transeunteId) {
      this.miReview = this.reviews.find(r => r.transeunte_id === this.transeunteId) || null;
    }

    // Las reviews llegan después del primer actualizarJsonLd (que corre
    // apenas carga la empresa) -- se regenera para incluir aggregateRating.
    if (this.empresa) {
      this.actualizarJsonLd(this.empresa);
    }
  }

  async enviarReview() {
    if (!this.transeunteId || !this.empresaId || this.enviandoReview) return;

    this.enviandoReview = true;
    try {
      const { error } = await this.authService.getSupabaseClient()
        .from('reviews_empresa')
        .insert({
          empresa_id: this.empresaId,
          transeunte_id: this.transeunteId,
          rating: this.nuevoRating,
          comentario: this.nuevoComentario.trim() || null,
          estado: 'activo'
        });

      if (error) {
        console.error('Error al publicar la opinión:', error);
        alert('No pudimos publicar tu opinión. Intenta de nuevo.');
        return;
      }

      this.nuevoComentario = '';
      this.nuevoRating = 5;
      await this.cargarReviews();
    } finally {
      this.enviandoReview = false;
    }
  }

  async cargarDatosEmpresa(campo: 'id' | 'alias', valor: string) {
    const { data, error } = await this.authService.getSupabaseClient()
      .from('empresas')
      .select(`
        *,
        ciudad:ciudades (
          nombre,
          departamento:departamentos (
            nombre
          )
        )
      `)
      .eq(campo, valor)
      .maybeSingle();

    if (!error && data) {
      this.empresa = data as Empresa;
      this.generarUrlMapa();
    }
  }

  generarUrlMapa() {
    if (!this.empresa?.direccion) return;
    const query = encodeURIComponent(
      `${this.empresa.direccion}, ${this.empresa.ciudad?.nombre || ''}, ${this.empresa.ciudad?.departamento?.nombre || ''}`
    );
    const urlEmbebida = `https://maps.google.com/maps?q=${query}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
    this.urlMapaSegura = this.sanitizer.bypassSecurityTrustResourceUrl(urlEmbebida);
  }

  async cargarRedesSociales() {
    const { data, error } = await this.authService.getSupabaseClient()
      .from('redes_sociales')
      .select(`
        id,
        url,
        plataformas_sociales:plataforma_id (
          nombre,
          icono
        )
      `)
      .eq('empresa_id', this.empresaId);

    if (!error && data) {
      this.redesSociales = data as any[];
    } else {
      this.redesSociales = [];
    }
  }

  async cargarPublicacionesDeEmpresa() {
    const { data, error } = await this.authService.getSupabaseClient()
      .from('publicaciones')
      .select('*')
      .eq('empresa_id', this.empresaId)
      .eq('estado', 'activo')
      .order('created_at', { ascending: false });

    if (!error) {
      this.publicaciones = data || [];
      for (const pub of this.publicaciones) {
        const total = await this.likeService.contarLikes(pub.id);
        let hasLiked = false;
        if (this.transeunteId) {
          hasLiked = await this.likeService.verificarSiDioLike(pub.id, this.transeunteId);
        }
        this.likesMap[pub.id] = { total, hasLiked };
      }
    }
  }

  async onToggleLike(publicacionId: string) {
    if (!this.transeunteId) return;
    const estadoActual = this.likesMap[publicacionId] || { total: 0, hasLiked: false };
    const nuevoEstado = await this.likeService.toggleLike(publicacionId, this.transeunteId, estadoActual.hasLiked);
    const nuevoTotal = nuevoEstado ? estadoActual.total + 1 : Math.max(0, estadoActual.total - 1);
    this.likesMap[publicacionId] = { total: nuevoTotal, hasLiked: nuevoEstado };
  }

  // Métodos para controlar el Modal de la Imagen
  abrirModalImagen(url: string) {
    this.imagenSeleccionada = url;
    this.imagenModalAbierta = true;
  }

  cerrarModalImagen() {
    this.imagenModalAbierta = false;
    this.imagenSeleccionada = '';
  }

  // Métodos para controlar el Modal de la Publicación
  abrirModalPublicacion(pub: PublicacionConEmpresa) {
    this.pubSeleccionadaModal = pub;
  }

  cerrarModalPublicacion() {
    this.pubSeleccionadaModal = null;
  }
}