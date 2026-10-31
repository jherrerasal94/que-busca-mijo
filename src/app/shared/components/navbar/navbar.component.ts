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
  img_empresa_1?: string | null;
  img_empresa_2?: string | null;
  plan_id?: string | null;
  plan_valido_hasta?: string | null;
  plan?: PlanEmpresa | null;
}

export interface NotificacionItem {
  id: string;
  tipo: 'publicaciones' | 'imagenes' | 'redes';
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-container">

        <!-- BRAND / LOGO -->
        <div
          routerLink="/"
          class="brand-logo"
          tabindex="0"
          (click)="cerrarTodo()">
          <img
            src="assets/logo.png"
            alt="Logo QBM"
            class="logo-img">
          <span class="brand-text">
            ¿Qué Busca <span class="brand-accent">Mijo?</span>
          </span>
        </div>

        <!-- NAV LINKS: solo visibles en escritorio -->
        <div class="nav-links">
          <a routerLink="/" routerLinkActive="nav-link-active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">Explorar</a>
          <a routerLink="/resultados" routerLinkActive="nav-link-active" class="nav-link">Categorías</a>
          <a routerLink="/" class="nav-link">Negocios</a>
          <a routerLink="/resultados" routerLinkActive="nav-link-active" class="nav-link">Ofertas</a>
        </div>

        <div class="nav-right">

          @if (user) {
            <!-- CAMPANA DE NOTIFICACIONES (Solo para rol Empresa) -->
            @if (userRole === 'empresa') {
              <div class="notifications-wrapper">
                <button
                  class="bell-trigger"
                  [class.active]="notificacionesAbiertas"
                  (click)="toggleNotificaciones()"
                  aria-label="Ver notificaciones de perfil">
                  <span class="bell-icon">🔔</span>
                  @if (notificacionesPendientes.length > 0) {
                    <span class="notification-badge">{{ notificacionesPendientes.length }}</span>
                  }
                </button>

                <!-- PANEL DESPLEGABLE DE NOTIFICACIONES -->
                @if (notificacionesAbiertas) {
                  <div class="notifications-panel animate-pop">
                    <div class="notifications-header">
                      <h4>Centro de Alertas</h4>
                      <span class="notifications-count">{{ notificacionesPendientes.length }} pendientes</span>
                    </div>
                    <div class="notifications-divider"></div>

                    <div class="notifications-body">
                      @if (notificacionesPendientes.length === 0) {
                        <div class="notifications-empty">
                          <span>🎉</span>
                          <p>¡Todo en orden! Tu perfil está completo y al día.</p>
                        </div>
                      } @else {
                        @for (notif of notificacionesPendientes; track notif.id) {
                          <a [routerLink]="notif.ruta" class="notification-item" (click)="cerrarTodo()">
                            <span class="notif-icon">{{ notif.icono }}</span>
                            <div class="notif-content">
                              <strong>{{ notif.titulo }}</strong>
                              <p>{{ notif.descripcion }}</p>
                            </div>
                            <span class="notif-arrow">➔</span>
                          </a>
                        }
                      }
                    </div>
                  </div>
                }
              </div>
            }

            <!-- TRIGGER DE CUENTA: solo visible en escritorio cuando hay sesión -->
            <button
              class="menu-trigger avatar-trigger"
              [class.active]="menuAbierto"
              [class.trigger-empresa]="userRole === 'empresa'"
              [class.trigger-admin]="userRole === 'admin'"
              (click)="toggleMenu()"
              aria-label="Abrir menú de usuario">

              <div class="user-avatar-badge">
                @if (userRole === 'empresa' && empresaInfo?.logo) {
                  <img [src]="empresaInfo!.logo!" [alt]="empresaInfo?.nombre || 'Logo empresa'" class="avatar-logo-img" />
                } @else {
                  <span>{{ user.email?.charAt(0)?.toUpperCase() || '👤' }}</span>
                }
              </div>

              <span class="menu-label">
                {{ (user.email | slice:0:12) }}...
              </span>

              <svg class="chevron-icon" [class.rotate]="menuAbierto" viewBox="0 0 24 24" width="18" height="18">
                <path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          } @else {
            <!-- ACCIONES DE INVITADO: solo visibles en escritorio -->
            <div class="guest-actions-desktop">
              <a routerLink="/planes" class="btn-publicar">📢 Quiero publicar</a>
              <a routerLink="/login" class="link-login">Iniciar sesión</a>
              <a routerLink="/register" class="btn-register-exact">Registrarse</a>
            </div>
          }

