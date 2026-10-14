import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LocationService, Pais, Departamento, Ciudad } from '../../core/services/location.service';

interface Plan {
  id: string;
  nombre: string;
  costo: number;
}

// Validador personalizado para confirmar contraseñas
export const matchPasswords: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  if (confirmPassword.value && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ ...(confirmPassword.errors || {}), passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    // Si coinciden, limpiamos el error específico de coincidencia si existía
    const errors = confirmPassword.errors;
    if (errors) {
      delete errors['passwordMismatch'];
      if (!Object.keys(errors).length) {
        confirmPassword.setErrors(null);
      }
    }
  }
  return null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="brand-mark" aria-hidden="true"><span>Q</span><span class="brand-dot">•</span><span>B</span><span class="brand-dot">•</span><span>M</span></div>
        <p class="eyebrow">QUÉ BUSCA MIJO</p>
        <h2>¡Hagamos parte de la comunidad!</h2>
        <p class="subtitle">Crea tu cuenta para descubrir y conectar con lo local.</p>

        <!-- Selector de Rol -->
        <div class="role-selector" role="group" aria-label="Selecciona tu tipo de perfil">
          <button type="button" class="role-card"
            [class.active]="selectedRole === 'transeunte'"
            [attr.aria-pressed]="selectedRole === 'transeunte'"
            (click)="selectRole('transeunte')">
            <span class="role-icon" aria-hidden="true">⌕</span>
            <span class="role-copy"><strong>Quiero explorar</strong><small>Transeúnte</small></span>
            <span class="role-check" aria-hidden="true">✓</span>
          </button>
          <button type="button" class="role-card"
            [class.active]="selectedRole === 'empresa'"
            [attr.aria-pressed]="selectedRole === 'empresa'"
            (click)="selectRole('empresa')">
            <span class="role-icon" aria-hidden="true">▦</span>
            <span class="role-copy"><strong>Quiero crecer</strong><small>Empresa o negocio</small></span>
            <span class="role-check" aria-hidden="true">✓</span>
          </button>
        </div>

        @if (successMessage) {
          <div class="success-banner">
            <span>🎉 {{ successMessage }}</span>
            <button class="btn-primary" style="margin-top: 12px; width: 100%;" routerLink="/login">
              Ir al Inicio de Sesión
            </button>
          </div>
        } @else {
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            
            <!-- Credenciales Básicas -->
            <div class="section-heading"><span class="step-number">1</span><div><h3>Datos de acceso</h3><p>Usarás estos datos para ingresar a tu cuenta.</p></div></div>
            <div class="form-group">
              <label for="register-email">Correo electrónico <span>*</span></label>
              <input id="register-email" type="email" formControlName="email" placeholder="correo@ejemplo.com" autocomplete="email" />
              @if (isFieldInvalid('email')) {
                <span class="field-error">Ingresa un correo válido.</span>
              }
            </div>

            <div class="form-group">
              <label for="register-password">Contraseña <span>*</span></label>
              <div class="password-wrap">
                <input id="register-password" [type]="showPassword ? 'text' : 'password'" formControlName="password" placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
                <button type="button" class="password-toggle" (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">{{ showPassword ? 'Ocultar' : 'Mostrar' }}</button>
              </div>
              @if (isFieldInvalid('password')) {
                <span class="field-error">Mínimo 6 caracteres requeridos.</span>
              }
            </div>

            <!-- Repetir Contraseña -->
            <div class="form-group">
              <label for="register-confirm-password">Confirmar contraseña <span>*</span></label>
              <div class="password-wrap">
                <input id="register-confirm-password" [type]="showConfirmPassword ? 'text' : 'password'" formControlName="confirmPassword" placeholder="Repite tu contraseña" autocomplete="new-password" />
                <button type="button" class="password-toggle" (click)="showConfirmPassword = !showConfirmPassword" [attr.aria-label]="showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">{{ showConfirmPassword ? 'Ocultar' : 'Mostrar' }}</button>
              </div>
              @if (isFieldInvalid('confirmPassword')) {
                <span class="field-error">
                  @if (registerForm.get('confirmPassword')?.hasError('required')) {
                    Debes confirmar tu contraseña.
                  } @else {
                    Las contraseñas no coinciden.
                  }
                </span>
              }
            </div>

            <hr class="divider" />

            <!-- FORMULARIO TRANSEÚNTE -->
            @if (selectedRole === 'transeunte') {
              <div class="section-heading"><span class="step-number">2</span><div><h3>Cuéntanos sobre ti</h3><p>Completa tus datos para personalizar tu experiencia.</p></div></div>
              <div class="form-row">
                <div class="form-group">
                  <label>Nombres <span>*</span></label>
                  <input type="text" formControlName="nombres" placeholder="Juan" />
                  @if (isFieldInvalid('nombres')) { <span class="field-error">Obligatorio.</span> }
                </div>
                <div class="form-group">
                  <label>Apellidos *</label>
                  <input type="text" formControlName="apellidos" placeholder="Pérez" />
                  @if (isFieldInvalid('apellidos')) { <span class="field-error">Obligatorio.</span> }
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Teléfono *</label>
                  <input type="tel" formControlName="telefono" placeholder="3001234567" />
                  @if (isFieldInvalid('telefono')) { <span class="field-error">Obligatorio.</span> }
                </div>
                <div class="form-group">
                  <label>Usuario *</label>
                  <input type="text" formControlName="username" placeholder="juanperez" />
                  @if (isFieldInvalid('username')) { <span class="field-error">Obligatorio.</span> }
                </div>
              </div>

              <div class="form-group">
                <label>Fecha de Nacimiento *</label>
                <input type="date" formControlName="fecha_nacimiento" />
                @if (isFieldInvalid('fecha_nacimiento')) { <span class="field-error">Obligatorio.</span> }
              </div>

              <!-- BLOQUE 1: Lugar de Nacimiento -->
              <div class="section-heading compact"><span class="section-icon">⌖</span><div><h3>Lugar de nacimiento</h3><p>Estos datos de ubicación son opcionales.</p></div></div>
              <div class="form-row trio">
                <div class="form-group">
                  <label>País</label>
                  <select formControlName="pais_nacimiento_id">
                    <option value="">Seleccione...</option>
                    @for (pais of paises; track pais.id) {
                      <option [value]="pais.id">{{ pais.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Departamento</label>
                  <select formControlName="depto_nacimiento_id">
                    <option value="">
                      {{ loadingDeptosNac ? 'Cargando...' : 'Seleccione...' }}
                    </option>
                    @for (depto of deptosNacimiento; track depto.id) {
                      <option [value]="depto.id">{{ depto.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Ciudad</label>
                  <select formControlName="ciudad_nacimiento_id">
                    <option value="">
                      {{ loadingCiudadesNac ? 'Cargando...' : 'Seleccione...' }}
                    </option>
                    @for (ciudad of ciudadesNacimiento; track ciudad.id) {
                      <option [value]="ciudad.id">{{ ciudad.nombre }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- BLOQUE 2: Lugar de Residencia -->
              <div class="section-heading compact"><span class="section-icon">⌂</span><div><h3>Lugar de residencia</h3><p>Ayúdanos a mostrarte opciones cercanas.</p></div></div>
              <div class="form-row trio">
                <div class="form-group">
                  <label>País</label>
                  <select formControlName="pais_residencia_id">
                    <option value="">Seleccione...</option>
                    @for (pais of paises; track pais.id) {
                      <option [value]="pais.id">{{ pais.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Departamento</label>
                  <select formControlName="depto_residencia_id">
                    <option value="">
                      {{ loadingDeptosRes ? 'Cargando...' : 'Seleccione...' }}
                    </option>
                    @for (depto of deptosResidencia; track depto.id) {
                      <option [value]="depto.id">{{ depto.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Ciudad</label>
                  <select formControlName="ciudad_residencia_id">
                    <option value="">
                      {{ loadingCiudadesRes ? 'Cargando...' : 'Seleccione...' }}
                    </option>
                    @for (ciudad of ciudadesResidencia; track ciudad.id) {
                      <option [value]="ciudad.id">{{ ciudad.nombre }}</option>
                    }
                  </select>
                </div>
              </div>
            }

            <!-- FORMULARIO EMPRESA -->
            @if (selectedRole === 'empresa') {
              <div class="section-heading"><span class="step-number">2</span><div><h3>Tu negocio</h3><p>Selecciona un plan y cuéntanos sobre tu empresa.</p></div></div>
              <div class="form-group">
                <label>Plan de empresa <span>*</span></label>
                <select formControlName="plan_solicitado_id">
                  <option value="">Selecciona un plan obligatoriamente</option>
                  @for (plan of listaPlanes; track plan.id) {
                    <option [value]="plan.id">{{ plan.nombre }} - $ {{ plan.costo | number:'1.0-2' }}</option>
                  }
                </select>
                @if (isFieldInvalid('plan_solicitado_id')) { <span class="field-error">Debe seleccionar un plan.</span> }
              </div>

              <div class="form-group">
                <label>Nombre de la Empresa *</label>
                <input type="text" formControlName="nombre" placeholder="Mi Empresa S.A.S." />
                @if (isFieldInvalid('nombre')) { <span class="field-error">Obligatorio.</span> }
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>NIT *</label>
                  <input type="text" formControlName="nit" placeholder="900123456-1" />
                  @if (isFieldInvalid('nit')) { <span class="field-error">Obligatorio.</span> }
                </div>
                <div class="form-group">
                  <label>Alias / Marca</label>
                  <input type="text" formControlName="alias" placeholder="Nombre Comercial" />
                </div>
              </div>

              <div class="form-group">
                <label>Fecha de Fundación</label>
                <input type="date" formControlName="fecha_fundacion" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Rep. Nombres *</label>
                  <input type="text" formControlName="rep_nombres" placeholder="Carlos" />
                  @if (isFieldInvalid('rep_nombres')) { <span class="field-error">Obligatorio.</span> }
                </div>
                <div class="form-group">
                  <label>Rep. Apellidos *</label>
                  <input type="text" formControlName="rep_apellidos" placeholder="Gómez" />
                  @if (isFieldInvalid('rep_apellidos')) { <span class="field-error">Obligatorio.</span> }
                </div>
              </div>

              <div class="form-group">
                <label>Teléfono de Contacto *</label>
                <input type="tel" formControlName="rep_telefono" placeholder="3109876543" />
                @if (isFieldInvalid('rep_telefono')) { <span class="field-error">Obligatorio.</span> }
              </div>

              <div class="form-group">
                <label>Dirección</label>
                <input type="text" formControlName="direccion" placeholder="Calle 123 # 45-67" />
              </div>

              <!-- BLOQUE 3: Ubicación Empresa -->
              <div class="section-heading compact"><span class="section-icon">⌖</span><div><h3>Ubicación comercial</h3><p>Indica dónde pueden encontrarte tus clientes.</p></div></div>
              <div class="form-row trio">
                <div class="form-group">
                  <label>País</label>
                  <select formControlName="pais_empresa_id">
                    <option value="">Seleccione...</option>
                    @for (pais of paises; track pais.id) {
                      <option [value]="pais.id">{{ pais.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Departamento</label>
                  <select formControlName="depto_empresa_id">
                    <option value="">
                      {{ loadingDeptosEmp ? 'Cargando...' : 'Seleccione...' }}
                    </option>
                    @for (depto of deptosEmpresa; track depto.id) {
                      <option [value]="depto.id">{{ depto.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Ciudad</label>
                  <select formControlName="ciudad_id">
                    <option value="">
                      {{ loadingCiudadesEmp ? 'Cargando...' : 'Seleccione...' }}
                    </option>
                    @for (ciudad of ciudadesEmpresa; track ciudad.id) {
                      <option [value]="ciudad.id">{{ ciudad.nombre }}</option>
                    }
                  </select>
                </div>
              </div>
            }

            @if (errorMessage) {
              <div class="error-banner">⚠️ {{ errorMessage }}</div>
            }

            <button 
              type="submit" 
              class="btn-primary full-width" 
              [disabled]="loading">
              @if (loading) {
                <span class="spinner"></span> Registrando...
              } @else {
                Registrarse
              }
            </button>
          </form>
        }

        <p class="auth-footer">
          ¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión aquí</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; color: #15243a; }
    .auth-container { display: flex; justify-content: center; align-items: flex-start; padding: clamp(22px, 5vw, 64px) 18px; background: radial-gradient(ellipse at top left, rgba(100,213,0,.10), transparent 38%), #f5f8fc; min-height: calc(100vh - 120px); }
    .auth-card { background: #fff; border-radius: 24px; padding: clamp(22px, 4vw, 42px); width: 100%; max-width: 780px; box-shadow: 0 18px 55px rgba(6,43,102,.10); border: 1px solid #e5ebf3; }
    .brand-mark { display: flex; align-items: center; justify-content: center; gap: 2px; color: #062b66; font-weight: 950; font-size: 1.25rem; letter-spacing: -.08em; margin-bottom: 8px; }
    .brand-dot { color: #64d500; padding: 0 2px; }
    .eyebrow { text-align: center; color: #47700e; font-size: .68rem; letter-spacing: .16em; font-weight: 850; margin: 0 0 8px; }
    h2 { color: #062b66; margin: 0; font-size: clamp(1.55rem, 4vw, 2rem); line-height: 1.2; text-align: center; letter-spacing: -.035em; }
    .subtitle { color: #64748b; font-size: .96rem; line-height: 1.5; margin: 10px auto 26px; text-align: center; max-width: 460px; }
    .role-selector { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 28px; }
    .role-card { position: relative; display: flex; align-items: center; gap: 12px; min-height: 86px; padding: 16px; border-radius: 16px; border: 1.5px solid #dbe3ee; background: #fff; color: #062b66; text-align: left; cursor: pointer; transition: border-color .18s, background .18s, box-shadow .18s; }
    .role-card:hover { border-color: #93c94a; }
    .role-card.active { border-color: #062b66; background: #f5faed; box-shadow: 0 0 0 3px rgba(100,213,0,.20); }
    .role-icon { width: 42px; height: 42px; flex: 0 0 42px; display: grid; place-items: center; border-radius: 12px; background: #eef4fc; color: #062b66; font-size: 1.6rem; font-weight: 800; }
    .role-card.active .role-icon { background: #64d500; }
    .role-copy { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .role-copy strong { font-size: .91rem; }
    .role-copy small { font-size: .79rem; color: #64748b; }
    .role-check { margin-left: auto; color: #fff; background: #062b66; border-radius: 50%; width: 20px; height: 20px; display: grid; place-items: center; font-size: .72rem; opacity: 0; flex: 0 0 20px; }
    .role-card.active .role-check { opacity: 1; }
    .section-heading { display: flex; align-items: flex-start; gap: 12px; margin: 26px 0 18px; padding-bottom: 14px; border-bottom: 1px solid #e8edf4; }
    .section-heading:first-of-type { margin-top: 0; }
    .step-number { display: grid; place-items: center; flex: 0 0 30px; width: 30px; height: 30px; border-radius: 10px; background: #062b66; color: #fff; font-weight: 800; font-size: .84rem; }
    .section-heading h3 { margin: 0 0 4px; color: #062b66; font-size: 1rem; font-weight: 850; }
    .section-heading p { margin: 0; color: #718096; font-size: .81rem; line-height: 1.4; }
    .section-heading.compact { margin-top: 22px; margin-bottom: 14px; padding-bottom: 10px; }
    .section-icon { display: grid; place-items: center; flex: 0 0 30px; width: 30px; height: 30px; border-radius: 10px; background: #eef8e5; color: #315f00; font-size: 1.15rem; }
    .divider { border: 0; height: 1px; background: #e8edf4; margin: 24px 0; }
    .form-group { display: flex; flex-direction: column; gap: 7px; margin-bottom: 16px; flex: 1; min-width: 0; }
    .form-row { display: flex; gap: 14px; }
    .form-row .form-group { flex: 1; }
    .form-row.trio { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    label { font-size: .83rem; font-weight: 750; color: #233d61; }
    label span { color: #c2410c; }
    input, select { box-sizing: border-box; width: 100%; min-height: 46px; padding: 11px 13px; border-radius: 11px; border: 1px solid #d6dfeb; font: inherit; font-size: .9rem; color: #172b45; background: #fff; transition: border-color .16s, box-shadow .16s; }
    input::placeholder { color: #9aa8b9; }
    input:focus, select:focus { outline: none; border-color: #3265a9; box-shadow: 0 0 0 3px rgba(6,43,102,.10); }
    select:disabled { background-color: #f3f6fa; color: #8a97a8; cursor: not-allowed; }
    .password-wrap { display: flex; position: relative; }
    .password-wrap input { padding-right: 88px; }
    .password-toggle { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); border: 0; background: transparent; color: #174b8d; font-size: .78rem; font-weight: 800; cursor: pointer; padding: 7px; }
    .field-error { color: #b42318; font-size: .77rem; font-weight: 650; }
    .full-width { width: 100%; min-height: 50px; margin-top: 12px; display: inline-flex; justify-content: center; align-items: center; gap: 9px; border: 0; border-radius: 12px; background: #062b66; color: #fff; font-size: .98rem; font-weight: 850; cursor: pointer; transition: transform .16s, background .16s, box-shadow .16s; }
    .full-width:hover:not(:disabled) { background: #0a397f; box-shadow: 0 8px 18px rgba(6,43,102,.18); transform: translateY(-1px); }
    .full-width:disabled { opacity: .68; cursor: wait; }
    .error-banner { background: #fff1f0; color: #a52820; border: 1px solid #ffd2ce; padding: 13px 14px; border-radius: 11px; font-size: .88rem; font-weight: 650; line-height: 1.45; margin-bottom: 16px; }
    .success-banner { background: #f0fae8; color: #245500; border: 1px solid #cfe9b8; padding: 20px; border-radius: 14px; font-size: .95rem; font-weight: 650; line-height: 1.5; text-align: center; }
    .auth-footer { margin: 24px 0 0; padding-top: 18px; border-top: 1px solid #edf1f6; text-align: center; font-size: .9rem; color: #64748b; }
    .auth-footer a { color: #062b66; font-weight: 850; text-decoration: none; }
    .auth-footer a:hover { text-decoration: underline; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.7); border-bottom-color: transparent; border-radius: 50%; display: inline-block; animation: rotation 1s linear infinite; }
    @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @media (max-width: 640px) {
      .auth-container { padding: 18px 10px 28px; }
      .auth-card { border-radius: 18px; padding: 22px 16px; }
      .role-selector { gap: 8px; }
      .role-card { padding: 12px 10px; gap: 8px; min-height: 80px; }
      .role-icon { width: 34px; height: 34px; flex-basis: 34px; font-size: 1.25rem; }
      .role-copy strong { font-size: .81rem; }
      .role-copy small { font-size: .72rem; }
      .role-check { width: 17px; height: 17px; flex-basis: 17px; font-size: .65rem; }
      .form-row { display: block; }
      .form-row.trio { grid-template-columns: 1fr; gap: 0; }
      .form-group { margin-bottom: 14px; }
      .section-heading { margin-top: 22px; }
    }
  `]
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private locationService = inject(LocationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  selectedRole: 'transeunte' | 'empresa' = 'transeunte';
  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  listaPlanes: Plan[] = [];
  paises: Pais[] = [];

  deptosNacimiento: Departamento[] = [];
  ciudadesNacimiento: Ciudad[] = [];
  deptosResidencia: Departamento[] = [];
  ciudadesResidencia: Ciudad[] = [];
  deptosEmpresa: Departamento[] = [];
  ciudadesEmpresa: Ciudad[] = [];

  loadingDeptosNac = false;
  loadingCiudadesNac = false;
  loadingDeptosRes = false;
  loadingCiudadesRes = false;
  loadingDeptosEmp = false;
  loadingCiudadesEmp = false;

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    
    nombres: [''],
    apellidos: [''],
    telefono: [''],
    username: [''],
    fecha_nacimiento: [''],
    
    pais_nacimiento_id: [''],
    depto_nacimiento_id: [{ value: '', disabled: true }],
    ciudad_nacimiento_id: [{ value: '', disabled: true }],

    pais_residencia_id: [''],
    depto_residencia_id: [{ value: '', disabled: true }],
    ciudad_residencia_id: [{ value: '', disabled: true }],
    
    plan_solicitado_id: [''],
    nombre: [''],
    alias: [''],
    nit: [''],
    fecha_fundacion: [''],
    rep_nombres: [''],
    rep_apellidos: [''],
    rep_telefono: [''],
    direccion: [''],
    
    pais_empresa_id: [''],
    depto_empresa_id: [{ value: '', disabled: true }],
    ciudad_id: [{ value: '', disabled: true }]
  }, { validators: matchPasswords });

  async ngOnInit() {
    this.updateValidations();
    this.paises = await this.locationService.getPaises();
    await this.cargarPlanes();

    this.route.queryParams.subscribe(async params => {
      const planId = params['planSeleccionado'];
      if (planId) {
        this.selectedRole = 'empresa';
        this.updateValidations();
        this.registerForm.patchValue({ plan_solicitado_id: planId });
      }
    });

    this.setupLocationCascade(
      'pais_nacimiento_id', 'depto_nacimiento_id', 'ciudad_nacimiento_id',
      (deptos) => (this.deptosNacimiento = deptos), (ciudades) => (this.ciudadesNacimiento = ciudades),
      (loading) => (this.loadingDeptosNac = loading), (loading) => (this.loadingCiudadesNac = loading)
    );

    this.setupLocationCascade(
      'pais_residencia_id', 'depto_residencia_id', 'ciudad_residencia_id',
      (deptos) => (this.deptosResidencia = deptos), (ciudades) => (this.ciudadesResidencia = ciudades),
      (loading) => (this.loadingDeptosRes = loading), (loading) => (this.loadingCiudadesRes = loading)
    );

    this.setupLocationCascade(
      'pais_empresa_id', 'depto_empresa_id', 'ciudad_id',
      (deptos) => (this.deptosEmpresa = deptos), (ciudades) => (this.ciudadesEmpresa = ciudades),
      (loading) => (this.loadingDeptosEmp = loading), (loading) => (this.loadingCiudadesEmp = loading)
    );
  }

  async cargarPlanes() {
    try {
      const supabase = this.authService.getSupabaseClient();
      const { data, error } = await supabase.from('planes').select('id, nombre, costo').order('costo', { ascending: true });
      if (!error && data) {
        this.listaPlanes = data;
      }
    } catch (err) {
      console.error('Error al cargar planes en registro:', err);
    }
  }

  private setupLocationCascade(
    countryControlName: string, stateControlName: string, cityControlName: string,
    setStateList: (data: Departamento[]) => void, setCityList: (data: Ciudad[]) => void,
    setLoadingState: (loading: boolean) => void, setLoadingCity: (loading: boolean) => void
  ) {
    const countryCtrl = this.registerForm.get(countryControlName);
    const stateCtrl = this.registerForm.get(stateControlName);
    const cityCtrl = this.registerForm.get(cityControlName);

    countryCtrl?.valueChanges.subscribe(async (paisId) => {
      setStateList([]); setCityList([]);
      stateCtrl?.setValue('', { emitEvent: false });
      cityCtrl?.setValue('', { emitEvent: false });
      stateCtrl?.disable(); cityCtrl?.disable();

      if (paisId) {
        setLoadingState(true);
        const deptos = await this.locationService.getDepartamentosByPais(paisId);
        setStateList(deptos);
        setLoadingState(false);
        if (deptos.length > 0) stateCtrl?.enable();
      }
    });

    stateCtrl?.valueChanges.subscribe(async (deptoId) => {
      setCityList([]);
      cityCtrl?.setValue('', { emitEvent: false });
      cityCtrl?.disable();

      if (deptoId) {
        setLoadingCity(true);
        const ciudades = await this.locationService.getCiudadesByDepartamento(deptoId);
        setCityList(ciudades);
        setLoadingCity(false);
        if (ciudades.length > 0) cityCtrl?.enable();
      }
    });
  }

  selectRole(role: 'transeunte' | 'empresa') {
    this.selectedRole = role;
    this.updateValidations();
  }

  private updateValidations() {
    const transeunteRequired = ['nombres', 'apellidos', 'telefono', 'username', 'fecha_nacimiento'];
    const empresaRequired = ['nombre', 'nit', 'rep_nombres', 'rep_apellidos', 'rep_telefono', 'plan_solicitado_id'];

    if (this.selectedRole === 'transeunte') {
      transeunteRequired.forEach(f => this.registerForm.get(f)?.setValidators([Validators.required]));
      empresaRequired.forEach(f => this.registerForm.get(f)?.clearValidators());
    } else {
      empresaRequired.forEach(f => this.registerForm.get(f)?.setValidators([Validators.required]));
      transeunteRequired.forEach(f => this.registerForm.get(f)?.clearValidators());
    }

    [...transeunteRequired, ...empresaRequired].forEach(f => {
      this.registerForm.get(f)?.updateValueAndValidity();
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  async onSubmit() {
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos requeridos (*) o verifica que las contraseñas coincidan.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const { email, username, nit, plan_solicitado_id } = this.registerForm.value;

    try {
      // 1. Validar si el usuario/correo/NIT ya existe en la BD
      const exists = await this.checkUserExists(email!, username, nit);
      if (exists) {
        this.loading = false;
        return;
      }

      // 2. Si es empresa, verificamos si ya existe una solicitud previa activa en base al NIT ingresado
      if (this.selectedRole === 'empresa' && nit) {
        const supabase = this.authService.getSupabaseClient();
        const { data: empresaExistente } = await supabase
          .from('empresas')
          .select('id')
          .eq('nit', nit)
          .maybeSingle();

        if (empresaExistente) {
          const { data: solicitudPrevia } = await supabase
            .from('solicitudes_plan')
            .select('estado_solicitud')
            .eq('empresa_id', empresaExistente.id)
            .in('estado_solicitud', ['pendiente', 'aprobado'])
            .maybeSingle();

          if (solicitudPrevia) {
            this.errorMessage = `Ya existe una solicitud ${solicitudPrevia.estado_solicitud} para este NIT. No puedes crear múltiples solicitudes simultáneas.`;
            this.loading = false;
            return;
          }
        }
      }

      const v = this.registerForm.value;
      const metaData = {
        role: this.selectedRole,
        ...(this.selectedRole === 'transeunte' ? {
          nombres: v.nombres,
          apellidos: v.apellidos,
          telefono: v.telefono,
          username: v.username,
          fecha_nacimiento: v.fecha_nacimiento,
          ciudad_nacimiento_id: v.ciudad_nacimiento_id || null,
          ciudad_residencia_id: v.ciudad_residencia_id || null
        } : {
          nombre: v.nombre,
          alias: v.alias,
          nit: v.nit,
          fecha_fundacion: v.fecha_fundacion,
          rep_nombres: v.rep_nombres,
          rep_apellidos: v.rep_apellidos,
          rep_telefono: v.rep_telefono,
          direccion: v.direccion,
          ciudad_id: v.ciudad_id || null,
          correo_empresarial: v.email
        })
      };

      const response = await this.authService.signUp(v.email!, v.password!, metaData);

      if (response.error) {
        this.errorMessage = response.error.message;
      } else {
        // Registrar la solicitud del plan si es empresa
        if (this.selectedRole === 'empresa' && plan_solicitado_id) {
          const supabase = this.authService.getSupabaseClient();
          const empresaId = response.data.user?.id;

          if (empresaId) {
            await supabase.from('solicitudes_plan').insert({
              empresa_id: empresaId,
              plan_solicitado_id: plan_solicitado_id,
              estado_solicitud: 'pendiente',
              fecha_solicitud: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }

        if (response.data.session) {
          this.router.navigate(['/']);
        } else if (response.data.user) {
          this.successMessage = '¡Registro completado! Revisa tu correo o inicia sesión.';
        }
      }
    } catch (err: any) {
      this.errorMessage = 'Ocurrió un error inesperado al procesar el registro.';
    } finally {
      this.loading = false;
    }
  }

  private async checkUserExists(email: string, username?: string | null, nit?: string | null): Promise<boolean> {
    const supabase = this.authService.getSupabaseClient();

    const { data: tEmail } = await supabase.from('transeuntes').select('id').eq('correo', email).maybeSingle();
    if (tEmail) {
      this.errorMessage = 'El correo ya está registrado como Transeúnte.';
      return true;
    }

    const { data: eEmail } = await supabase.from('empresas').select('id').eq('correo_registro', email).maybeSingle();
    if (eEmail) {
      this.errorMessage = 'El correo ya está registrado como Empresa.';
      return true;
    }

    if (this.selectedRole === 'transeunte' && username) {
      const { data: tUser } = await supabase.from('transeuntes').select('id').eq('username', username).maybeSingle();
      if (tUser) {
        this.errorMessage = 'El nombre de usuario ya está en uso.';
        return true;
      }
    }

    if (this.selectedRole === 'empresa' && nit) {
      const { data: eNit } = await supabase.from('empresas').select('id').eq('nit', nit).maybeSingle();
      if (eNit) {
        this.errorMessage = 'El NIT ingresado ya existe.';
        return true;
      }
    }

    return false;
  }
}