import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-olvidar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './olvidar-contrasena.component.html',
  styleUrl: './olvidar-contrasena.component.css'
})
export class OlvidarContrasenaComponent {
  email = '';
  loading = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';

  constructor(private authService: AuthService) {}

  get emailInvalid(): boolean {
    return this.submitted &&
      (!this.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim()));
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.emailInvalid || this.loading) return;

    this.loading = true;
    try {
      await this.authService.recuperarPassword(this.email.trim());
      this.successMessage = '¡Listo, mijo! Si el correo está registrado, te hemos enviado un enlace para restablecer tu contraseña.';
    } catch (error: any) {
      this.errorMessage = 'No pudimos procesar tu solicitud en este momento. Inténtalo de nuevo más tarde.';
    } finally {
      this.loading = false;
    }
  }
}