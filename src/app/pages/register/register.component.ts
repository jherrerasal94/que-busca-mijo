import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LocationService, Pais, Departamento, Ciudad } from '../../core/services/location.service';

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
            
            <!-- Credenciales Básicas -->
            <div class="form-group">
              <label>Correo Electrónico *</label>
              <input type="email" formControlName="email" placeholder="correo@ejemplo.com" />
              @if (isFieldInvalid('email')) {
                <span class="field-error">Ingresa un correo válido.</span>
              }
            </div>

            <div class="form-group">
              <label>Contraseña *</label>
              <input type="password" formControlName="password" placeholder="Mínimo 6 caracteres" />
              @if (isFieldInvalid('password')) {
                <span class="field-error">Mínimo 6 caracteres requeridos.</span>
              }
            </div>

            <hr class="divider" />

            <!-- FORMULARIO TRANSEÚNTE -->
            @if (selectedRole === 'transeunte') {
              <div class="form-row">
                <div class="form-group">
                  <label>Nombres *</label>
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
              <div class="section-title">Lugar de Nacimiento</div>
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
              <div class="section-title">Lugar de Residencia</div>
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
              <div class="section-title">Ubicación Comercial</div>
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
    .auth-container { display: flex; justify-content: center; padding: 40px 20px; }
    .auth-card { background: var(--bg-card); border-radius: 16px; padding: 32px; width: 100%; max-width: 600px; box-shadow: 0 8px 24px rgba(0,43,102,0.08); border: 1px solid var(--border-light); }
    h2 { color: var(--primary); margin: 0 0 6px 0; font-size: 1.6rem; }
    .subtitle { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px; }
    .role-selector { display: flex; gap: 12px; margin-bottom: 20px; }
    .role-selector button { flex: 1; padding: 10px; border-radius: 20px; border: 2px solid var(--border-input); background: transparent; font-weight: 700; color: var(--primary); cursor: pointer; transition: all 0.2s; }
    .role-selector button.active { background: var(--accent); border-color: var(--primary); box-shadow: 0 3px 0 var(--primary); }
    .divider { border: 0; height: 1px; background: var(--border-light); margin: 20px 0; }
    .section-title { font-size: 0.9rem; font-weight: 800; color: var(--primary); margin: 16px 0 10px 0; border-bottom: 2px solid var(--accent); display: inline-block; padding-bottom: 2px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
    .form-row { display: flex; gap: 12px; }
    .form-row .form-group { flex: 1; }
    .form-row.trio .form-group { flex: 1; }
    label { font-size: 0.82rem; font-weight: 700; color: var(--primary); }
    input, select { padding: 9px 12px; border-radius: 10px; border: 1px solid var(--border-input); font-size: 0.9rem; background-color: #fff; }
    input:focus, select:focus { outline: none; border-color: var(--primary); }
    select:disabled { background-color: #f3f4f6; cursor: not-allowed; }
    .field-error { color: #dc2626; font-size: 0.75rem; font-weight: 600; }
    .full-width { width: 100%; margin-top: 16px; display: inline-flex; justify-content: center; align-items: center; gap: 8px; }
    .error-banner { background: #fee2e2; color: #b91c1c; padding: 12px; border-radius: 10px; font-size: 0.9rem; font-weight: 600; margin-bottom: 16px; }
    .success-banner { background: #ecfdf5; color: #047857; padding: 16px; border-radius: 10px; font-size: 0.95rem; font-weight: 600; text-align: center; }
    .auth-footer { margin-top: 20px; text-align: center; font-size: 0.9rem; color: var(--text-muted); }
    .auth-footer a { color: var(--primary); font-weight: 700; text-decoration: none; }
    .spinner { width: 16px; height: 16px; border: 2px solid var(--primary); border-bottom-color: transparent; border-radius: 50%; display: inline-block; animation: rotation 1s linear infinite; }
    @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private locationService = inject(LocationService);
  private router = inject(Router);

  selectedRole: 'transeunte' | 'empresa' = 'transeunte';
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Lista compartida de Países
  paises: Pais[] = [];

  // Colecciones independientes
  deptosNacimiento: Departamento[] = [];
  ciudadesNacimiento: Ciudad[] = [];
  deptosResidencia: Departamento[] = [];
  ciudadesResidencia: Ciudad[] = [];
  deptosEmpresa: Departamento[] = [];
  ciudadesEmpresa: Ciudad[] = [];

  // Estados de carga por bloque
  loadingDeptosNac = false;
  loadingCiudadesNac = false;
  loadingDeptosRes = false;
  loadingCiudadesRes = false;
  loadingDeptosEmp = false;
  loadingCiudadesEmp = false;

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    
    // Transeúnte
    nombres: [''],
    apellidos: [''],
    telefono: [''],
    username: [''],
    fecha_nacimiento: [''],
    
    // Ubicación Nacimiento
    pais_nacimiento_id: [''],
    depto_nacimiento_id: [{ value: '', disabled: true }],
    ciudad_nacimiento_id: [{ value: '', disabled: true }],

    // Ubicación Residencia
    pais_residencia_id: [''],
    depto_residencia_id: [{ value: '', disabled: true }],
    ciudad_residencia_id: [{ value: '', disabled: true }],
    
    // Empresa
    nombre: [''],
    alias: [''],
    nit: [''],
    fecha_fundacion: [''],
    rep_nombres: [''],
    rep_apellidos: [''],
    rep_telefono: [''],
    direccion: [''],
    
    // Ubicación Empresa
    pais_empresa_id: [''],
    depto_empresa_id: [{ value: '', disabled: true }],
    ciudad_id: [{ value: '', disabled: true }]
  });

  async ngOnInit() {
    this.updateValidations();
    
    // 1. Cargar Países inicialmente
    this.paises = await this.locationService.getPaises();

    // 2. Configurar cascadas independientes
    this.setupLocationCascade(
      'pais_nacimiento_id',
      'depto_nacimiento_id',
      'ciudad_nacimiento_id',
      (deptos) => (this.deptosNacimiento = deptos),
      (ciudades) => (this.ciudadesNacimiento = ciudades),
      (loading) => (this.loadingDeptosNac = loading),
      (loading) => (this.loadingCiudadesNac = loading)
    );

    this.setupLocationCascade(
      'pais_residencia_id',
      'depto_residencia_id',
      'ciudad_residencia_id',
      (deptos) => (this.deptosResidencia = deptos),
      (ciudades) => (this.ciudadesResidencia = ciudades),
      (loading) => (this.loadingDeptosRes = loading),
      (loading) => (this.loadingCiudadesRes = loading)
    );

    this.setupLocationCascade(
      'pais_empresa_id',
      'depto_empresa_id',
      'ciudad_id',
      (deptos) => (this.deptosEmpresa = deptos),
      (ciudades) => (this.ciudadesEmpresa = ciudades),
      (loading) => (this.loadingDeptosEmp = loading),
      (loading) => (this.loadingCiudadesEmp = loading)
    );
  }

  /**
   * Helper que conecta la cascada País -> Departamento -> Ciudad para un grupo específico de campos
   */
  private setupLocationCascade(
    countryControlName: string,
    stateControlName: string,
    cityControlName: string,
    setStateList: (data: Departamento[]) => void,
    setCityList: (data: Ciudad[]) => void,
    setLoadingState: (loading: boolean) => void,
    setLoadingCity: (loading: boolean) => void
  ) {
    const countryCtrl = this.registerForm.get(countryControlName);
    const stateCtrl = this.registerForm.get(stateControlName);
    const cityCtrl = this.registerForm.get(cityControlName);

    // Cambio en País -> Cargar Departamentos
    countryCtrl?.valueChanges.subscribe(async (paisId) => {
      setStateList([]);
      setCityList([]);
      stateCtrl?.setValue('', { emitEvent: false });
      cityCtrl?.setValue('', { emitEvent: false });
      stateCtrl?.disable();
      cityCtrl?.disable();

      if (paisId) {
        setLoadingState(true);
        const deptos = await this.locationService.getDepartamentosByPais(paisId);
        setStateList(deptos);
        setLoadingState(false);
        if (deptos.length > 0) stateCtrl?.enable();
      }
    });

    // Cambio en Departamento -> Cargar Ciudades
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
    const empresaRequired = ['nombre', 'nit', 'rep_nombres', 'rep_apellidos', 'rep_telefono'];

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
      this.errorMessage = 'Por favor completa todos los campos requeridos (*).';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const { email, username, nit } = this.registerForm.value;

    try {
      const exists = await this.checkUserExists(email!, username, nit);
      if (exists) {
        this.loading = false;
        return;
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
      } else if (response.data.session) {
        this.router.navigate(['/']);
      } else if (response.data.user) {
        this.successMessage = '¡Registro completado! Revisa tu correo o inicia sesión.';
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