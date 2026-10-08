import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../core/services/auth.service';
import { LikeService } from '../../core/services/like.service';
import { PublicacionConEmpresa } from '../home/home.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

export interface RedSocial {
  id: string;
  url: string;
  plataformas_sociales?: {
    nombre: string;
    icono: string;
  };
}

@Component({
  selector: 'app-empresa-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, FooterComponent],
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
              <h1 class="company-title">{{ empresa.nombre }}</h1>
              @if (empresa.alias) {
                <p class="company-alias">&#64;{{ empresa.alias }}</p>
              }
              
              <div class="company-meta-grid">
                @if (empresa.direccion) {
                  <span class="meta-element">📍 {{ empresa.direccion }}</span>
                }
                @if (empresa.ciudad?.nombre) {
                  <span class="meta-element">🏙️ {{ empresa.ciudad.nombre }}</span>
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

          <!-- SECCIÓN DE PUBLICACIONES DE LA EMPRESA -->
          <section class="company-offers-section">
            <h2 class="section-title">📦 Publicaciones de {{ empresa.nombre }}</h2>
            <p class="section-subtitle">Explora todos los productos y servicios ofrecidos por este negocio.</p>

            @if (publicaciones.length === 0) {
              <div class="empty-state-small">
                <p>Esta empresa aún no cuenta con publicaciones activas.</p>
              </div>
            } @else {
              <div class="cards-grid">
                @for (pub of publicaciones; track pub.id) {
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
            }
          </section>

          <!-- SECCIÓN DE MAPA / UBICACIÓN -->
          @if (empresa.direccion) {
            <section class="company-map-section">
              <h2 class="section-title">📍 Ubicación del negocio</h2>
              <p class="section-subtitle">{{ empresa.direccion }} {{ empresa.ciudad?.nombre ? '- ' + empresa.ciudad.nombre : '' }}</p>
              
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

                  @if (empresa.rep_telefono) {
                    <a [href]="'https://wa.me/593' + empresa.rep_telefono" target="_blank" class="btn-whatsapp">
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
    .company-title { margin: 0 0 4px 0; color: var(--primary); font-size: 2.2rem; font-weight: 900; }
    .company-alias { color: var(--text-muted); font-weight: 600; margin: 0 0 16px 0; }
    
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
export class EmpresaDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private likeService = inject(LikeService);
  private sanitizer = inject(DomSanitizer);

  empresaId: string | null = null;
  empresa: any = null;
  publicaciones: PublicacionConEmpresa[] = [];
  redesSociales: RedSocial[] = [];
  cargando = true;
  transeunteId = '';
  likesMap: { [key: string]: { total: number; hasLiked: boolean } } = {};
  urlMapaSegura: SafeResourceUrl | '' = '';

  // Estados para las Modales
  imagenModalAbierta = false;
  imagenSeleccionada = '';
  pubSeleccionadaModal: PublicacionConEmpresa | null = null;

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
      await this.cargarRedesSociales();
      await this.cargarPublicacionesDeEmpresa();
    }

    this.cargando = false;
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
      this.empresa = data;
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