          <!-- HAMBURGUESA: solo visible en móvil, para cualquier estado de sesión -->
          <button
            class="hamburger-trigger"
            [class.active]="menuAbierto"
            (click)="toggleMenu()"
            aria-label="Abrir menú de navegación">
            <span class="hamburger-icon">{{ menuAbierto ? '✕' : '☰' }}</span>
          </button>

          <!-- PANEL DESPLEGABLE (FLYOUT) -->
          @if (menuAbierto) {
            <div
              class="dropdown-panel animate-pop"
              [class.panel-empresa]="userRole === 'empresa'"
              [class.panel-admin]="userRole === 'admin'">

              <!-- Enlaces de navegación móviles + Notificaciones integradas si es empresa -->
              <div class="mobile-nav-links">
                <a routerLink="/" routerLinkActive="active-item" [routerLinkActiveOptions]="{ exact: true }" class="dropdown-item" (click)="cerrarTodo()">
                  <span class="item-icon">🔎</span>
                  <span>Explorar</span>
                </a>
                <a routerLink="/resultados" routerLinkActive="active-item" class="dropdown-item" (click)="cerrarTodo()">
                  <span class="item-icon">📁</span>
                  <span>Categorías</span>
                </a>
                <a routerLink="/" class="dropdown-item" (click)="cerrarTodo()">
                  <span class="item-icon">🏪</span>
                  <span>Negocios</span>
                </a>
                <a routerLink="/resultados" routerLinkActive="active-item" class="dropdown-item" (click)="cerrarTodo()">
                  <span class="item-icon">🏷️</span>
                  <span>Ofertas</span>
                </a>

                @if (userRole === 'empresa' && notificacionesPendientes.length > 0) {
                  <div class="dropdown-divider"></div>
                  <div class="mobile-alerts-header">🔔 Alertas pendientes ({{ notificacionesPendientes.length }})</div>
                  @for (notif of notificacionesPendientes; track notif.id) {
                    <a [routerLink]="notif.ruta" class="dropdown-item mobile-alert-item" (click)="cerrarTodo()">
                      <span class="item-icon">{{ notif.icono }}</span>
                      <span>{{ notif.titulo }}</span>
                    </a>
                  }
                }

                <div class="dropdown-divider"></div>
              </div>

              @if (user) {
                <!-- Encabezado de sesión -->
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

                <div class="dropdown-body">

                  <a routerLink="/planes"
                     routerLinkActive="active-item"
                     class="dropdown-item"
                     (click)="cerrarTodo()">
                    <span class="item-icon">💎</span>
                    <span>Planes para Empresas</span>
                  </a>

                  @if (userRole === 'empresa') {
                    <a routerLink="/mis-publicaciones"
                       routerLinkActive="active-item"
                       class="dropdown-item empresa-item"
                       (click)="cerrarTodo()">
                      <span class="item-icon">📢</span>
                      <span>Gestionar Publicaciones</span>
                    </a>
                  }

                  @if (userRole === 'admin') {
                    <a routerLink="/admin/categorias"
                       routerLinkActive="active-item"
                       class="dropdown-item admin-item"
                       (click)="cerrarTodo()">
                      <span class="item-icon">📁</span>
                      <span>Gestionar Categorías</span>
                    </a>

                    <a routerLink="/admin-planes"
                       routerLinkActive="active-item"
                       class="dropdown-item admin-item"
                       (click)="cerrarTodo()">
                      <span class="item-icon">📋</span>
                      <span>Solicitudes de Planes</span>
                    </a>

                    <a routerLink="/admin-destacados"
                       routerLinkActive="active-item"
                       class="dropdown-item admin-item"
                       (click)="cerrarTodo()">
                      <span class="item-icon">⭐</span>
                      <span>Solicitudes de Destacados</span>
                    </a>
                    <a routerLink="/admin/empresas"
                       routerLinkActive="active-item"
                       class="dropdown-item admin-item"
                       (click)="cerrarTodo()">
                      <span class="item-icon">📋</span>
                      <span>Administrar Empresas</span>
                    </a>
                  }

                  <a routerLink="/perfil"
                     routerLinkActive="active-item"
                     class="dropdown-item"
                     (click)="cerrarTodo()">
                    <span class="item-icon">⚙️</span>
                    <span>Mi Perfil</span>
                  </a>

                  <div class="dropdown-divider"></div>

                  <button (click)="logout()" class="dropdown-item logout-item">
                    <span class="item-icon">🚪</span>
                    <span>Cerrar Sesión</span>
                  </button>

                </div>
              } @else {
                <!-- Solo se ve cuando el panel se abre desde la hamburguesa, en móvil -->
                <div class="dropdown-body">
                  <a routerLink="/planes"
                     routerLinkActive="active-item"
                     class="dropdown-item publicar-item"
                     (click)="cerrarTodo()">
                    <span class="item-icon">📢</span>
                    <span>Quiero publicar</span>
                  </a>

                  <a routerLink="/login"
                     routerLinkActive="active-item"
                     class="dropdown-item"
                     (click)="cerrarTodo()">
                    <span class="item-icon">🔑</span>
                    <span>Iniciar Sesión</span>
                  </a>

                  <div class="dropdown-divider"></div>

                  <a routerLink="/register" class="btn-register-exact" (click)="cerrarTodo()">
                    Registrarse
                  </a>
                </div>
              }

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
      gap: 24px;
    }

