import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f4f8f1; min-height: calc(100vh - 78px); display: flex; align-items: center; justify-content: center; padding: 40px 20px;">
      
      <div style="background: #ffffff; width: 100%; max-width: 420px; padding: 36px 32px; border-radius: 24px; border: 2px solid #e2ebd8; box-shadow: 0 10px 25px rgba(0, 43, 102, 0.08);">
        
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="background-color: #e8f7d8; width: 60px; height: 60px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 16px auto; border: 1.5px solid #64d500;">
            🔑
          </div>
          <h2 style="margin: 0; color: #002b66; font-weight: 800; font-size: 1.8rem;">¡Bienvenido de nuevo!</h2>
          <p style="margin: 6px 0 0 0; color: #5577a6; font-size: 0.95rem;">Ingresa tus datos para continuar</p>
        </div>

        <form (ngSubmit)="onLogin()">
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 700; color: #002b66; margin-bottom: 8px; font-size: 0.95rem;">Correo Electrónico</label>
            <input 
              type="email" 
              [(ngModel)]="email" 
              name="email" 
              placeholder="tuemail@ejemplo.com"
              required 
              style="width: 100%; padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 12px; font-size: 1rem; box-sizing: border-box; outline: none;"
              onfocus="this.style.borderColor='#64d500'"
              onblur="this.style.borderColor='#cbd5e1'">
          </div>

          <div style="margin-bottom: 24px;">
            <label style="display: block; font-weight: 700; color: #002b66; margin-bottom: 8px; font-size: 0.95rem;">Contraseña</label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              name="password" 
              placeholder="••••••••"
              required 
              style="width: 100%; padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 12px; font-size: 1rem; box-sizing: border-box; outline: none;"
              onfocus="this.style.borderColor='#64d500'"
              onblur="this.style.borderColor='#cbd5e1'">
          </div>

          <button 
            type="submit" 
            [disabled]="loading" 
            style="width: 100%; padding: 14px; background-color: #64d500; color: #002b66; font-weight: 800; font-size: 1.1rem; border: 2px solid #002b66; border-radius: 25px; box-shadow: 0 4px 0px #002b66; cursor: pointer;">
            {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
          </button>
        </form>

        @if (errorMessage) {
          <div style="background-color: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 12px; border-radius: 12px; margin-top: 20px; font-size: 0.9rem; text-align: center; font-weight: 600;">
            ⚠️ {{ errorMessage }}
          </div>
        }

        <p style="margin-top: 24px; text-align: center; color: #5577a6; font-weight: 600; font-size: 0.95rem;">
          ¿No tienes cuenta mijo? 
          <a routerLink="/register" style="color: #002b66; font-weight: 800; text-decoration: underline;">Regístrate aquí</a>
        </p>

        <div style="text-align: center; margin-top: 16px; border-top: 1px dashed #e2ebd8; padding-top: 16px;">
          <a routerLink="/" style="color: #5577a6; font-weight: 600; text-decoration: none; font-size: 0.9rem;">
            🏠 Regresar a la página principal
          </a>
        </div>

      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  async onLogin() {
    this.loading = true;
    this.errorMessage = '';
    try {
      await this.authService.signIn(this.email, this.password);
      this.router.navigate(['/']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Credenciales inválidas';
    } finally {
      this.loading = false;
    }
  }
}