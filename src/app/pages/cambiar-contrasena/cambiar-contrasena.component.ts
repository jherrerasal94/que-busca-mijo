import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-cambiar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cambiar-contrasena.component.html',
  styleUrl: './cambiar-contrasena.component.css'
})
export class CambiarContrasenaComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  password = '';
  confirmPassword = '';
  showPassword = false;
  loading = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';
  sesionValida = false;

  async ngOnInit() {
    // Verificamos si hay una sesión activa o un token válido de recuperación
    const user = await this.authService.getUser();
    if (user) {
      this.sesionValida = true;
    } else {
      this.errorMessage = 'El enlace de recuperación ha expirado o ya fue utilizado. Por favor, solicita uno nuevo.';
    }
  }

  get passwordInvalid(): boolean {
    return this.submitted && (!this.password || this.password.length < 6);
  }

  get passwordsMismatch(): boolean {
    return this.submitted && (this.password !== this.confirmPassword);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.sesionValida) {
      this.errorMessage = 'No hay una sesión de recuperación válida. Solicita un nuevo enlace.';
      return;
    }

    if (this.passwordInvalid || this.passwordsMismatch || this.loading) return;

    this.loading = true;
    try {
      await this.authService.actualizarPassword(this.password);
      this.successMessage = '¡Contraseña actualizada con éxito, mijo! Redirigiendo al inicio de sesión...';
      
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    } catch (error: any) {
      // Capturamos mensajes específicos si Supabase rechaza el cambio (ej. contraseña igual a la anterior)
      if (error?.message?.includes('same') || error?.message?.includes('should be different')) {
        this.errorMessage = 'La nueva contraseña debe ser diferente a la que tenías anteriormente.';
      } else {
        this.errorMessage = error?.message || 'No se pudo actualizar la contraseña. El enlace pudo haber expirado.';
      }
    } finally {
      this.loading = false;
    }
  }
}