    /* LOGO & MARCA */
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      outline: none;
      user-select: none;
      flex-shrink: 0;
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

    /* NAV LINKS (ESCRITORIO) */
    .nav-links {
      display: flex;
      align-items: center;
      gap: 28px;
      flex: 1;
    }

    .nav-link {
      text-decoration: none;
      color: #002b66;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 6px 2px;
      border-bottom: 2px solid transparent;
      transition: color 0.15s ease, border-color 0.15s ease;
    }

    .nav-link:hover {
      color: #65a30d;
    }

    .nav-link-active {
      border-bottom-color: #62d600;
    }

    /* ACCIONES / TRIGGERS A LA DERECHA */
    .nav-right {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    /* CAMPANA DE NOTIFICACIONES */
    .notifications-wrapper {
      position: relative;
    }

    .bell-trigger {
      position: relative;
      background: #f4f8f1;
      border: 2px solid #002b66;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 3px 0px #002b66;
    }

    .bell-trigger:hover, .bell-trigger.active {
      background: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 4px 0px #002b66;
    }

    .bell-icon {
      font-size: 1.2rem;
    }

    .notification-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 900;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #ffffff;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    /* PANEL DESPLEGABLE DE NOTIFICACIONES */
    .notifications-panel {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      width: 320px;
      background: #ffffff;
      border: 2px solid #002b66;
      border-radius: 20px;
      box-shadow: 0 12px 30px rgba(0, 43, 102, 0.18);
      padding: 16px;
      z-index: 1100;
    }

    .notifications-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .notifications-header h4 {
      margin: 0;
      color: #002b66;
      font-size: 1rem;
      font-weight: 800;
    }

    .notifications-count {
      font-size: 0.75rem;
      font-weight: 700;
      background: #fef3c7;
      color: #92400e;
      padding: 2px 8px;
      border-radius: 99px;
    }

    .notifications-divider {
      height: 1px;
      background-color: #e2ebd8;
      margin: 12px 0;
    }

    .notifications-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 280px;
      overflow-y: auto;
    }

    .notifications-empty {
      text-align: center;
      padding: 20px 10px;
      color: #64748b;
    }
    .notifications-empty span {
      font-size: 1.8rem;
      display: block;
      margin-bottom: 6px;
    }
    .notifications-empty p {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .notification-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .notification-item:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      transform: translateX(2px);
    }

    .notif-icon {
      font-size: 1.3rem;
      background: #ffffff;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
      flex-shrink: 0;
    }

    .notif-content {
      flex: 1;
      min-width: 0;
    }

