import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LocationService, Pais, Departamento, Ciudad } from '../../core/services/location.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';

interface PlataformaSocial {
  id: string;
  nombre: string;
  icono?: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FooterComponent],
  template: `
    <div class="page-wrapper">
      <main class="main-content">
        
        @if (cargando) {
          <div class="loading-state">Cargando datos del perfil...</div>
        } @else {
          <!-- ENCABEZADO DE PERFIL -->
          <div class="profile-header">
            <div class="avatar-container">
              @if (tipoUsuario === 'empresa' && perfilForm.get('logo')?.value) {
                <img [src]="perfilForm.get('logo')?.value" alt="Logo preview" class="header-logo-img" (error)="$any($event.target).style.display='none'" />
              } @else {
                {{ tipoUsuario === 'transeunte' ? '👤' : '🏢' }}
              }
            </div>
            <div>
              <h1 class="profile-title">{{ tipoUsuario === 'transeunte' ? 'Mi Perfil de Transeúnte' : 'Mi Perfil de Empresa' }}</h1>
              <p class="profile-subtitle">
                {{ tipoUsuario === 'transeunte' ? 'Gestiona tu información personal y de ubicación.' : 'Gestiona toda la información oficial y corporativa de tu negocio.' }}
              </p>
            </div>
          </div>

          <!-- ================= SECCIÓN DE PLAN EMPRESARIAL (SOLO EMPRESAS) ================= -->
          @if (tipoUsuario === 'empresa') {
            <div class="form-card plan-status-card">
              <div class="plan-status-header">
                <div>
                  <span class="badge-plan">⚡ Suscripción y Membresía</span>
                  <h3 class="section-subtitle-form" style="margin: 5px 0 0 0; border: none;">Tu Plan Actual</h3>
                </div>
                <button type="button" class="btn-upgrade" (click)="irAPlanes()">
                  🚀 Actualizar / Cambiar Plan
                </button>
              </div>

              @if (cargandoPlan) {
                <p class="loading-plan">Consultando tu plan actual...</p>
              } @else {
                <div class="plan-info-grid">
                  <div class="current-plan-box">
                    @if (planActual) {
                      <h4>{{ planActual.nombre }}</h4>
                      <p>{{ planActual.descripcion || 'Sin descripción' }}</p>
                      <div class="plan-details-tags">
                        <span>📦 Límite: <strong>{{ planActual.limite_publicaciones === -1 ? 'Ilimitado' : planActual.limite_publicaciones }}</strong></span>
                        <span>💰 Costo: <strong>$ {{ planActual.costo | number:'1.0-2' }}</strong></span>
                      </div>
                    } @else {
                      <p class="no-plan-text">No tienes un plan activo asignado actualmente.</p>
                    }
                  </div>

                  <!-- Alerta si tiene una solicitud en proceso de validación -->
                  @if (solicitudPendiente) {
                    <div class="solicitud-alert-box">
                      <span class="alert-icon">⏳</span>
                      <div>
                        <strong>Solicitud en proceso</strong>
                        <p>Has solicitado el plan <strong>{{ solicitudPendiente.planes?.nombre }}</strong>. Un administrador se pondrá en contacto contigo para validar tu pago y aprobarla.</p>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- FORMULARIO -->
          <div class="form-card">
            <form [formGroup]="perfilForm" (ngSubmit)="guardarCambios()">
              
              <!-- Correo de Registro (Solo lectura) -->
              <div class="form-group">
                <label>Correo de Registro (Autenticación)</label>
                <input type="email" [value]="correoRegistro" disabled class="form-input disabled" />
                <small class="help-text">Este correo está vinculado a tu cuenta de acceso.</small>
              </div>

              <!-- ================= CAMPOS PARA EMPRESA ================= -->
              @if (tipoUsuario === 'empresa') {
                <h3 class="section-subtitle-form">📌 Información General</h3>

                <div class="form-row">
                  <div class="form-group">
                    <label for="nombre">Nombre de la Empresa *</label>
                    <input id="nombre" type="text" formControlName="nombre" placeholder="Ej: Comercializadora Mijo S.A.S" class="form-input" />
                    @if (perfilForm.get('nombre')?.touched && perfilForm.get('nombre')?.invalid) {
                      <span class="error-msg">El nombre es obligatorio.</span>
                    }
                  </div>

                  <div class="form-group">
                    <label for="alias">Alias / Nombre Comercial</label>
                    <input id="alias" type="text" formControlName="alias" placeholder="Ej: Mijo Store" class="form-input" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="nit">NIT</label>
                    <input id="nit" type="text" formControlName="nit" placeholder="Ej: 900123456-1" class="form-input" />
                  </div>

                  <div class="form-group">
                    <label for="fecha_fundacion">Fecha de Fundación</label>
                    <input id="fecha_fundacion" type="date" formControlName="fecha_fundacion" class="form-input" />
                  </div>
                </div>

                <h3 class="section-subtitle-form">👤 Representante Legal</h3>

                <div class="form-row">
                  <div class="form-group">
                    <label for="rep_nombres">Nombres</label>
                    <input id="rep_nombres" type="text" formControlName="rep_nombres" placeholder="Ej: Carlos Alberto" class="form-input" />
                  </div>

                  <div class="form-group">
                    <label for="rep_apellidos">Apellidos</label>
                    <input id="rep_apellidos" type="text" formControlName="rep_apellidos" placeholder="Ej: Pérez Gómez" class="form-input" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="rep_telefono">Teléfono del Representante / Contacto</label>
                  <input id="rep_telefono" type="text" formControlName="rep_telefono" placeholder="Ej: 3101234567" class="form-input" />
                </div>

                <h3 class="section-subtitle-form">📍 Ubicación y Contacto</h3>

                <div class="form-group">
                  <label for="direccion">Dirección Física</label>
                  <input id="direccion" type="text" formControlName="direccion" placeholder="Ej: Calle Principal # 10-20" class="form-input" />
                </div>

                <!-- Selectores de Ubicación Empresa -->
                <div class="form-row">
                  <div class="form-group">
                    <label for="pais_id">País</label>
                    <select id="pais_id" formControlName="pais_id" class="form-input" (change)="onPaisChange('empresa')">
                      <option value="">Selecciona un país...</option>
                      @for (pais of listaPaises; track pais.id) {
                        <option [value]="pais.id">{{ pais.nombre }}</option>
                      }
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="departamento_id">Departamento</label>
                    <select id="departamento_id" formControlName="departamento_id" class="form-input" (change)="onDepartamentoChange('empresa')" [disabled]="!listaDepartamentos.length">
                      <option value="">Selecciona un departamento...</option>
                      @for (dep of listaDepartamentos; track dep.id) {
                        <option [value]="dep.id">{{ dep.nombre }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label for="ciudad_id">Ciudad</label>
                  <select id="ciudad_id" formControlName="ciudad_id" class="form-input" [disabled]="!listaCiudades.length">
                    <option value="">Selecciona una ciudad...</option>
                    @for (ciudad of listaCiudades; track ciudad.id) {
                      <option [value]="ciudad.id">{{ ciudad.nombre }}</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label for="correo_empresarial">Correo Empresarial / Público</label>
                  <input id="correo_empresarial" type="email" formControlName="correo_empresarial" placeholder="Ej: contacto&#64;miempresa.com" class="form-input" />
                </div>

                <!-- ================= REDES SOCIALES (EMPRESA) ================= -->
                <h3 class="section-subtitle-form">🌐 Redes Sociales y Enlaces</h3>
                <p class="section-desc">Agrega los enlaces a tus perfiles oficiales o sitio web.</p>

                <div formArrayName="redesSociales">
                  @for (redCtrl of redesSocialesFormArray.controls; track $index; let i = $index) {
                    <div [formGroupName]="i" class="social-row">
                      <div class="form-group platform-select-group">
                        <label [for]="'plataforma_' + i">Plataforma</label>
                        <select [id]="'plataforma_' + i" formControlName="plataforma_id" class="form-input">
                          <option value="">Selecciona...</option>
                          @for (plat of listaPlataformasDisponibles; track plat.id) {
                            <option [value]="plat.id">{{ plat.nombre }}</option>
                          }
                        </select>
                      </div>

                      <div class="form-group url-input-group">
                        <label [for]="'url_' + i">URL / Enlace</label>
                        <input [id]="'url_' + i" type="url" formControlName="url" placeholder="Ej: https://instagram.com/tuempresa" class="form-input" />
                      </div>

                      <button type="button" class="btn-remove-social" (click)="removerRedSocial(i)" title="Eliminar enlace">
                        🗑️
                      </button>
                    </div>
                  }
                </div>

                <button type="button" class="btn-secondary" (click)="agregarRedSocial()">
                  ➕ Agregar Red Social
                </button>

                <h3 class="section-subtitle-form">🖼️ Multimedia e Imágenes (URLs)</h3>

                <div class="form-row align-items-center">
                  <div class="form-group">
                    <label for="logo">URL del Logo</label>
                    <input id="logo" type="text" formControlName="logo" placeholder="https://tu-sitio.com/logo.png" class="form-input" />
                  </div>
                  <div class="form-group preview-box-container">
                    <label>Previsualización del Logo</label>
                    <div class="mini-preview-box">
                      @if (perfilForm.get('logo')?.value) {
                        <img [src]="perfilForm.get('logo')?.value" alt="Logo" class="preview-img" (click)="abrirModal(perfilForm.get('logo')?.value)" title="Clic para ampliar" />
                      } @else {
                        <span class="no-img-text">Sin logo cargado</span>
                      }
                    </div>
                  </div>
                </div>

                <div class="form-row align-items-center">
                  <div class="form-group">
                    <label for="img_empresa_1">URL Imagen Empresa 1</label>
                    <input id="img_empresa_1" type="text" formControlName="img_empresa_1" placeholder="https://tu-sitio.com/img1.jpg" class="form-input" />
                  </div>
                  <div class="form-group preview-box-container">
                    <label>Previsualización Imagen 1</label>
                    <div class="mini-preview-box horizontal">
                      @if (perfilForm.get('img_empresa_1')?.value) {
                        <img [src]="perfilForm.get('img_empresa_1')?.value" alt="Img 1" class="preview-img" (click)="abrirModal(perfilForm.get('img_empresa_1')?.value)" title="Clic para ampliar" />
                        <button type="button" class="btn-ampliar" (click)="abrirModal(perfilForm.get('img_empresa_1')?.value)">🔍 Ampliar</button>
                      } @else {
                        <span class="no-img-text">Sin imagen</span>
                      }
                    </div>
                  </div>
                </div>

                <div class="form-row align-items-center">
                  <div class="form-group">
                    <label for="img_empresa_2">URL Imagen Empresa 2</label>
                    <input id="img_empresa_2" type="text" formControlName="img_empresa_2" placeholder="https://tu-sitio.com/img2.jpg" class="form-input" />
                  </div>
                  <div class="form-group preview-box-container">
                    <label>Previsualización Imagen 2</label>
                    <div class="mini-preview-box horizontal">
                      @if (perfilForm.get('img_empresa_2')?.value) {
                        <img [src]="perfilForm.get('img_empresa_2')?.value" alt="Img 2" class="preview-img" (click)="abrirModal(perfilForm.get('img_empresa_2')?.value)" title="Clic para ampliar" />
                        <button type="button" class="btn-ampliar" (click)="abrirModal(perfilForm.get('img_empresa_2')?.value)">🔍 Ampliar</button>
                      } @else {
                        <span class="no-img-text">Sin imagen</span>
                      }
                    </div>
                  </div>
                </div>
              }

              <!-- ================= CAMPOS PARA TRANSEÚNTE ================= -->
              @if (tipoUsuario === 'transeunte') {
                <h3 class="section-subtitle-form">👤 Datos Personales</h3>

                <div class="form-row">
                  <div class="form-group">
                    <label for="nombres">Nombres *</label>
                    <input id="nombres" type="text" formControlName="nombres" placeholder="Ej: Juan Carlos" class="form-input" />
                    @if (perfilForm.get('nombres')?.touched && perfilForm.get('nombres')?.invalid) {
                      <span class="error-msg">Los nombres son obligatorios.</span>
                    }
                  </div>

                  <div class="form-group">
                    <label for="apellidos">Apellidos *</label>
                    <input id="apellidos" type="text" formControlName="apellidos" placeholder="Ej: Rodríguez Pérez" class="form-input" />
                    @if (perfilForm.get('apellidos')?.touched && perfilForm.get('apellidos')?.invalid) {
                      <span class="error-msg">Los apellidos son obligatorios.</span>
                    }
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="username">Nombre de Usuario (Username)</label>
                    <input id="username" type="text" formControlName="username" placeholder="Ej: jrodriguez" class="form-input" />
                  </div>

                  <div class="form-group">
                    <label for="telefono">Teléfono / Celular</label>
                    <input id="telefono" type="text" formControlName="telefono" placeholder="Ej: 3001234567" class="form-input" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="fecha_nacimiento">Fecha de Nacimiento</label>
                  <input id="fecha_nacimiento" type="date" formControlName="fecha_nacimiento" class="form-input" />
                </div>

                <h3 class="section-subtitle-form">📍 Ciudad de Nacimiento</h3>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="nac_pais_id">País de Nacimiento</label>
                    <select id="nac_pais_id" formControlName="nac_pais_id" class="form-input" (change)="onPaisChange('nacimiento')">
                      <option value="">Selecciona un país...</option>
                      @for (pais of listaPaises; track pais.id) {
                        <option [value]="pais.id">{{ pais.nombre }}</option>
                      }
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="nac_departamento_id">Departamento de Nacimiento</label>
                    <select id="nac_departamento_id" formControlName="nac_departamento_id" class="form-input" (change)="onDepartamentoChange('nacimiento')" [disabled]="!listaDepsNacimiento.length">
                      <option value="">Selecciona un departamento...</option>
                      @for (dep of listaDepsNacimiento; track dep.id) {
                        <option [value]="dep.id">{{ dep.nombre }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label for="ciudad_nacimiento_id">Ciudad de Nacimiento</label>
                  <select id="ciudad_nacimiento_id" formControlName="ciudad_nacimiento_id" class="form-input" [disabled]="!listaCiudadesNacimiento.length">
                    <option value="">Selecciona una ciudad...</option>
                    @for (ciudad of listaCiudadesNacimiento; track ciudad.id) {
                      <option [value]="ciudad.id">{{ ciudad.nombre }}</option>
                    }
                  </select>
                </div>

                <h3 class="section-subtitle-form">🏠 Ciudad de Residencia</h3>

                <div class="form-row">
                  <div class="form-group">
                    <label for="res_pais_id">País de Residencia</label>
                    <select id="res_pais_id" formControlName="res_pais_id" class="form-input" (change)="onPaisChange('residencia')">
                      <option value="">Selecciona un país...</option>
                      @for (pais of listaPaises; track pais.id) {
                        <option [value]="pais.id">{{ pais.nombre }}</option>
                      }
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="res_departamento_id">Departamento de Residencia</label>
                    <select id="res_departamento_id" formControlName="res_departamento_id" class="form-input" (change)="onDepartamentoChange('residencia')" [disabled]="!listaDepsResidencia.length">
                      <option value="">Selecciona un departamento...</option>
                      @for (dep of listaDepsResidencia; track dep.id) {
                        <option [value]="dep.id">{{ dep.nombre }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label for="ciudad_residencia_id">Ciudad de Residencia</label>
                  <select id="ciudad_residencia_id" formControlName="ciudad_residencia_id" class="form-input" [disabled]="!listaCiudadesResidencia.length">
                    <option value="">Selecciona una ciudad...</option>
                    @for (ciudad of listaCiudadesResidencia; track ciudad.id) {
                      <option [value]="ciudad.id">{{ ciudad.nombre }}</option>
                    }
                  </select>
                </div>
              }

              <!-- Mensajes de Estado -->
              @if (mensajeExito) {
                <div class="alert success">{{ mensajeExito }}</div>
              }
              @if (mensajeError) {
                <div class="alert error">{{ mensajeError }}</div>
              }

              <!-- Botón de Guardar -->
              <div class="form-actions">
                <button type="submit" class="btn-primary" [disabled]="guardando || perfilForm.invalid">
                  @if (guardando) {
                    Guardando cambios...
                  } @else {
                    Guardar Cambios
                  }
                </button>
              </div>

            </form>
          </div>
        }

      </main>
      <app-footer></app-footer>

      <!-- MODAL PARA AMPLIAR IMAGEN -->
      @if (imagenAmpliadaUrl) {
        <div class="modal-backdrop" (click)="cerrarModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <button type="button" class="modal-close" (click)="cerrarModal()">✕</button>
            <img [src]="imagenAmpliadaUrl" alt="Imagen ampliada" class="modal-img" />
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    :host {
      --primary: #002b66;
      --accent: #64d500;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --bg-page: #f4f8f1;
      --bg-white: #ffffff;
      font-family: 'Segoe UI', Roboto, sans-serif;
    }

    .page-wrapper {
      background-color: var(--bg-white);
      min-height: calc(100vh - 78px);
      display: flex;
      flex-direction: column;
    }

    .main-content {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      width: 100%;
      box-sizing: border-box;
      flex: 1;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
    }

    .avatar-container {
      width: 75px;
      height: 75px;
      background: var(--bg-page);
      border: 2px solid var(--accent);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      overflow: hidden;
    }

    .header-logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-title {
      font-size: 2rem;
      font-weight: 900;
      color: var(--primary);
      margin: 0 0 6px 0;
    }

    .profile-subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin: 0;
    }

    /* ESTILOS NUEVOS PARA TARJETA DE PLAN Y SOLICITUDES */
    .plan-status-card {
      margin-bottom: 30px;
      border: 2px solid #84cc16 !important;
      background: linear-gradient(to bottom, #ffffff, #fcfdfa);
    }

    .plan-status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }

    .badge-plan {
      background-color: #fef3c7;
      color: #92400e;
      padding: 4px 12px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .btn-upgrade {
      background: var(--accent, #64d500);
      color: var(--primary, #002b66);
      border: 2px solid var(--primary, #002b66);
      padding: 10px 20px;
      border-radius: 999px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 3px 0px var(--primary, #002b66);
      transition: transform 0.1s ease;
    }

    .btn-upgrade:hover {
      transform: translateY(-2px);
    }

    .plan-info-grid {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .current-plan-box h4 {
      color: var(--primary);
      font-size: 1.3rem;
      margin: 0 0 5px 0;
      font-weight: 800;
    }

    .current-plan-box p {
      color: var(--text-muted);
      margin: 0 0 10px 0;
      font-size: 0.95rem;
    }

    .plan-details-tags {
      display: flex;
      gap: 20px;
      font-size: 0.9rem;
      color: var(--primary);
    }

    .no-plan-text {
      color: #eab308;
      font-weight: 600;
      margin: 0;
    }

    .loading-plan {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin: 0;
    }

    .solicitud-alert-box {
      display: flex;
      align-items: center;
      gap: 15px;
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 15px;
      border-radius: 12px;
      color: #1e40af;
      font-size: 0.9rem;
    }

    .alert-icon {
      font-size: 1.8rem;
    }

    .solicitud-alert-box strong {
      display: block;
      margin-bottom: 2px;
    }

    .solicitud-alert-box p {
      margin: 0;
    }

    .form-card {
      background: var(--bg-white);
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.02);
    }

    .section-subtitle-form {
      font-size: 1.1rem;
      color: var(--primary);
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 8px;
      margin: 28px 0 10px 0;
    }

    .section-desc {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-bottom: 15px;
    }

    .form-group {
      margin-bottom: 20px;
      flex: 1;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .align-items-center {
      align-items: flex-end;
    }

    .social-row {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 12px;
    }

    .social-row .form-group {
      margin-bottom: 0;
    }

    .platform-select-group {
      flex: 1;
    }

    .url-input-group {
      flex: 2;
    }

    .btn-remove-social {
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.2s;
      flex-shrink: 0;
    }

    .btn-remove-social:hover {
      background: #fecaca;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: var(--primary);
      border: 1px dashed #cbd5e1;
      padding: 10px 16px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      width: 100%;
      margin-bottom: 20px;
      transition: background 0.2s;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    @media (max-width: 600px) {
      .form-row, .social-row {
        grid-template-columns: 1fr;
        flex-direction: column;
        gap: 10px;
      }
      .btn-remove-social {
        width: 100%;
        height: 38px;
      }
    }

    label {
      display: block;
      font-weight: 700;
      color: var(--primary);
      font-size: 0.9rem;
      margin-bottom: 8px;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 1rem;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s;
      background-color: #fff;
    }

    .form-input:focus {
      border-color: var(--primary);
    }

    .form-input.disabled {
      background-color: #f8fafc;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .mini-preview-box {
      width: 100%;
      height: 48px;
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      box-sizing: border-box;
    }

    .mini-preview-box.horizontal {
      display: flex;
      justify-content: space-between;
      padding: 0 12px;
    }

    .preview-img {
      max-height: 38px;
      max-width: 100px;
      object-fit: contain;
      cursor: pointer;
      border-radius: 4px;
      transition: transform 0.2s;
    }

    .preview-img:hover {
      transform: scale(1.05);
    }

    .no-img-text {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .btn-ampliar {
      background: #e2e8f0;
      border: none;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary);
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-ampliar:hover {
      background: #cbd5e1;
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      box-sizing: border-box;
    }

    .modal-content {
      background: #fff;
      padding: 20px;
      border-radius: 16px;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      position: relative;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      font-weight: bold;
      cursor: pointer;
      color: #64748b;
      margin-bottom: 10px;
    }

    .modal-img {
      max-width: 80vw;
      max-height: 75vh;
      object-fit: contain;
      border-radius: 8px;
    }

    .help-text {
      display: block;
      color: var(--text-muted);
      font-size: 0.75rem;
      margin-top: 4px;
    }

    .error-msg {
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 4px;
      display: block;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .alert.success {
      background-color: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .alert.error {
      background-color: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .form-actions {
      margin-top: 35px;
    }

    .btn-primary {
      width: 100%;
      background: var(--primary);
      color: var(--accent);
      border: none;
      padding: 14px;
      border-radius: 14px;
      font-weight: 800;
      font-size: 1rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading-state {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
      font-weight: 600;
    }
  `]
})
export class PerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private locationService = inject(LocationService);
  private router = inject(Router);

  perfilForm: FormGroup;
  cargando = true;
  guardando = false;
  correoRegistro = '';
  userId = '';
  tipoUsuario: 'empresa' | 'transeunte' = 'empresa';
  mensajeExito = '';
  mensajeError = '';

  // Propiedades nuevas para planes y solicitudes
  planActual: any = null;
  solicitudPendiente: any = null;
  cargandoPlan = false;

  listaPaises: Pais[] = [];
  listaPlataformasDisponibles: PlataformaSocial[] = [];

  listaDepartamentos: Departamento[] = [];
  listaCiudades: Ciudad[] = [];
  listaDepsNacimiento: Departamento[] = [];
  listaCiudadesNacimiento: Ciudad[] = [];
  listaDepsResidencia: Departamento[] = [];
  listaCiudadesResidencia: Ciudad[] = [];

  imagenAmpliadaUrl: string | null = null;

  constructor() {
    this.perfilForm = this.fb.group({
      nombre: [''],
      alias: [''],
      nit: [''],
      fecha_fundacion: [''],
      rep_nombres: [''],
      rep_apellidos: [''],
      rep_telefono: [''],
      direccion: [''],
      correo_empresarial: ['', [Validators.email]],
      logo: [''],
      img_empresa_1: [''],
      img_empresa_2: [''],

      redesSociales: this.fb.array([]),

      nombres: [''],
      apellidos: [''],
      username: [''],
      telefono: [''],
      fecha_nacimiento: [''],

      pais_id: [''],
      departamento_id: [''],
      ciudad_id: [''],

      nac_pais_id: [''],
      nac_departamento_id: [''],
      ciudad_nacimiento_id: [''],

      res_pais_id: [''],
      res_departamento_id: [''],
      ciudad_residencia_id: ['']
    });
  }

  get redesSocialesFormArray(): FormArray {
    return this.perfilForm.get('redesSociales') as FormArray;
  }

  async ngOnInit() {
    await this.cargarPlataformasSociales();
    this.listaPaises = await this.locationService.getPaises();
    await this.cargarDatosPerfil();
  }

  async cargarPlataformasSociales() {
    try {
      const supabase = this.authService.getSupabaseClient();
      const { data, error } = await supabase
        .from('plataformas_sociales')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error de Supabase al cargar plataformas:', error);
      } else if (data) {
        this.listaPlataformasDisponibles = data;
      }
    } catch (err) {
      console.error('Excepción al cargar plataformas sociales:', err);
    }
  }

  agregarRedSocial(plataforma_id: string = '', url: string = '') {
    const redGroup = this.fb.group({
      plataforma_id: [plataforma_id, Validators.required],
      url: [url, [Validators.required]]
    });
    this.redesSocialesFormArray.push(redGroup);
  }

  removerRedSocial(index: number) {
    this.redesSocialesFormArray.removeAt(index);
  }

  async onPaisChange(tipo: 'residencia' | 'nacimiento' | 'empresa') {
    if (tipo === 'residencia') {
      const paisId = this.perfilForm.get('res_pais_id')?.value;
      this.perfilForm.patchValue({ res_departamento_id: '', ciudad_residencia_id: '' });
      this.listaDepsResidencia = [];
      this.listaCiudadesResidencia = [];
      if (paisId) this.listaDepsResidencia = await this.locationService.getDepartamentosByPais(paisId);
    } else if (tipo === 'nacimiento') {
      const paisId = this.perfilForm.get('nac_pais_id')?.value;
      this.perfilForm.patchValue({ nac_departamento_id: '', ciudad_nacimiento_id: '' });
      this.listaDepsNacimiento = [];
      this.listaCiudadesNacimiento = [];
      if (paisId) this.listaDepsNacimiento = await this.locationService.getDepartamentosByPais(paisId);
    } else {
      const paisId = this.perfilForm.get('pais_id')?.value;
      this.perfilForm.patchValue({ departamento_id: '', ciudad_id: '' });
      this.listaDepartamentos = [];
      this.listaCiudades = [];
      if (paisId) this.listaDepartamentos = await this.locationService.getDepartamentosByPais(paisId);
    }
  }

  async onDepartamentoChange(tipo: 'residencia' | 'nacimiento' | 'empresa') {
    if (tipo === 'residencia') {
      const depId = this.perfilForm.get('res_departamento_id')?.value;
      this.perfilForm.patchValue({ ciudad_residencia_id: '' });
      this.listaCiudadesResidencia = [];
      if (depId) this.listaCiudadesResidencia = await this.locationService.getCiudadesByDepartamento(depId);
    } else if (tipo === 'nacimiento') {
      const depId = this.perfilForm.get('nac_departamento_id')?.value;
      this.perfilForm.patchValue({ ciudad_nacimiento_id: '' });
      this.listaCiudadesNacimiento = [];
      if (depId) this.listaCiudadesNacimiento = await this.locationService.getCiudadesByDepartamento(depId);
    } else {
      const depId = this.perfilForm.get('departamento_id')?.value;
      this.perfilForm.patchValue({ ciudad_id: '' });
      this.listaCiudades = [];
      if (depId) this.listaCiudades = await this.locationService.getCiudadesByDepartamento(depId);
    }
  }

  async cargarDatosPerfil() {
    this.cargando = true;
    try {
      const user = await this.authService.getUser();
      if (!user) return;

      this.userId = user.id;
      this.correoRegistro = user.email || '';
      const supabase = this.authService.getSupabaseClient();

      // 1. Intentar buscar si es una empresa
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', this.userId)
        .maybeSingle();

      if (empresaData) {
        this.tipoUsuario = 'empresa';
        this.configurarValidadoresEmpresa();

        // Cargar información del plan y solicitudes de la empresa
        await this.cargarInformacionPlanEmpresa(this.userId);

        let paisId = '';
        let departamentoId = '';
        const ciudadId = empresaData.ciudad_id || '';

        if (ciudadId) {
          const { data: ciudadData } = await supabase.from('ciudades').select('id, departamento_id').eq('id', ciudadId).single();
          if (ciudadData) {
            departamentoId = ciudadData.departamento_id;
            paisId = await this.getPaisIdFromDepartamento(departamentoId);
            this.listaDepartamentos = await this.locationService.getDepartamentosByPais(paisId);
            this.listaCiudades = await this.locationService.getCiudadesByDepartamento(departamentoId);
          }
        }

        // Cargar Redes Sociales de la Empresa
        this.redesSocialesFormArray.clear();
        const { data: redesData, error: redesError } = await supabase
          .from('redes_sociales')
          .select('*')
          .eq('empresa_id', this.userId);

        if (redesError) {
          console.error('Error al consultar redes_sociales:', redesError);
        } else if (redesData && redesData.length > 0) {
          redesData.forEach(red => {
            this.agregarRedSocial(red.plataforma_id, red.url);
          });
        }

        this.perfilForm.patchValue({
          nombre: empresaData.nombre || '',
          alias: empresaData.alias || '',
          nit: empresaData.nit || '',
          fecha_fundacion: empresaData.fecha_fundacion || '',
          rep_nombres: empresaData.rep_nombres || '',
          rep_apellidos: empresaData.rep_apellidos || '',
          rep_telefono: empresaData.rep_telefono || '',
          direccion: empresaData.direccion || '',
          correo_empresarial: empresaData.correo_empresarial || '',
          pais_id: paisId,
          departamento_id: departamentoId,
          ciudad_id: ciudadId,
          logo: empresaData.logo || '',
          img_empresa_1: empresaData.img_empresa_1 || '',
          img_empresa_2: empresaData.img_empresa_2 || ''
        });
        return;
      }

      // 2. Si no es empresa, buscar si es transeúnte
      const { data: transeunteData } = await supabase
        .from('transeuntes')
        .select('*')
        .eq('id', this.userId)
        .maybeSingle();

      if (transeunteData) {
        this.tipoUsuario = 'transeunte';
        this.configurarValidadoresTranseunte();

        let nacPaisId = '', nacDepId = '', resPaisId = '', resDepId = '';
        const ciudadNacId = transeunteData.ciudad_nacimiento_id || '';
        const ciudadResId = transeunteData.ciudad_residencia_id || '';

        if (ciudadNacId) {
          const { data: cNac } = await supabase.from('ciudades').select('id, departamento_id').eq('id', ciudadNacId).single();
          if (cNac) {
            nacDepId = cNac.departamento_id;
            nacPaisId = await this.getPaisIdFromDepartamento(nacDepId);
            this.listaDepsNacimiento = await this.locationService.getDepartamentosByPais(nacPaisId);
            this.listaCiudadesNacimiento = await this.locationService.getCiudadesByDepartamento(nacDepId);
          }
        }

        if (ciudadResId) {
          const { data: cRes } = await supabase.from('ciudades').select('id, departamento_id').eq('id', ciudadResId).single();
          if (cRes) {
            resDepId = cRes.departamento_id;
            resPaisId = await this.getPaisIdFromDepartamento(resDepId);
            this.listaDepsResidencia = await this.locationService.getDepartamentosByPais(resPaisId);
            this.listaCiudadesResidencia = await this.locationService.getCiudadesByDepartamento(resDepId);
          }
        }

        this.perfilForm.patchValue({
          nombres: transeunteData.nombres || '',
          apellidos: transeunteData.apellidos || '',
          username: transeunteData.username || '',
          telefono: transeunteData.telefono || '',
          fecha_nacimiento: transeunteData.fecha_nacimiento || '',
          nac_pais_id: nacPaisId,
          nac_departamento_id: nacDepId,
          ciudad_nacimiento_id: ciudadNacId,
          res_pais_id: resPaisId,
          res_departamento_id: resDepId,
          ciudad_residencia_id: ciudadResId
        });
      }

    } catch (err) {
      console.error('Excepción al cargar perfil:', err);
    } finally {
      this.cargando = false;
    }
  }

  // Método para cargar datos específicos del plan de la empresa
  async cargarInformacionPlanEmpresa(empresaId: string) {
    this.cargandoPlan = true;
    try {
      const supabase = this.authService.getSupabaseClient();

      const { data: empresaPlanData } = await supabase
        .from('empresas')
        .select('plan_id, planes(nombre, descripcion, costo, limite_publicaciones, beneficios)')
        .eq('id', empresaId)
        .single();

      if (empresaPlanData && empresaPlanData.planes) {
        this.planActual = empresaPlanData.planes;
      }

      const { data: solicitudData } = await supabase
        .from('solicitudes_planes')
        .select('*, planes(nombre)')
        .eq('empresa_id', empresaId)
        .eq('estado', 'pendiente')
        .maybeSingle();

      if (solicitudData) {
        this.solicitudPendiente = solicitudData;
      }
    } catch (err) {
      console.error('Error al cargar plan de la empresa:', err);
    } finally {
      this.cargandoPlan = false;
    }
  }

  irAPlanes() {
    this.router.navigate(['/adquirir-plan']);
  }

  private configurarValidadoresEmpresa() {
    this.perfilForm.get('nombre')?.setValidators([Validators.required]);
    this.perfilForm.get('nombres')?.clearValidators();
    this.perfilForm.get('apellidos')?.clearValidators();
    this.perfilForm.updateValueAndValidity();
  }

  private configurarValidadoresTranseunte() {
    this.perfilForm.get('nombres')?.setValidators([Validators.required]);
    this.perfilForm.get('apellidos')?.setValidators([Validators.required]);
    this.perfilForm.get('nombre')?.clearValidators();
    this.perfilForm.updateValueAndValidity();
  }

  private async getPaisIdFromDepartamento(departamentoId: string): Promise<string> {
    if (!departamentoId) return '';
    const supabase = this.authService.getSupabaseClient();
    const { data } = await supabase.from('departamentos').select('pais_id').eq('id', departamentoId).single();
    return data ? data.pais_id : '';
  }

  abrirModal(url: string) {
    if (url) this.imagenAmpliadaUrl = url;
  }

  cerrarModal() {
    this.imagenAmpliadaUrl = null;
  }

  async guardarCambios() {
    if (this.perfilForm.invalid) return;

    this.guardando = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    const v = this.perfilForm.value;
    const supabase = this.authService.getSupabaseClient();

    try {
      if (this.tipoUsuario === 'empresa') {
        const { error } = await supabase.from('empresas').upsert({
          id: this.userId,
          nombre: v.nombre,
          alias: v.alias,
          nit: v.nit,
          fecha_fundacion: v.fecha_fundacion || null,
          rep_nombres: v.rep_nombres,
          rep_apellidos: v.rep_apellidos,
          rep_telefono: v.rep_telefono,
          direccion: v.direccion,
          correo_empresarial: v.correo_empresarial,
          correo_registro: this.correoRegistro,
          ciudad_id: v.ciudad_id || null,
          logo: v.logo,
          img_empresa_1: v.img_empresa_1,
          img_empresa_2: v.img_empresa_2,
          updated_at: new Date()
        });
        if (error) throw error;

        await supabase.from('redes_sociales').delete().eq('empresa_id', this.userId);

        if (v.redesSociales && v.redesSociales.length > 0) {
          const nuevasRedes = v.redesSociales.map((item: any) => ({
            empresa_id: this.userId,
            plataforma_id: item.plataforma_id,
            url: item.url,
            updated_at: new Date()
          }));

          const { error: errorRedes } = await supabase.from('redes_sociales').insert(nuevasRedes);
          if (errorRedes) throw errorRedes;
        }

      } else {
        const { error } = await supabase.from('transeuntes').upsert({
          id: this.userId,
          nombres: v.nombres,
          apellidos: v.apellidos,
          username: v.username,
          telefono: v.telefono,
          fecha_nacimiento: v.fecha_nacimiento || null,
          correo: this.correoRegistro,
          ciudad_nacimiento_id: v.ciudad_nacimiento_id || null,
          ciudad_residencia_id: v.ciudad_residencia_id || null,
          updated_at: new Date()
        });
        if (error) throw error;
      }

      this.mensajeExito = '¡Perfil actualizado con éxito!';
    } catch (err: any) {
      console.error('Error al guardar perfil:', err);
      this.mensajeError = err.message || 'Ocurrió un error al guardar los cambios.';
    } finally {
      this.guardando = false;
    }
  }
}