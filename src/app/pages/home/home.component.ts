import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
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
  imports: [CommonModule, FormsModule, RouterLink, FooterComponent],
  template: `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f4f8f1; min-height: calc(100vh - 78px); color: #002b66; display: flex; flex-direction: column; justify-content: space-between;">
      
      <!-- HERO SECTION & CONTENIDO PRINCIPAL -->
      <main style="max-width: 1100px; margin: 0 auto; padding: 40px 20px 60px 20px; text-align: center; width: 100%; box-sizing: border-box;">
        
        <div style="display: inline-block; background-color: #002b66; color: #64d500; padding: 8px 20px; border-radius: 25px; font-weight: 700; font-size: 0.95rem; margin-bottom: 20px; border: 1px solid #64d500;">
          ✨ ¡La plataforma que todo lo encuentra!
        </div>

        <h1 style="font-size: 3rem; font-weight: 900; color: #002b66; margin-bottom: 12px; line-height: 1.15;">
          ¿Y usted, <span style="background: linear-gradient(180deg, #64d500 0%, #4eb200 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; -webkit-text-stroke: 1px #002b66;">qué busca mijo?</span>
        </h1>

        <p style="font-size: 1.15rem; color: #335588; max-width: 620px; margin: 0 auto 30px auto; font-weight: 500; line-height: 1.5;">
          Explora los productos y servicios ofrecidos por empresas de tu región. Rápido, seguro y sin intermediarios.
        </p>

        <!-- BUSCADOR PRINCIPAL -->
        <div style="max-width: 680px; margin: 0 auto 40px auto; position: relative;">
          <div style="display: flex; gap: 10px; background: #ffffff; padding: 8px 12px; border-radius: 35px; border: 2.5px solid #002b66; box-shadow: 0 6px 0px #002b66; align-items: center;">
            <span style="font-size: 1.4rem; margin-left: 10px;">🔍</span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (input)="filtrarPublicaciones()" 
              placeholder="¿Qué servicio o producto buscas hoy? (Ej: Pizza, Plomería, Mantenimiento)"
              style="flex: 1; border: none; outline: none; font-size: 1rem; font-weight: 600; color: #002b66; padding: 8px 0;"
            />
            @if (searchQuery) {
              <button 
                (click)="limpiarBuscador()" 
                style="background: #e2ebd8; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-weight: bold; color: #002b66;">
                ✕
              </button>
            }
          </div>
        </div>

        <!-- SECCIÓN DE PUBLICACIONES DESTACADAS / CATÁLOGO -->
        <section style="text-align: left; margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h2 style="font-size: 1.8rem; font-weight: 800; color: #002b66; margin: 0;">
              🛍️ Catálogo de Ofertas y Servicios
            </h2>
            <span style="font-weight: 700; color: #335588; font-size: 0.95rem;">
              {{ publicacionesFiltradas.length }} {{ publicacionesFiltradas.length === 1 ? 'resultado' : 'resultados' }}
            </span>
          </div>

          <!-- ESTADO CARGANDO -->
          @if (cargando) {
            <div style="text-align: center; padding: 50px; background: #ffffff; border-radius: 20px; border: 2px solid #e2ebd8;">
              <p style="font-size: 1.1rem; font-weight: 700; color: #335588; margin: 0;">Cargando catálogo de ofertas...</p>
            </div>
          } 
          <!-- ESTADO SIN RESULTADOS -->
          @else if (publicacionesFiltradas.length === 0) {
            <div style="text-align: center; padding: 50px 20px; background: #ffffff; border-radius: 20px; border: 2px dashed #002b66;">
              <span style="font-size: 3rem;">📦</span>
              <h3 style="color: #002b66; font-size: 1.4rem; margin: 12px 0 6px 0;">No se encontraron publicaciones</h3>
              <p style="color: #5577a6; margin: 0;">Intenta con otros términos de búsqueda o revisa más tarde.</p>
            </div>
          } 
          <!-- GRID DE PUBLICACIONES -->
          @else {
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">
              @for (pub of publicacionesFiltradas; track pub.id) {
                <div 
                  style="background: #ffffff; border-radius: 20px; border: 2px solid #e2ebd8; overflow: hidden; box-shadow: 0 6px 12px rgba(0,43,102,0.04); display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer;"
                  (click)="abrirModal(pub)">
                  
                  <div>
                    <div style="height: 180px; background-color: #e8f7d8; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                      @if (pub.foto_1) {
                        <img [src]="pub.foto_1" [alt]="pub.servicio_producto" style="width: 100%; height: 100%; object-fit: cover;" />
                      } @else {
                        <span style="font-size: 3rem;">🏷️</span>
                      }

                      @if (pub.precio !== null) {
                        <div style="position: absolute; bottom: 12px; right: 12px; background: #002b66; color: #64d500; font-weight: 900; padding: 6px 14px; border-radius: 20px; font-size: 1rem; border: 1px solid #64d500;">
                          &#36;{{ pub.precio | number:'1.0-2' }}
                        </div>
                      }
                    </div>

                    <div style="padding: 20px;">
                      <h3 style="margin: 0 0 8px 0; color: #002b66; font-size: 1.2rem; font-weight: 800; line-height: 1.3;">
                        {{ pub.servicio_producto }}
                      </h3>
                      <p style="margin: 0; color: #5577a6; font-size: 0.9rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        {{ pub.descripcion || 'Sin descripción disponible.' }}
                      </p>
                    </div>
                  </div>

                  <div style="padding: 0 20px 20px 20px;">
                    <div style="border-top: 1px solid #f0f4ec; padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-size: 0.8rem; font-weight: 700; color: #64d500; background: #002b66; padding: 4px 10px; border-radius: 12px;">
                        Ver Detalles ➔
                      </span>
                      <span style="font-size: 0.75rem; color: #88a0c0; font-weight: 600;">
                        {{ pub.created_at | date:'mediumDate' }}
                      </span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <!-- SECCIONES INFORMATIVAS INFERIORES -->
        <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-top: 60px; text-align: left;">
          <div style="background: #ffffff; padding: 26px; border-radius: 20px; border: 2px solid #e2ebd8; box-shadow: 0 6px 12px rgba(0,43,102,0.04);">
            <div style="background-color: #e8f7d8; width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 14px; border: 1px solid #64d500;">🔍</div>
            <h3 style="margin: 0 0 8px 0; color: #002b66; font-size: 1.15rem; font-weight: 800;">Búsquedas Inteligentes</h3>
            <p style="margin: 0; color: #5577a6; font-size: 0.9rem; line-height: 1.5;">Diseñado para ayudarte a encontrar productos y servicios en segundos.</p>
          </div>

          <div style="background: #ffffff; padding: 26px; border-radius: 20px; border: 2px solid #e2ebd8; box-shadow: 0 6px 12px rgba(0,43,102,0.04);">
            <div style="background-color: #002b66; width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 14px; border: 1px solid #64d500;">🛡️</div>
            <h3 style="margin: 0 0 8px 0; color: #002b66; font-size: 1.15rem; font-weight: 800;">Seguridad Garantizada</h3>
            <p style="margin: 0; color: #5577a6; font-size: 0.9rem; line-height: 1.5;">Tus credenciales y datos personales están protegidos con autenticación cifrada.</p>
          </div>

          <div style="background: #ffffff; padding: 26px; border-radius: 20px; border: 2px solid #e2ebd8; box-shadow: 0 6px 12px rgba(0,43,102,0.04);">
            <div style="background-color: #e8f7d8; width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 14px; border: 1px solid #64d500;">⚡</div>
            <h3 style="margin: 0 0 8px 0; color: #002b66; font-size: 1.15rem; font-weight: 800;">Experiencia Ágil</h3>
            <p style="margin: 0; color: #5577a6; font-size: 0.9rem; line-height: 1.5;">Navega de forma intuitiva desde tu computadora o teléfono móvil.</p>
          </div>
        </section>

      </main>

      <!-- MODAL DETALLE DE PUBLICACIÓN -->
      @if (publicacionSeleccionada) {
        <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 43, 102, 0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px;" (click)="cerrarModal()">
          <div style="background: #ffffff; border-radius: 24px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 28px; position: relative; border: 3px solid #002b66; box-shadow: 0 20px 40px rgba(0,0,0,0.2);" (click)="$event.stopPropagation()">
            
            <button 
              (click)="cerrarModal()" 
              style="position: absolute; top: 16px; right: 16px; background: #f0f4ec; border: none; border-radius: 50%; width: 36px; height: 36px; font-weight: bold; cursor: pointer; color: #002b66; font-size: 1.1rem;">
              ✕
            </button>

            <h2 style="color: #002b66; font-size: 1.6rem; font-weight: 900; margin: 0 0 10px 0; padding-right: 40px;">
              {{ publicacionSeleccionada.servicio_producto }}
            </h2>

            @if (publicacionSeleccionada.precio !== null) {
              <div style="font-size: 1.5rem; font-weight: 900; color: #4eb200; margin-bottom: 16px;">
                &#36;{{ publicacionSeleccionada.precio | number:'1.0-2' }}
              </div>
            }

            <div style="display: flex; gap: 10px; overflow-x: auto; margin-bottom: 20px; padding-bottom: 8px;">
              @if (publicacionSeleccionada.foto_1) {
                <img [src]="publicacionSeleccionada.foto_1" alt="Foto 1" style="height: 200px; border-radius: 12px; object-fit: cover; border: 1px solid #e2ebd8;" />
              }
              @if (publicacionSeleccionada.foto_2) {
                <img [src]="publicacionSeleccionada.foto_2" alt="Foto 2" style="height: 200px; border-radius: 12px; object-fit: cover; border: 1px solid #e2ebd8;" />
              }
              @if (publicacionSeleccionada.foto_3) {
                <img [src]="publicacionSeleccionada.foto_3" alt="Foto 3" style="height: 200px; border-radius: 12px; object-fit: cover; border: 1px solid #e2ebd8;" />
              }
            </div>

            <div style="margin-bottom: 20px;">
              <h4 style="color: #002b66; margin: 0 0 6px 0; font-size: 1rem; font-weight: 800;">Descripción:</h4>
              <p style="color: #335588; font-size: 0.95rem; line-height: 1.5; white-space: pre-line; margin: 0;">
                {{ publicacionSeleccionada.descripcion || 'Sin descripción disponible.' }}
              </p>
            </div>

            <div style="background: #f4f8f1; padding: 16px; border-radius: 16px; border: 1px solid #e2ebd8;">
              <span style="font-size: 0.8rem; font-weight: 800; color: #5577a6; text-transform: uppercase;">Publicado el:</span>
              <div style="color: #002b66; font-weight: 700; font-size: 0.95rem; margin-top: 2px;">
                {{ publicacionSeleccionada.created_at | date:'fullDate' }}
              </div>
            </div>

            <button 
              (click)="cerrarModal()" 
              style="width: 100%; margin-top: 24px; background: #002b66; color: #64d500; border: none; padding: 12px; border-radius: 14px; font-weight: 800; font-size: 1rem; cursor: pointer;">
              Cerrar Detalle
            </button>
          </div>
        </div>
      }

      <!-- COMPONENTE DE PIE DE PÁGINA REUTILIZABLE -->
      <app-footer></app-footer>

    </div>
  `
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);

  currentUser: User | null = null;
  publicaciones: PublicacionConEmpresa[] = [];
  publicacionesFiltradas: PublicacionConEmpresa[] = [];
  
  cargando = true;
  searchQuery = '';
  publicacionSeleccionada: PublicacionConEmpresa | null = null;

  async ngOnInit() {
    this.currentUser = await this.authService.getUser();
    this.authService.onAuthStateChange((_event, session) => {
      this.currentUser = session ? session.user : null;
    });

    await this.cargarPublicaciones();
  }

  async cargarPublicaciones() {
    this.cargando = true;
    const { data, error } = await this.authService.getSupabaseClient()
      .from('publicaciones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar publicaciones:', error);
    } else {
      this.publicaciones = (data as PublicacionConEmpresa[]) || [];
      this.publicacionesFiltradas = [...this.publicaciones];
    }
    this.cargando = false;
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