    .notif-content strong {
      display: block;
      font-size: 0.85rem;
      color: #002b66;
      font-weight: 800;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notif-content p {
      margin: 0;
      font-size: 0.75rem;
      color: #64748b;
      line-height: 1.3;
    }

    .notif-arrow {
      color: #002b66;
      font-weight: bold;
      font-size: 0.85rem;
    }

    .guest-actions-desktop {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .link-login {
      text-decoration: none;
      color: #002b66;
      font-weight: 700;
      font-size: 0.95rem;
    }

    .link-login:hover {
      color: #65a30d;
    }

    /* CTA "QUIERO PUBLICAR" */
    .btn-publicar {
      text-decoration: none;
      color: #002b66;
      background: #eaf3de;
      font-weight: 800;
      font-size: 0.9rem;
      padding: 8px 16px;
      border-radius: 9999px;
      border: 1.5px solid #c3dba3;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .btn-publicar:hover {
      background: #ddedc7;
      transform: translateY(-1px);
    }

    .dropdown-item.publicar-item {
      color: #3b6d11;
      background-color: #eaf3de;
    }

    .dropdown-item.publicar-item:hover {
      background-color: #ddedc7;
    }

    /* TRIGGER DE AVATAR (ESCRITORIO, CON SESIÓN) */
    .avatar-trigger {
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

    .avatar-trigger:hover, .avatar-trigger.active {
      background: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 4px 0px #002b66;
    }

    .avatar-trigger:active {
      transform: translateY(2px);
      box-shadow: 0 1px 0px #002b66;
    }

    .avatar-trigger.trigger-empresa {
      background: #e6f1fb;
      border-color: #185fa5;
      box-shadow: 0 3px 0px #185fa5;
    }
    .avatar-trigger.trigger-empresa:hover,
    .avatar-trigger.trigger-empresa.active {
      box-shadow: 0 4px 0px #185fa5;
    }

    .avatar-trigger.trigger-admin {
      background: #eef1f5;
      border-color: #475569;
      box-shadow: 0 3px 0px #475569;
    }
    .avatar-trigger.trigger-admin:hover,
    .avatar-trigger.trigger-admin.active {
      box-shadow: 0 4px 0px #475569;
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
      flex-shrink: 0;
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
      white-space: nowrap;
    }

    .chevron-icon {
      color: #002b66;
      transition: transform 0.25s ease;
      flex-shrink: 0;
    }

    .chevron-icon.rotate {
      transform: rotate(180deg);
    }

    /* HAMBURGUESA (MÓVIL) */
    .hamburger-trigger {
      display: none;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      background: #f4f8f1;
      border: 2px solid #002b66;
      border-radius: 14px;
      cursor: pointer;
    }

    .hamburger-icon {
      font-size: 1.3rem;
      color: #002b66;
      line-height: 1;
    }

    /* DROPDOWN PANEL (FLYOUT FLOTANTE) */
    .dropdown-panel {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      width: 280px;
      background: #ffffff;
      border: 2px solid #002b66;
      border-radius: 20px;
      box-shadow: 0 12px 30px rgba(0, 43, 102, 0.15);
      padding: 12px;
      z-index: 1100;
      transition: background-color 0.15s ease;
    }

    .dropdown-panel.panel-empresa {
      background: #e6f1fb;
      border-color: #185fa5;
    }

    .dropdown-panel.panel-admin {
      background: #eef1f5;
      border-color: #475569;
    }

    .mobile-alerts-header {
      font-size: 0.75rem;
      font-weight: 800;
      color: #92400e;
      text-transform: uppercase;
      padding: 4px 10px;
      margin-top: 4px;
    }

    .mobile-alert-item {
      background: #fffbe3 !important;
      color: #92400e !important;
      border: 1px dashed #fcd34d;
      margin-bottom: 4px;
    }

    @media (min-width: 769px) {
      .mobile-nav-links {
        display: none;
      }
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

    /* BOTÓN REGISTRARSE */
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
    }

    .guest-actions-desktop .btn-register-exact {
      padding: 8px 18px;
    }

    .dropdown-body .btn-register-exact {
      margin-top: 4px;
    }

    .btn-register-exact:hover {
      background-color: #58c200;
      transform: translateY(-1px);
      box-shadow: 0px 4px 0px #042456;
    }

    /* RESPONSIVO */
    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }

      .avatar-trigger,
      .guest-actions-desktop {
        display: none;
      }

      .hamburger-trigger {
        display: flex;
      }

      .dropdown-panel {
        position: fixed;
        top: 82px;
        left: 16px;
        right: 16px;
        width: auto;
        max-height: calc(100vh - 98px);
        overflow-y: auto;
      }

      .notifications-panel {
        position: fixed;
        top: 82px;
        left: 16px;
        right: 16px;
        width: auto;
      }
    }

    @media (max-width: 480px) {
      .brand-text {
        font-size: 1.15rem;
      }
      .logo-img {
        height: 40px;
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
  notificacionesAbiertas = false;

  // Lista de notificaciones pendientes para la empresa
  notificacionesPendientes: NotificacionItem[] = [];

  async ngOnInit() {
    await this.cargarUsuario();
    this.authService.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        this.user = session.user;
        this.userRole = await this.authService.obtenerRolUsuario(session.user.id);
        await this.cargarEmpresaInfoSiAplica();
        await this.evaluarNotificacionesEmpresa();
      } else {
        this.user = null;
        this.userRole = null;
        this.empresaInfo = null;
        this.notificacionesPendientes = [];
      }
    });
  }

