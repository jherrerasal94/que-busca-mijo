import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Guard para verificar que el usuario esté AUTENTICADO */
export class AuthGuards {
  static isAuthenticated: CanActivateFn = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Esperar a verificar la sesión actual en Supabase
    const supabase = authService.getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      return true; // Acceso permitido
    }

    // Redirigir al Login si no tiene sesión activa
    router.navigate(['/login']);
    return false;
  };

  /** Guard exclusivo para usuarios con ROL EMPRESA */
  static isEmpresa: CanActivateFn = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const supabase = authService.getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.navigate(['/login']);
      return false;
    }

    const role = session.user.user_metadata?.['role'];

    if (role === 'empresa') {
      return true; // Acceso permitido sólo a empresas
    }

    // Si es transeúnte o no es empresa, redirigir al Inicio
    router.navigate(['/']);
    return false;
  };
}