import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f4f8f1; min-height: calc(100vh - 78px); color: #002b66;">
      
      <!-- Hero Section -->
      <main style="max-width: 950px; margin: 0 auto; padding: 60px 20px; text-align: center;">
        
        <div style="display: inline-block; background-color: #002b66; color: #64d500; padding: 8px 20px; border-radius: 25px; font-weight: 700; font-size: 0.95rem; margin-bottom: 24px; border: 1px solid #64d500;">
          ✨ ¡La plataforma que todo lo encuentra!
        </div>

        <h1 style="font-size: 3.2rem; font-weight: 900; color: #002b66; margin-bottom: 16px; line-height: 1.15;">
          ¿Y usted, <span style="background: linear-gradient(180deg, #64d500 0%, #4eb200 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; -webkit-text-stroke: 1px #002b66;">qué busca mijo?</span>
        </h1>

        <p style="font-size: 1.25rem; color: #335588; max-width: 620px; margin: 0 auto 40px auto; font-weight: 500; line-height: 1.5;">
          Encuentra exactamente lo que necesitas en un solo lugar. Rápido, seguro y con la confianza que mereces.
        </p>

        <!-- Botones de Acción -->
        @if (!currentUser) {
          <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
            <a routerLink="/register" style="background-color: #64d500; color: #002b66; padding: 16px 32px; font-size: 1.15rem; font-weight: 800; text-decoration: none; border-radius: 30px; border: 2px solid #002b66; box-shadow: 0 6px 0px #002b66; display: inline-block;">
              Crear Cuenta Gratis
            </a>
            <a routerLink="/login" style="background-color: #ffffff; color: #002b66; border: 2px solid #002b66; padding: 16px 32px; font-size: 1.15rem; font-weight: 700; text-decoration: none; border-radius: 30px; display: inline-block;">
              Ingresar
            </a>
          </div>
        } @else {
          <div style="background-color: #ffffff; padding: 24px 32px; border-radius: 20px; border: 2px solid #64d500; box-shadow: 0 8px 20px rgba(0, 43, 102, 0.06); display: inline-block;">
            <h3 style="margin: 0 0 8px 0; color: #002b66; font-size: 1.3rem;">¡Sesión Activa! 🎉</h3>
            <p style="margin: 0; color: #335588; font-weight: 600;">
              Bienvenido de nuevo: <strong>{{ currentUser.email }}</strong>
            </p>
          </div>
        }

        <!-- Secciones Informativas / Tarjetas -->
        <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-top: 70px; text-align: left;">
          <div style="background: #ffffff; padding: 30px; border-radius: 20px; border: 2px solid #e2ebd8; box-shadow: 0 6px 12px rgba(0,43,102,0.04);">
            <div style="background-color: #e8f7d8; width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin-bottom: 16px; border: 1px solid #64d500;">🔍</div>
            <h3 style="margin: 0 0 10px 0; color: #002b66; font-size: 1.25rem; font-weight: 800;">Búsquedas Inteligentes</h3>
            <p style="margin: 0; color: #5577a6; font-size: 0.95rem; line-height: 1.5;">Diseñado para ayudarte a encontrar productos y servicios en segundos.</p>
          </div>

          <div style="background: #ffffff; padding: 30px; border-radius: 20px; border: 2px solid #e2ebd8; box-shadow: 0 6px 12px rgba(0,43,102,0.04);">
            <div style="background-color: #002b66; width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin-bottom: 16px; border: 1px solid #64d500;">🛡️</div>
            <h3 style="margin: 0 0 10px 0; color: #002b66; font-size: 1.25rem; font-weight: 800;">Seguridad Garantizada</h3>
            <p style="margin: 0; color: #5577a6; font-size: 0.95rem; line-height: 1.5;">Tus credenciales y datos personales están protegidos con autenticación cifrada.</p>
          </div>

          <div style="background: #ffffff; padding: 30px; border-radius: 20px; border: 2px solid #e2ebd8; box-shadow: 0 6px 12px rgba(0,43,102,0.04);">
            <div style="background-color: #e8f7d8; width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin-bottom: 16px; border: 1px solid #64d500;">⚡</div>
            <h3 style="margin: 0 0 10px 0; color: #002b66; font-size: 1.25rem; font-weight: 800;">Experiencia Ágil</h3>
            <p style="margin: 0; color: #5577a6; font-size: 0.95rem; line-height: 1.5;">Navega de forma intuitiva desde tu computadora o teléfono móvil.</p>
          </div>
        </section>

      </main>
    </div>
  `
})
export class HomeComponent implements OnInit {
  currentUser: User | null = null;

  constructor(private authService: AuthService) {}

  async ngOnInit() {
    this.currentUser = await this.authService.getUser();
    this.authService.onAuthStateChange((_event, session) => {
      this.currentUser = session ? session.user : null;
    });
  }
}