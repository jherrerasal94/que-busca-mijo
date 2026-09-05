import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-container">
        
        <!-- Columna 1: Info Marca -->
        <div class="footer-col">
          <h3 class="brand-title">¿Qué Busca Mijo?</h3>
          <p class="brand-desc">
            La plataforma ideal para conectar empresas locales con usuarios de manera directa, transparente y ágil.
          </p>
        </div>

        <!-- Columna 2: Enlaces Rápidos -->
        <div class="footer-col">
          <h4 class="col-title">Enlaces Rápidos</h4>
          <ul class="footer-links">
            <li><a routerLink="/">Inicio</a></li>
            <li><a routerLink="/login">Iniciar Sesión</a></li>
            <li><a routerLink="/register">Registrarse</a></li>
          </ul>
        </div>

        <!-- Columna 3: Contacto / Soporte -->
        <div class="footer-col">
          <h4 class="col-title">Soporte</h4>
          <p class="contact-info">
            📧 soporte&#64;quebuscamijo.com<br>
            📱 +57 300 000 0000<br>
            📍 Colombia
          </p>
        </div>

      </div>

      <!-- Derechos de Autor -->
      <div class="copyright">
        © {{ currentYear }} ¿Qué Busca Mijo? Todos los derechos reservados.
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #002b66;
      color: #ffffff;
      padding: 40px 20px 20px 20px;
      border-top: 4px solid #64d500;
      margin-top: auto;
      font-family: 'Segoe UI', Roboto, sans-serif;
    }

    .footer-container {
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 30px;
      text-align: left;
    }

    .footer-col {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      color: #64d500;
      font-size: 1.3rem;
      font-weight: 900;
      margin: 0 0 12px 0;
    }

    .brand-desc {
      color: #b0c4de;
      font-size: 0.9rem;
      line-height: 1.5;
      margin: 0;
    }

    .col-title {
      color: #ffffff;
      font-size: 1rem;
      font-weight: 800;
      margin: 0 0 12px 0;
      border-bottom: 2px solid #64d500;
      display: inline-block;
      padding-bottom: 4px;
      align-self: flex-start;
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
      font-size: 0.9rem;
      line-height: 2;
    }

    .footer-links a {
      color: #b0c4de;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .footer-links a:hover {
      color: #64d500;
    }

    .contact-info {
      color: #b0c4de;
      font-size: 0.9rem;
      line-height: 1.8;
      margin: 0;
    }

    .copyright {
      max-width: 1100px;
      margin: 30px auto 0 auto;
      padding-top: 20px;
      border-top: 1px solid #1a417a;
      text-align: center;
      font-size: 0.85rem;
      color: #88a0c0;
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}