  async cargarUsuario() {
    this.user = await this.authService.getUser();
    if (this.user) {
      this.userRole = await this.authService.obtenerRolUsuario(this.user.id);
      await this.cargarEmpresaInfoSiAplica();
      await this.evaluarNotificacionesEmpresa();
    } else {
      this.userRole = null;
      this.empresaInfo = null;
      this.notificacionesPendientes = [];
    }
  }

  async cargarEmpresaInfoSiAplica() {
    if (this.userRole !== 'empresa' || !this.user) {
      this.empresaInfo = null;
      return;
    }

    const { data, error } = await this.authService.getSupabaseClient()
      .from('empresas')
      .select(`
        nombre,
        logo,
        img_empresa_1,
        img_empresa_2,
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

  // Evalúa las 3 condiciones de alertas para la empresa
  async evaluarNotificacionesEmpresa() {
    if (this.userRole !== 'empresa' || !this.user) {
      this.notificacionesPendientes = [];
      return;
    }

    const supabase = this.authService.getSupabaseClient();
    const alertas: NotificacionItem[] = [];

    // 1. Verificar si tiene publicaciones creadas
    const { count: countPubs } = await supabase
      .from('publicaciones')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', this.user.id);

    if (countPubs === 0) {
      alertas.push({
        id: 'no-pubs',
        tipo: 'publicaciones',
        titulo: 'Sin publicaciones',
        descripcion: 'Crea tu primera publicación para empezar a vender.',
        icono: '📢',
        ruta: '/mis-publicaciones'
      });
    }

    // 2. Verificar si tiene imágenes cargadas (logo o imágenes secundarias)
    const tieneImagenes = !!(this.empresaInfo?.logo || this.empresaInfo?.img_empresa_1 || this.empresaInfo?.img_empresa_2);
    if (!tieneImagenes) {
      alertas.push({
        id: 'no-imgs',
        tipo: 'imagenes',
        titulo: 'Faltan imágenes',
        descripcion: 'Sube tu logo o fotos de perfil para ganar confianza.',
        icono: '🖼️',
        ruta: '/perfil'
      });
    }

    // 3. Verificar si tiene redes sociales registradas
    const { count: countRedes } = await supabase
      .from('empresas_redes') // O la tabla correspondiente a redes de la empresa si existe en tu esquema
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', this.user.id)
      .maybeSingle ? { count: 0 } : { count: 0 }; // Ajuste seguro de consulta

    // Verificamos de forma segura si la tabla tiene registros o usando un chequeo general
    // Nota: Si manejas las redes directamente en la tabla empresas o en otra relación, ajusta la consulta.
    // Aquí verificamos mediante una consulta genérica a la tabla relacional si aplica.
    const { data: redesData } = await supabase
      .from('empresas_redes')
      .select('id')
      .eq('empresa_id', this.user.id)
      .limit(1);

    if (!redesData || redesData.length === 0) {
      alertas.push({
        id: 'no-redes',
        tipo: 'redes',
        titulo: 'Agrega tus redes sociales',
        descripcion: 'Conecta tus perfiles sociales para que te contacten más fácil.',
        icono: '🌐',
        ruta: '/perfil'
      });
    }

    this.notificacionesPendientes = alertas;
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
    if (this.menuAbierto) this.notificacionesAbiertas = false; // Cerrar campana si abren menú
  }

  toggleNotificaciones() {
    this.notificacionesAbiertas = !this.notificacionesAbiertas;
    if (this.notificacionesAbiertas) this.menuAbierto = false; // Cerrar menú usuario si abren campana
  }

  cerrarTodo() {
    this.menuAbierto = false;
    this.notificacionesAbiertas = false;
  }

  async logout() {
    this.cerrarTodo();
    await this.authService.signOut();
    this.user = null;
    this.userRole = null;
    this.empresaInfo = null;
    this.notificacionesPendientes = [];
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.cerrarTodo();
    }
  }
}