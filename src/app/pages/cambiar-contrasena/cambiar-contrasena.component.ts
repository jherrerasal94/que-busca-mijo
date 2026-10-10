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

  ngOnInit() {
    // Opcional: Supabase detecta automáticamente el token en la URL gracias a detectSessionInUrl: true en el cliente.
    // Puedes verificar si hay una sesión activa o un hash válido si lo deseas.
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

    if (this.passwordInvalid || this.passwordsMismatch || this.loading) return;

    this.loading = true;
    try {
      await this.authService.actualizarPassword(this.password);
      this.successMessage = '¡Contraseña actualizada con éxito, mijo! Redirigiendo al inicio de sesión...';
      
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    } catch (error: any) {
      this.errorMessage = 'El enlace ha expirado o no es válido. Intenta solicitar uno nuevo.';
    } finally {
      this.loading = false;
    }
  }
}