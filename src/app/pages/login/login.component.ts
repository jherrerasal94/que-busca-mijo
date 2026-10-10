import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="login-page">
      <section class="login-layout" aria-label="Inicio de sesión de ¿Qué Busca Mijo?">
        <div class="login-card">
          <a class="brand" routerLink="/" aria-label="¿Qué Busca Mijo? — ir al inicio">
            <span class="brand-mark" aria-hidden="true">QBM</span>
            <span class="brand-name">¿Qué Busca <span>Mijo?</span></span>
          </a>

          <header class="form-heading">
            <span class="welcome-icon" aria-hidden="true">👋</span>
            <p class="eyebrow">QUÉ BUENO TENERTE DE VUELTA</p>
            <h1>¡Bienvenido de nuevo, <span>mijo!</span></h1>
            <p class="subtitle">Ingresa a tu cuenta para seguir encontrando lo mejor de tu región.</p>
          </header>

          <form (ngSubmit)="onLogin()" novalidate>
            <div class="field">
              <label for="email">Correo electrónico</label>
              <div class="input-wrap" [class.input-error]="emailInvalid">
                <span class="field-icon" aria-hidden="true">✉</span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  [(ngModel)]="email"
                  autocomplete="email"
                  inputmode="email"
                  placeholder="tuemail@ejemplo.com"
                  required
                  [disabled]="loading"
                  [attr.aria-invalid]="emailInvalid"
                  aria-describedby="email-hint email-error"
                />
              </div>
              <p id="email-hint" class="field-hint">Usa el correo con el que te registraste.</p>
              @if (emailInvalid) {
                <p id="email-error" class="field-error" role="alert">
                  @if (!email.trim()) {
                    Escribe tu correo electrónico.
                  } @else {
                    Revisa el formato del correo electrónico.
                  }
                </p>
              }
            </div>

            <div class="field">
              <label for="password">Contraseña</label>
              <div class="input-wrap" [class.input-error]="passwordInvalid">
                <span class="field-icon" aria-hidden="true">▣</span>
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  name="password"
                  [(ngModel)]="password"
                  autocomplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  required
                  [disabled]="loading"
                  [attr.aria-invalid]="passwordInvalid"
                  aria-describedby="password-error"
                />
                <button
                  class="visibility-toggle"
                  type="button"
                  (click)="togglePasswordVisibility()"
                  [disabled]="loading"
                  [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  [attr.aria-pressed]="showPassword"
                >{{ showPassword ? 'Ocultar' : 'Mostrar' }}</button>
              </div>
              @if (passwordInvalid) {
                <p id="password-error" class="field-error" role="alert">Escribe tu contraseña.</p>
              }
            </div>

            <!-- ENLACE DE OLVIDÉ MI CONTRASEÑA -->
            <div class="forgot-password-row">
              <a routerLink="/forgot-password" class="forgot-link">¿Olvidaste tu contraseña?</a>
            </div>

            @if (errorMessage) {
              <div class="error-banner" role="alert" aria-live="polite">
                <span aria-hidden="true">!</span>
                <p>{{ errorMessage }}</p>
              </div>
            }

            <button class="submit-button" type="submit" [disabled]="loading">
              @if (loading) {
                <span class="spinner" aria-hidden="true"></span> Ingresando...
              } @else {
                Iniciar sesión <span aria-hidden="true">→</span>
              }
            </button>
          </form>

          <div class="register-prompt">
            <span>¿Eres nuevo por aquí?</span>
            <a routerLink="/register">Crea tu cuenta</a>
          </div>

          <a class="back-link" routerLink="/"><span aria-hidden="true">←</span> Volver a la página principal</a>
          <p class="privacy-note"><span aria-hidden="true">✓</span> Tu acceso está protegido.</p>
        </div>

        <aside class="brand-panel" aria-label="Encuentra negocios de tu región">
          <div class="panel-orbit orbit-one"></div>
          <div class="panel-orbit orbit-two"></div>
          <div class="illustration" aria-hidden="true">
            <div class="pin"><span></span></div>
            <div class="shop">
              <div class="awning"><i></i><i></i><i></i><i></i><i></i></div>
              <div class="shop-front">
                <div class="shop-window"></div>
                <div class="shop-door"><span></span></div>
              </div>
            </div>
            <div class="shopping-bag bag-one"><span>✓</span></div>
            <div class="shopping-bag bag-two"><span>♡</span></div>
            <div class="spark spark-one">✦</div>
            <div class="spark spark-two">✦</div>
          </div>
          <div class="panel-copy">
            <p class="panel-kicker">LO BUENO ESTÁ CERCA</p>
            <h2>Apoyemos <span>lo nuestro.</span></h2>
            <p>Descubre productos y servicios de negocios de tu región, de forma rápida y directa.</p>
          </div>
          <div class="trust-list">
            <div><span class="trust-icon">✓</span><span><strong>Negocios locales</strong><small>Encuentra opciones en tu zona</small></span></div>
            <div><span class="trust-icon">↔</span><span><strong>Trato directo</strong><small>Conecta con cada negocio</small></span></div>
            <div><span class="trust-icon">⌑</span><span><strong>Fácil y sencillo</strong><small>Encuentra lo que necesitas</small></span></div>
          </div>
        </aside>
      </section>
    </main>
  `,
  styles: [`
    :host { display: block; color: #062b66; font-family: 'Segoe UI', Roboto, Arial, sans-serif; }
    * { box-sizing: border-box; }
    .login-page {
      min-height: calc(100vh - 78px); display: flex; align-items: center; justify-content: center;
      padding: 36px 24px;
      background: radial-gradient(ellipse at 8% 12%, rgba(100,213,0,.08), transparent 28%),
                  radial-gradient(ellipse at 92% 88%, rgba(100,213,0,.07), transparent 30%), #f7faf4;
    }
    .login-layout { width: min(1120px, 100%); display: grid; grid-template-columns: minmax(360px,460px) minmax(0,1fr); align-items: center; gap: clamp(32px,6vw,82px); }
    .login-card { position: relative; z-index: 1; width: 100%; padding: 34px clamp(24px,3.5vw,42px) 28px; background: rgba(255,255,255,.97); border: 1px solid #e4ecd9; border-radius: 24px; box-shadow: 0 18px 48px rgba(6,43,102,.09); }
    .brand { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 28px; color: #062b66; text-decoration: none; }
    .brand-mark { display: grid; place-items: center; width: 43px; height: 43px; flex: 0 0 43px; border: 2px solid #062b66; border-radius: 50%; background: #eff8e6; box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 5px #64d500; font-size: .76rem; font-weight: 900; letter-spacing: -.06em; }
    .brand-name { font-size: clamp(1.15rem,2vw,1.45rem); font-weight: 900; letter-spacing: -.04em; }
    .brand-name span, .form-heading h1 span, .panel-copy h2 span { color: #64bd00; }
    .form-heading { text-align: center; margin-bottom: 28px; }
    .welcome-icon { display: grid; place-items: center; width: 48px; height: 48px; margin: 0 auto 14px; border-radius: 16px; background: #eff8e6; font-size: 1.55rem; }
    .eyebrow { margin: 0 0 8px; color: #54832a; font-size: .7rem; font-weight: 900; letter-spacing: .11em; }
    .form-heading h1 { margin: 0; color: #062b66; font-size: clamp(1.55rem,2.6vw,2rem); line-height: 1.2; font-weight: 900; letter-spacing: -.045em; }
    .subtitle { max-width: 330px; margin: 10px auto 0; color: #617493; font-size: .94rem; line-height: 1.55; }
    .field { margin-bottom: 19px; }
    .field label { display: block; margin-bottom: 8px; color: #082f6b; font-size: .9rem; font-weight: 750; }
    .input-wrap { display: flex; align-items: center; min-height: 53px; gap: 11px; padding: 0 14px; border: 1.5px solid #cbd6e4; border-radius: 13px; background: #fff; transition: border-color .18s ease, box-shadow .18s ease; }
    .input-wrap:focus-within { border-color: #64bd00; box-shadow: 0 0 0 3px rgba(100,213,0,.14); }
    .input-wrap.input-error { border-color: #c24141; }
    .field-icon { color: #0a3978; font-size: 1.1rem; line-height: 1; }
    .input-wrap input { width: 100%; min-width: 0; padding: 14px 0; border: 0; outline: 0; background: transparent; color: #082f6b; font: inherit; font-size: .94rem; }
    .input-wrap input::placeholder { color: #8a98ac; }
    .input-wrap input:disabled { opacity: .7; }
    .visibility-toggle { padding: 6px 0 6px 6px; border: 0; background: transparent; color: #0750a0; font: inherit; font-size: .76rem; font-weight: 800; cursor: pointer; white-space: nowrap; }
    .visibility-toggle:focus-visible, a:focus-visible, button:focus-visible { outline: 3px solid rgba(100,189,0,.55); outline-offset: 3px; }
    .visibility-toggle:disabled { cursor: not-allowed; opacity: .5; }
    .field-hint { margin: 6px 0 0; color: #7a8aa1; font-size: .77rem; }
    .field-error { margin: 7px 0 0; color: #b42318; font-size: .81rem; font-weight: 650; }
    
    /* ESTILOS PARA EL ENLACE DE RECUPERACIÓN */
    .forgot-password-row {
      display: flex;
      justify-content: flex-end;
      margin-top: -8px;
      margin-bottom: 6px;
    }
    .forgot-link {
      color: #315783;
      font-size: 0.82rem;
      font-weight: 650;
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .forgot-link:hover {
      color: #062b66;
      text-decoration: underline;
    }

    .submit-button { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; min-height: 52px; margin-top: 25px; padding: 13px 18px; border: 1px solid #64bd00; border-radius: 14px; background: #64d500; color: #062b66; font: inherit; font-size: 1rem; font-weight: 850; cursor: pointer; box-shadow: 0 4px 0 #0a326e; transition: transform .16s ease, box-shadow .16s ease, background .16s ease; }
    .submit-button:hover:not(:disabled) { background: #76e20d; transform: translateY(-1px); box-shadow: 0 5px 0 #0a326e; }
    .submit-button:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 1px 0 #0a326e; }
    .submit-button:disabled { cursor: wait; opacity: .75; }
    .spinner { width: 17px; height: 17px; border: 2px solid rgba(6,43,102,.25); border-top-color: #062b66; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-banner { display: flex; align-items: flex-start; gap: 10px; margin-top: 16px; padding: 12px 13px; border: 1px solid #fecaca; border-radius: 12px; background: #fff5f5; color: #991b1b; font-size: .88rem; }
    .error-banner > span { display: grid; place-items: center; width: 19px; height: 19px; flex: 0 0 19px; border-radius: 50%; background: #fee2e2; font-weight: 900; }
    .error-banner p { margin: 1px 0 0; line-height: 1.4; }
    .register-prompt { display: flex; flex-wrap: wrap; justify-content: center; gap: 5px; margin-top: 28px; color: #617493; font-size: .88rem; }
    .register-prompt a { color: #397e00; font-weight: 850; text-decoration: none; }
    .register-prompt a:hover { text-decoration: underline; }
    .back-link { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 22px; color: #315783; font-size: .84rem; font-weight: 650; text-decoration: none; }
    .back-link:hover { color: #062b66; text-decoration: underline; }
    .privacy-note { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 22px 0 0; padding-top: 16px; border-top: 1px solid #edf1e8; color: #78879b; font-size: .75rem; }
    .privacy-note span { color: #4d9c00; font-weight: 900; }
    .brand-panel { position: relative; min-width: 0; padding: 34px 8px; text-align: center; }
    .panel-orbit { position: absolute; z-index: 0; border-radius: 50%; background: rgba(100,213,0,.07); }
    .orbit-one { width: 330px; height: 330px; top: 3%; left: 17%; }
    .orbit-two { width: 190px; height: 190px; right: 3%; bottom: 23%; }
    .illustration { position: relative; z-index: 1; height: 290px; max-width: 460px; margin: 0 auto 15px; }
    .shop { position: absolute; left: 50%; bottom: 30px; width: 235px; height: 168px; transform: translateX(-50%); }
    .shop-front { position: absolute; right: 0; bottom: 0; left: 0; height: 126px; border: 5px solid #082f6b; border-radius: 8px 8px 15px 15px; background: #fff; box-shadow: 0 9px 0 rgba(6,43,102,.08); }
    .awning { position: absolute; z-index: 2; top: 0; right: -9px; left: -9px; display: flex; height: 47px; overflow: hidden; border: 5px solid #082f6b; border-radius: 12px 12px 7px 7px; background: #fff; }
    .awning i { flex: 1; background: #64d500; border-right: 4px solid #082f6b; }
    .awning i:nth-child(even) { background: #082f6b; }
    .shop-window { position: absolute; top: 48px; left: 19px; width: 76px; height: 52px; border: 4px solid #082f6b; border-radius: 5px; background: #dff3c9; }
    .shop-window:after { content: ''; position: absolute; top: 0; bottom: 0; left: 50%; border-left: 3px solid #082f6b; }
    .shop-door { position: absolute; right: 19px; bottom: 0; width: 57px; height: 80px; border: 4px solid #082f6b; border-bottom: 0; border-radius: 8px 8px 0 0; background: #eaf7df; }
    .shop-door span { position: absolute; top: 39px; right: 7px; width: 6px; height: 6px; border-radius: 50%; background: #64bd00; }
    .pin { position: absolute; z-index: 3; top: 7px; left: calc(50% - 20px); width: 40px; height: 40px; border: 5px solid #082f6b; border-radius: 50% 50% 50% 0; background: #64d500; transform: rotate(-45deg); }
    .pin span { position: absolute; inset: 8px; border: 3px solid #082f6b; border-radius: 50%; background: #fff; }
    .shopping-bag { position: absolute; z-index: 4; bottom: 26px; display: grid; place-items: center; width: 68px; height: 74px; border: 4px solid #082f6b; border-radius: 8px 8px 12px 12px; background: #64d500; color: #082f6b; font-size: 2rem; font-weight: 900; box-shadow: 0 7px 0 rgba(6,43,102,.08); }
    .shopping-bag:before { content: ''; position: absolute; top: -16px; width: 27px; height: 21px; border: 4px solid #082f6b; border-bottom: 0; border-radius: 15px 15px 0 0; }
    .bag-one { left: calc(50% - 160px); transform: rotate(-8deg); }
    .bag-two { right: calc(50% - 170px); bottom: 18px; background: #fff; transform: rotate(7deg); }
    .spark { position: absolute; color: #64bd00; font-size: 2rem; }
    .spark-one { top: 60px; left: 15%; }
    .spark-two { top: 115px; right: 12%; font-size: 1.5rem; }
    .panel-copy { position: relative; z-index: 1; max-width: 430px; margin: 0 auto 25px; }
    .panel-kicker { margin: 0 0 8px; color: #4d8d0a; font-size: .72rem; font-weight: 900; letter-spacing: .14em; }
    .panel-copy h2 { margin: 0; color: #062b66; font-size: clamp(1.8rem,3vw,2.5rem); font-weight: 900; letter-spacing: -.05em; }
    .panel-copy > p:last-child { max-width: 380px; margin: 12px auto 0; color: #617493; font-size: .98rem; line-height: 1.65; }
    .trust-list { position: relative; z-index: 1; display: grid; gap: 13px; max-width: 360px; margin: 0 auto; text-align: left; }
    .trust-list > div { display: flex; align-items: center; gap: 12px; }
    .trust-icon { display: grid; place-items: center; width: 38px; height: 38px; flex: 0 0 38px; border: 1.5px solid #b9df8c; border-radius: 12px; background: #fff; color: #4d9c00; font-size: 1.25rem; font-weight: 900; }
    .trust-list strong, .trust-list small { display: block; }
    .trust-list strong { color: #082f6b; font-size: .86rem; }
    .trust-list small { margin-top: 3px; color: #75859a; font-size: .78rem; }
    @media (max-width: 899px) {
      .login-page { padding: 28px 18px; }
      .login-layout { max-width: 480px; grid-template-columns: minmax(0,1fr); gap: 0; }
      .brand-panel { display: none; }
      .login-card { padding: 30px clamp(22px,6vw,38px) 25px; }
    }
    @media (max-width: 380px) {
      .login-page { padding: 16px 10px; }
      .login-card { padding: 24px 18px 22px; border-radius: 18px; }
      .brand { margin-bottom: 24px; }
      .brand-mark { width: 38px; height: 38px; flex-basis: 38px; }
      .brand-name { font-size: 1.12rem; }
      .register-prompt { font-size: .82rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';
  showPassword = false;
  submitted = false;

  constructor(private authService: AuthService, private router: Router) {}

  get emailInvalid(): boolean {
    return this.submitted &&
      (!this.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim()));
  }

  get passwordInvalid(): boolean {
    return this.submitted && !this.password;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async onLogin(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';

    if (this.emailInvalid || this.passwordInvalid || this.loading) return;

    this.loading = true;
    try {
      await this.authService.signIn(this.email.trim(), this.password);
      await this.router.navigate(['/']);
    } catch {
      this.errorMessage = 'No pudimos iniciar sesión. Revisa tu correo y contraseña e inténtalo de nuevo.';
    } finally {
      this.loading = false;
    }
  }
}