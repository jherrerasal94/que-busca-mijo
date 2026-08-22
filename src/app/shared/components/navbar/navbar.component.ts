import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header style="font-family: 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: space-between; align-items: center; padding: 12px 40px; background: var(--bg-card); border-bottom: 3px solid var(--accent); box-shadow: 0 4px 12px rgba(0, 43, 102, 0.08); position: sticky; top: 0; z-index: 100;">
      
      <!-- Logo QBM -->
      <div routerLink="/" style="display: flex; align-items: center; gap: 14px; cursor: pointer;">
        <img src="assets/logo.png" alt="Logo QBM" style="height: 52px; width: auto; object-fit: contain;">
        <span style="font-size: 1.5rem; font-weight: 800; color: var(--primary); letter-spacing: -0.5px;">
          ¿Qué Busca <span style="color: var(--accent); -webkit-text-stroke: 0.5px var(--primary);">Mijo?</span>
        </span>
      </div>

      <!-- Menú de Navegación Dinámico -->
      <nav style="display: flex; align-items: center; gap: 16px;">
        
        <!-- Caso 1: En Login o Registro -->
        @if (isAuthPage) {
          <a routerLink="/" class="btn-secondary">
            ← Volver
          </a>
        } 
        <!-- Caso 2: Sin Sesión fuera de Login/Registro -->
        @else if (!currentUser) {
          <a routerLink="/login" class="btn-ghost">
            Iniciar Sesión
          </a>
          <a routerLink="/register" class="btn-primary">
            Registrarse
          </a>
        } 
        <!-- Caso 3: Con Sesión Activa -->
        @else {
          <div style="display: flex; align-items: center; gap: 10px; background: #e8f7d8; padding: 6px 16px; border-radius: 20px; border: 1px solid var(--accent);">
            <span style="font-size: 1.1rem;">👤</span>
            <span style="font-weight: 700; font-size: 0.95rem; color: var(--primary);">{{ currentUser.email }}</span>
          </div>
          <button (click)="onLogout()" class="btn-danger">
            Cerrar Sesión
          </button>
        }

      </nav>

    </header>
  `
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  isAuthPage = false;

  constructor(private authService: AuthService, private router: Router) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.checkIfAuthPage(event.urlAfterRedirects);
      });
  }

  async ngOnInit() {
    this.checkIfAuthPage(this.router.url);

    this.currentUser = await this.authService.getUser();
    this.authService.onAuthStateChange((_event, session) => {
      this.currentUser = session ? session.user : null;
    });
  }

  private checkIfAuthPage(url: string) {
    this.isAuthPage = url.includes('/login') || url.includes('/register');
  }

  async onLogout() {
    try {
      await this.authService.signOut();
      this.currentUser = null;
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error.message);
    }
  }
}