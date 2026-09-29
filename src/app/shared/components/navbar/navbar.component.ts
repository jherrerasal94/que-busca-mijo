import { Component, inject, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { AuthService } from '../../../core/services/auth.service';

export interface PlanEmpresa {
  nombre: string;
  limite_publicaciones?: number | null;
  costo?: number | null;
}

export interface EmpresaInfo {
  nombre?: string;
  logo?: string | null;
  plan_id?: string | null;
  plan_valido_hasta?: string | null;
  plan?: PlanEmpresa | null;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        
        <!-- BRAND / LOGO EXACTO -->
        <div 
          routerLink="/" 
          class="brand-logo"
          tabindex="0"
          (click)="cerrarMenu()">
          <img 
            src="assets/logo.png" 
            alt="Logo QBM" 
            class="logo-img">
          <span class="brand-text">
            ¿Qué Busca <span class="brand-accent">Mijo?</span>
          </span>
        </div>

        <!-- BOTÓN DESPLEGABLE / MENÚ INTERACTIVO -->
        <div class="menu-wrapper">
          
          <!-- Botón Activador del Menú -->
          <button 
            class="menu-trigger" 
            [class.active]="menuAbierto"
            (click)="toggleMenu()"
            aria-label="Abrir menú de usuario">
            
            <div class="user-avatar-badge">
              @if (userRole === 'empresa' && empresaInfo?.logo) {
                <img [src]="empresaInfo!.logo!" [alt]="empresaInfo?.nombre || 'Logo empresa'" class="avatar-logo-img" />
              } @else if (user) {
                <span>{{ user.email?.charAt(0)?.toUpperCase() || '👤' }}</span>
              } @else {
                <span>👤</span>
              }
            </div>

            <span class="menu-label">
              {{ user ? (user.email | slice:0:12) + '...' : 'Menú' }}
            </span>

            <svg class="chevron-icon" [class.rotate]="menuAbierto" viewBox="0 0 24 24" width="18" height="18">
              <path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          <!-- DESPLEGABLE / MENU FLOTANTE (FLYOUT MODERNO) -->
          @if (menuAbierto) {
            <div class="dropdown-panel animate-pop">
              
              <!-- Encabezado de Sesión si está autenticado -->
              @if (user) {
                <div class="dropdown-header">
                  <div class="user-info">
                    <span class="user-role-badge" [class.empresa]="userRole === 'empresa'" [class.admin]="userRole === 'admin'">
                      {{ userRole === 'admin' ? '🛡️ Admin' : (userRole === 'empresa' ? '🏢 Empresa' : '👤 Usuario') }}
                    </span>
                    <span class="user-full-email" [title]="user.email">{{ user.email }}</span>

                    @if (userRole === 'empresa') {
                      <span class="plan-badge" [class.sin-plan]="!empresaInfo?.plan">
                        💎 {{ empresaInfo?.plan?.nombre || 'Sin plan activo' }}
                      </span>
                    }
                  </div>
                </div>
                <div class="dropdown-divider"></div>
              }

              <!-- Opciones de Navegación -->
              <div class="dropdown-body">
                
                <a routerLink="/" 
                   routerLinkActive="active-item" 
                   [routerLinkActiveOptions]="{ exact: true }" 
                   class="dropdown-item" 
                   (click)="cerrarMenu()">
                  <span class="item-icon">🏠</span>
                  <span>Inicio</span>
                </a>

                <!-- ENLACE PÚBLICO DE PLANES -->
                <a routerLink="/planes" 
                   routerLinkActive="active-item" 
                   class="dropdown-item" 
                   (click)="cerrarMenu()">
                  <span class="item-icon">💎</span>
                  <span>Planes para Empresas</span>
                </a>

                @if (user) {
                  <!-- Opción Exclusiva Empresa -->
                  @if (userRole === 'empresa') {
                    <a routerLink="/mis-publicaciones" 
                       routerLinkActive="active-item" 
                       class="dropdown-item empresa-item" 
                       (click)="cerrarMenu()">
                      <span class="item-icon">📢</span>
                      <span>Gestionar Publicaciones</span>
                    </a>
                  }

                  <!-- Opción Exclusiva Administrador: Gestionar Categorías -->
                  @if (userRole === 'admin') {
                    <a routerLink="/admin/categorias" 
                       routerLinkActive="active-item" 
                       class="dropdown-item admin-item" 
                       (click)="cerrarMenu()">
                      <span class="item-icon">📁</span>
                      <span>Gestionar Categorías</span>
                    </a>

                    <a routerLink="/admin-planes" 
                       routerLinkActive="active-item" 
                       class="dropdown-item admin-item" 
                       (click)="cerrarMenu()">
                      <span class="item-icon">📋</span>
                      <span>Administrar Solicitudes</span>
                    </a>
                  }

                  <a routerLink="/perfil" 
                     routerLinkActive="active-item" 
                     class="dropdown-item" 
                     (click)="cerrarMenu()">
                    <span class="item-icon">⚙️</span>
                    <span>Mi Perfil</span>
                  </a>

                  <div class="dropdown-divider"></div>

                  <!-- Botón Cerrar Sesión -->
                  <button (click)="logout()" class="dropdown-item logout-item">
                    <span class="item-icon">🚪</span>
                    <span>Cerrar Sesión</span>
                  </button>

                } @else {

                  <!-- Opciones para Invitados -->
                  <a routerLink="/login" 
                     routerLinkActive="active-item" 
                     class="dropdown-item" 
                     (click)="cerrarMenu()">
                    <span class="item-icon">🔑</span>
                    <span>Iniciar Sesión</span>
                  </a>

                  <div class="dropdown-divider"></div>

                  <!-- Botón Estilo Píldora para Registro dentro del Menú -->
                  <a routerLink="/register" class="btn-register-exact" (click)="cerrarMenu()">
                    Registrarse
                  </a>

                }
              </div>

            </div>
          }

        </div>

      </div>
    </nav>
  `,
  styles: [`
    /* NAVBAR CONTENEDOR */
    .navbar {
      background-color: #ffffff;
      border-bottom: 3px solid #84cc16;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      font-family: 'Segoe UI', Roboto, sans-serif;
    }

    .navbar-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 20px;
      height: 72px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* LOGO & MARCA */
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      outline: none;
      user-select: none;
    }

    .logo-img {
      height: 48px;
      width: auto;
      object-fit: contain;
    }

    .brand-text {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--primary, #002b66);
      letter-spacing: -0.5px;
    }

    .brand-accent {
      color: var(--accent, #62d600);
      -webkit-text-stroke: 0.5px var(--primary, #002b66);
    }

    /* DESPLEGABLE / MENU TRIGGER */
    .menu-wrapper {
      position: relative;
    }

    .menu-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f4f8f1;
      border: 2px solid #002b66;
      padding: 6px 14px 6px 8px;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 3px 0px #002b66;
    }

    .menu-trigger:hover, .menu-trigger.active {
      background: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 4px 0px #002b66;
    }

    .menu-trigger:active {
      transform: translateY(2px);
      box-shadow: 0 1px 0px #002b66;
    }

    .user-avatar-badge {
      width: 32px;
      height: 32px;
      background-color: #62d600;
      color: #042456;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 0.95rem;
      border: 1.5px solid #042456;
      overflow: hidden;
    }

    .avatar-logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .menu-label {
      font-weight: 800;
      color: #002b66;
      font-size: 0.95rem;
    }

    .chevron-icon {
      color: #002b66;
      transition: transform 0.25s ease;
    }

    .chevron-icon.rotate {
      transform: rotate(180deg);
    }

    /* DROPDOWN PANEL (FLYOUT FLOTANTE) */
    .dropdown-panel {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      width: 260px;
      background: #ffffff;
      border: 2px solid #002b66;
      border-radius: 20px;
      box-shadow: 0 12px 30px rgba(0, 43, 102, 0.15);
      padding: 12px;
      z-index: 1100;
    }

    /* ANIMACIÓN ENTRADA */
    .animate-pop {
      animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transform-origin: top right;
    }

    @keyframes popIn {
      0% {
        opacity: 0;
        transform: scale(0.92) translateY(-8px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .dropdown-header {
      padding: 8px 10px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .user-role-badge {
      align-self: flex-start;
      font-size: 0.72rem;
      font-weight: 800;
      background: #e2ebd8;
      color: #002b66;
      padding: 2px 8px;
      border-radius: 10px;
      text-transform: uppercase;
    }

    .user-role-badge.empresa {
      background: #fef3c7;
      color: #92400e;
    }

    .user-role-badge.admin {
      background: #dbeafe;
      color: #1e3a8a;
    }

    .plan-badge {
      align-self: flex-start;
      font-size: 0.78rem;
      font-weight: 800;
      background: #fef3c7;
      color: #92400e;
      padding: 3px 10px;
      border-radius: 10px;
      margin-top: 2px;
    }

    .plan-badge.sin-plan {
      background: #f1f5f9;
      color: #64748b;
    }

    .user-full-email {
      font-weight: 700;
      color: #002b66;
      font-size: 0.88rem;
      word-break: break-all;
    }

    .dropdown-divider {
      height: 1px;
      background-color: #e2ebd8;
      margin: 8px 0;
    }

    .dropdown-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    /* ITEMS DE MENÚ */
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 12px;
      text-decoration: none;
      color: #002b66;
      font-weight: 700;
      font-size: 0.95rem;
      transition: all 0.15s ease;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      box-sizing: border-box;
    }

    .dropdown-item:hover {
      background-color: #f4f8f1;
      color: #65a30d;
    }

    .dropdown-item.active-item {
      background-color: #e8f7d8;
      color: #002b66;
      font-weight: 800;
    }

    .dropdown-item.empresa-item {
      color: #92400e;
      background-color: #fffbe3;
    }

    .dropdown-item.empresa-item:hover {
      background-color: #fef3c7;
    }

    .dropdown-item.admin-item {
      color: #1e3a8a;
      background-color: #eff6ff;
    }

    .dropdown-item.admin-item:hover {
      background-color: #dbeafe;
    }

    .dropdown-item.logout-item {
      color: #ef4444;
    }

    .dropdown-item.logout-item:hover {
      background-color: #fef2f2;
    }

    .item-icon {
      font-size: 1.1rem;
    }

    /* BOTÓN REGISTRARSE IDENTICO A TU ESTILO */
    .btn-register-exact {
      background-color: #62d600;
      color: #042456;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 9999px;
      font-weight: 900;
      font-size: 0.95rem;
      border: 2px solid #042456;
      box-shadow: 0px 3px 0px #042456;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      cursor: pointer;
      margin-top: 4px;
    }

    .btn-register-exact:hover {
      background-color: #58c200;
      transform: translateY(-1px);
      box-shadow: 0px 4px 0px #042456;
    }

    /* RESPONSIVO */
    @media (max-width: 480px) {
      .brand-text {
        font-size: 1.15rem;
      }
      .logo-img {
        height: 40px;
      }
      .menu-label {
        display: none;
      }
      .dropdown-panel {
        width: calc(100vw - 32px);
        right: -10px;
      }
    }
  `]
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  user: User | null = null;
  userRole: string | null = null;
  empresaInfo: EmpresaInfo | null = null;
  menuAbierto = false;

  async ngOnInit() {
    await this.cargarUsuario();
    this.authService.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        this.user = session.user;
        this.userRole = await this.authService.obtenerRolUsuario(session.user.id);
        await this.cargarEmpresaInfoSiAplica();
      } else {
        this.user = null;
        this.userRole = null;
        this.empresaInfo = null;
      }
    });
  }

  async cargarUsuario() {
    this.user = await this.authService.getUser();
    if (this.user) {
      // Consultamos el rol directamente de las tablas SQL
      this.userRole = await this.authService.obtenerRolUsuario(this.user.id);
      await this.cargarEmpresaInfoSiAplica();
    } else {
      this.userRole = null;
      this.empresaInfo = null;
    }
  }

  async cargarEmpresaInfoSiAplica() {
    if (this.userRole !== 'empresa' || !this.user) {
      this.empresaInfo = null;
      return;
    }

    // empresas.id = auth.users.id, así que la empresa del usuario logueado
    // es la fila cuyo id coincide con el id del usuario autenticado.
    const { data, error } = await this.authService.getSupabaseClient()
      .from('empresas')
      .select(`
        nombre,
        logo,
        plan_id,
        plan_valido_hasta,
        plan:planes (
          nombre,
          limite_publicaciones,
          costo
        )
      `)
      .eq('id', this.user.id)
      .single();

    if (error) {
      console.error('Error al cargar información de la empresa:', error);
      this.empresaInfo = null;
    } else {
      this.empresaInfo = data as unknown as EmpresaInfo;
    }
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }

  async logout() {
    this.cerrarMenu();
    await this.authService.signOut();
    this.user = null;
    this.userRole = null;
    this.empresaInfo = null;
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.cerrarMenu();
    }
  }
}