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
        <div class="footer-col brand-col">
          <h3 class="brand-title">¿Qué Busca Mijo?</h3>
          <p class="brand-desc">
            La plataforma ideal para conectar empresas locales con usuarios de manera directa, transparente y ágil.
          </p>
          <div class="footer-social-row">
            <a href="https://www.instagram.com/quebuscamijo/" target="_blank" rel="noopener noreferrer" class="social-icon-btn" title="Instagram">
              <img src="assets/instagram_35x35.png" alt="Instagram" />
            </a>
            <a href="https://www.facebook.com/people/Quebuscamijocom/61594959613912/" target="_blank" rel="noopener noreferrer" class="social-icon-btn" title="Facebook">
              <img src="assets/facebook_35x35.png" alt="Facebook" />
            </a>
            <a href="https://x.com/quebuscamijo" target="_blank" rel="noopener noreferrer" class="social-icon-btn" title="X (Twitter)">
              <img src="assets/x_35x35.png" alt="X" />
            </a>
            <a href="https://www.tiktok.com/@quebuscamijo" target="_blank" rel="noopener noreferrer" class="social-icon-btn" title="TikTok">
              <img src="assets/tiktok_35x35.png" alt="TikTok" />
            </a>
          </div>
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
            <span class="contact-icon">📧</span> soporte&#64;quebuscamijo.com<br>
            <span class="contact-icon">📱</span> +57 300 000 0000<br>
            <span class="contact-icon">📍</span> Villeta, Cundinamarca, Colombia
          </p>
        </div>

        <!-- Columna 4: Comunidad -->
        <div class="footer-col">
          <h4 class="col-title">Comunidad</h4>
          <p class="community-desc">
            Apoyamos el comercio local y los emprendimientos de la región. ¡Haz parte de nuestro directorio!
          </p>
          <a routerLink="/register" class="footer-cta-btn">Publica tu negocio</a>
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
      padding: 50px 20px 24px 20px;
      border-top: 4px solid #64d500;
      margin-top: auto;
      font-family: 'Segoe UI', Roboto, sans-serif;
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 32px;
      text-align: left;
    }

    .footer-col {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      color: #64d500;
      font-size: 1.4rem;
      font-weight: 900;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
    }

    .brand-desc {
      color: #b0c4de;
      font-size: 0.9rem;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }

    /* FILA DE REDES SOCIALES EN FOOTER */
    .footer-social-row {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .social-icon-btn {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s ease;
      overflow: hidden;
      text-decoration: none;
    }

    .social-icon-btn img {
      width: 22px;
      height: 22px;
      object-fit: contain;
      display: block;
      transition: transform 0.25s ease;
    }

    .social-icon-btn:hover {
      background: #64d500;
      border-color: #64d500;
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(100, 213, 0, 0.25);
    }

    .social-icon-btn:hover img {
      transform: scale(1.1);
    }

    .col-title {
      color: #ffffff;
      font-size: 1.05rem;
      font-weight: 800;
      margin: 0 0 16px 0;
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
      line-height: 2.2;
    }

    .footer-links a {
      color: #b0c4de;
      text-decoration: none;
      transition: color 0.2s ease, padding-left 0.2s ease;
      display: inline-block;
    }

    .footer-links a:hover {
      color: #64d500;
      padding-left: 4px;
    }

    .contact-info {
      color: #b0c4de;
      font-size: 0.9rem;
      line-height: 1.9;
      margin: 0;
    }

    .community-desc {
      color: #b0c4de;
      font-size: 0.9rem;
      line-height: 1.5;
      margin: 0 0 16px 0;
    }

    .footer-cta-btn {
      display: inline-block;
      background: #64d500;
      color: #002b66;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.88rem;
      transition: transform 0.2s, opacity 0.2s;
      box-shadow: 0 4px 12px rgba(100, 213, 0, 0.2);
      align-self: flex-start;
    }

    .footer-cta-btn:hover {
      transform: translateY(-2px);
      opacity: 0.95;
    }

    .copyright {
      max-width: 1200px;
      margin: 40px auto 0 auto;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      font-size: 0.85rem;
      color: #88a0c0;
    }

    @media (max-width: 768px) {
      .footer {
        padding: 40px 16px 20px 16px;
      }
      .footer-container {
        gap: 24px;
      }
      .footer-social-row {
        justify-content: flex-start;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}