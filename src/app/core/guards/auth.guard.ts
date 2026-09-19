import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export class AuthGuards {
  static isAuthenticated: CanActivateFn = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = await authService.getUser();
    if (user) return true;
    router.navigate(['/login']);
    return false;
  };

  static isEmpresa: CanActivateFn = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = await authService.getUser();
    
    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    const rol = await authService.obtenerRolUsuario(user.id);
    if (rol === 'empresa') return true;

    router.navigate(['/']);
    return false;
  };

  static isAdmin: CanActivateFn = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = await authService.getUser();
    
    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    const rol = await authService.obtenerRolUsuario(user.id);
    if (rol === 'admin') return true;

    router.navigate(['/']);
    return false;
  };
}