import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Crear Cuenta en QBM</h2>
        <p class="subtitle">Selecciona tu tipo de perfil e ingresa tus datos</p>

        <!-- Selector de Rol -->
        <div class="role-selector">
          <button 
            type="button" 
            [class.active]="selectedRole === 'transeunte'"
            (click)="selectRole('transeunte')">
            👤 Transeúnte
          </button>
          <button 
            type="button" 
            [class.active]="selectedRole === 'empresa'"
            (click)="selectRole('empresa')">
            🏢 Empresa
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
            
            <!-- Campos Comunes: Autenticación -->
            <div class="form-group">
              <label>Correo Electrónico *</label>
              <input type="email" formControlName="email" placeholder="correo@ejemplo.com" />
              @if (isFieldInvalid('email')) {
                <span class="field-error">Ingresa un correo electrónico válido.</span>
              }
            </div>

            <div class="form-group">
              <label>Contraseña *</label>
              <input type="password" formControlName="password" placeholder="Mínimo 6 caracteres" />
              @if (isFieldInvalid('password')) {
                <span class="field-error">La contraseña debe tener al menos 6 caracteres.</span>
              }
            </div>

            <!-- Campos Dinámicos: TRANSEÚNTE -->
            @if (selectedRole === 'transeunte') {
              <div class="form-row">
                <div class="form-group">
                  <label>Nombres *</label>
                  <input type="text" formControlName="nombres" placeholder="Ej. Juan" />
                  @if (isFieldInvalid('nombres')) {
                    <span class="field-error">El nombre es obligatorio.</span>
                  }
                </div>
                <div class="form-group">
                  <label>Apellidos *</label>
                  <input type="text" formControlName="apellidos" placeholder="Ej. Pérez" />
                  @if (isFieldInvalid('apellidos')) {
                    <span class="field-error">El apellido es obligatorio.</span>
                  }
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Teléfono *</label>
                  <input type="tel" formControlName="telefono" placeholder="3001234567" />
                  @if (isFieldInvalid('telefono')) {
                    <span class="field-error">El teléfono es obligatorio.</span>
                  }
                </div>
                <div class="form-group">
                  <label>Nombre de usuario *</label>
                  <input type="text" formControlName="username" placeholder="juanperez" />
                  @if (isFieldInvalid('username')) {
                    <span class="field-error">El usuario es obligatorio.</span>
                  }
                </div>
              </div>
            }

            <!-- Campos Dinámicos: EMPRESA -->
            @if (selectedRole === 'empresa') {
              <div class="form-group">
                <label>Nombre de la Empresa *</label>
                <input type="text" formControlName="nombre" placeholder="Mi Empresa S.A.S." />
                @if (isFieldInvalid('nombre')) {
                  <span class="field-error">El nombre de la empresa es obligatorio.</span>
                }
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>NIT *</label>
                  <input type="text" formControlName="nit" placeholder="900123456-1" />
                  @if (isFieldInvalid('nit')) {
                    <span class="field-error">El NIT es obligatorio.</span>
                  }
                </div>
                <div class="form-group">
                  <label>Alias / Marca</label>
                  <input type="text" formControlName="alias" placeholder="Nombre Comercial" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Representante (Nombres) *</label>
                  <input type="text" formControlName="rep_nombres" placeholder="Carlos" />
                  @if (isFieldInvalid('rep_nombres')) {
                    <span class="field-error">Obligatorio.</span>
                  }
                </div>
                <div class="form-group">
                  <label>Representante (Apellidos) *</label>
                  <input type="text" formControlName="rep_apellidos" placeholder="Gómez" />
                  @if (isFieldInvalid('rep_apellidos')) {
                    <span class="field-error">Obligatorio.</span>
                  }
                </div>
              </div>

              <div class="form-group">
                <label>Teléfono de Contacto *</label>
                <input type="tel" formControlName="rep_telefono" placeholder="3109876543" />
                @if (isFieldInvalid('rep_telefono')) {
                  <span class="field-error">El teléfono es obligatorio.</span>
                }
              </div>
            }

            @if (errorMessage) {
              <div class="error-banner">
                ⚠️ {{ errorMessage }}
              </div>
            }

            <button 
              type="submit" 
              class="btn-primary full-width" 
              [disabled]="loading">
              @if (loading) {
                <span class="spinner"></span> Validando y registrando...
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
    .auth-container { display: flex; justify-content: center; padding: 40px 20px; }
    .auth-card { background: var(--bg-card); border-radius: 16px; padding: 32px; width: 100%; max-width: 500px; box-shadow: 0 8px 24px rgba(0,43,102,0.08); border: 1px solid var(--border-light); }
    h2 { color: var(--primary); margin: 0 0 6px 0; font-size: 1.6rem; }
    .subtitle { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px; }
    .role-selector { display: flex; gap: 12px; margin-bottom: 24px; }
    .role-selector button { flex: 1; padding: 10px; border-radius: 20px; border: 2px solid var(--border-input); background: transparent; font-weight: 700; color: var(--primary); cursor: pointer; transition: all 0.2s; }
    .role-selector button.active { background: var(--accent); border-color: var(--primary); box-shadow: 0 3px 0 var(--primary); }
    .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
    .form-row { display: flex; gap: 12px; }
    .form-row .form-group { flex: 1; }
    label { font-size: 0.85rem; font-weight: 700; color: var(--primary); }
    input { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-input); font-size: 0.95rem; }
    input:focus { outline: none; border-color: var(--primary); }
    .field-error { color: #dc2626; font-size: 0.78rem; font-weight: 600; margin-top: 2px; }
    .full-width { width: 100%; margin-top: 12px; display: inline-flex; justify-content: center; align-items: center; gap: 8px; }
    .error-banner { background: #fee2e2; color: #b91c1c; padding: 12px; border-radius: 10px; font-size: 0.9rem; font-weight: 600; margin-bottom: 16px; border: 1px solid #fca5a5; }
    .success-banner { background: #ecfdf5; color: #047857; padding: 16px; border-radius: 10px; font-size: 0.95rem; font-weight: 600; text-align: center; border: 1px solid #a7f3d0; }
    .auth-footer { margin-top: 20px; text-align: center; font-size: 0.9rem; color: var(--text-muted); }
    .auth-footer a { color: var(--primary); font-weight: 700; text-decoration: none; }
    
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid var(--primary);
      border-bottom-color: transparent;
      border-radius: 50%;
      display: inline-block;
      animation: rotation 1s linear infinite;
    }
    @keyframes rotation {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  selectedRole: 'transeunte' | 'empresa' = 'transeunte';
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nombres: [''],
    apellidos: [''],
    telefono: [''],
    username: [''],
    nombre: [''],
    alias: [''],
    nit: [''],
    rep_nombres: [''],
    rep_apellidos: [''],
    rep_telefono: ['']
  });

  ngOnInit() {
    this.updateValidations();
  }

  selectRole(role: 'transeunte' | 'empresa') {
    this.selectedRole = role;
    this.updateValidations();
  }

  /* Actualiza dinámicamente las validaciones según el rol sin bloquear el formulario */
  private updateValidations() {
    const transeunteFields = ['nombres', 'apellidos', 'telefono', 'username'];
    const empresaFields = ['nombre', 'nit', 'rep_nombres', 'rep_apellidos', 'rep_telefono'];

    if (this.selectedRole === 'transeunte') {
      transeunteFields.forEach(f => this.registerForm.get(f)?.setValidators([Validators.required]));
      empresaFields.forEach(f => {
        const control = this.registerForm.get(f);
        control?.clearValidators();
        control?.setValue('');
      });
    } else {
      empresaFields.forEach(f => this.registerForm.get(f)?.setValidators([Validators.required]));
      transeunteFields.forEach(f => {
        const control = this.registerForm.get(f);
        control?.clearValidators();
        control?.setValue('');
      });
    }

    [...transeunteFields, ...empresaFields].forEach(f => {
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
      this.errorMessage = 'Por favor completa todos los campos requeridos correctamente.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const { email, username, nit } = this.registerForm.value;

    try {
      // 1. Validar preventivamente si el usuario ya existe en la base de datos
      const exists = await this.checkUserExists(email!, username, nit);
      if (exists) {
        this.loading = false;
        return;
      }

      // 2. Preparar metadatos para Supabase Trigger
      const formValues = this.registerForm.value;
      const metaData = {
        role: this.selectedRole,
        ...(this.selectedRole === 'transeunte' ? {
          nombres: formValues.nombres,
          apellidos: formValues.apellidos,
          telefono: formValues.telefono,
          username: formValues.username
        } : {
          nombre: formValues.nombre,
          alias: formValues.alias,
          nit: formValues.nit,
          rep_nombres: formValues.rep_nombres,
          rep_apellidos: formValues.rep_apellidos,
          rep_telefono: formValues.rep_telefono,
          correo_empresarial: formValues.email
        })
      };

      // 3. Registrar en Auth
      const response = await this.authService.signUp(
        formValues.email!,
        formValues.password!,
        metaData
      );

      if (response.error) {
        if (response.error.message.includes('already registered') || response.error.status === 422) {
          this.errorMessage = 'Este correo electrónico ya está registrado. Por favor inicia sesión.';
        } else {
          this.errorMessage = response.error.message;
        }
      } else if (response.data.session) {
        this.router.navigate(['/']);
      } else if (response.data.user) {
        this.successMessage = '¡Registro completado con éxito! Revisa tu correo o inicia sesión.';
      }
    } catch (err: any) {
      this.errorMessage = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
    } finally {
      this.loading = false;
    }
  }

  /* Consulta previa en Supabase para evitar duplicados en correo, username o NIT */
  private async checkUserExists(email: string, username?: string | null, nit?: string | null): Promise<boolean> {
    const supabase = this.authService.getSupabaseClient();

    // Comprobar correo en Transeúntes
    const { data: tEmail } = await supabase.from('transeuntes').select('id').eq('correo', email).maybeSingle();
    if (tEmail) {
      this.errorMessage = 'El correo electrónico ya está registrado como Transeúnte.';
      return true;
    }

    // Comprobar correo en Empresas
    const { data: eEmail } = await supabase.from('empresas').select('id').eq('correo_registro', email).maybeSingle();
    if (eEmail) {
      this.errorMessage = 'El correo electrónico ya está registrado como Empresa.';
      return true;
    }

    // Comprobar Username único (si es Transeúnte)
    if (this.selectedRole === 'transeunte' && username) {
      const { data: tUser } = await supabase.from('transeuntes').select('id').eq('username', username).maybeSingle();
      if (tUser) {
        this.errorMessage = 'El nombre de usuario ya está en uso. Elige uno diferente.';
        return true;
      }
    }

    // Comprobar NIT único (si es Empresa)
    if (this.selectedRole === 'empresa' && nit) {
      const { data: eNit } = await supabase.from('empresas').select('id').eq('nit', nit).maybeSingle();
      if (eNit) {
        this.errorMessage = 'El NIT ingresado ya se encuentra registrado.';
        return true;
      }
    }

    return false;
  }
}