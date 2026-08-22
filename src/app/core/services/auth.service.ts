import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient, User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase!: SupabaseClient;
  private platformId = inject(PLATFORM_ID);

  constructor() {
    // Solo inicializamos el cliente si estamos ejecutando en el navegador del usuario
    if (isPlatformBrowser(this.platformId)) {
      this.supabase = createClient(
        environment.supabaseUrl, 
        environment.supabaseKey
      );
    }
  }

  // Escuchar cambios en la autenticación (login / logout)
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    if (!isPlatformBrowser(this.platformId) || !this.supabase) return;
    return this.supabase.auth.onAuthStateChange(callback);
  }

  // Registrar usuario
  async signUp(email: string, pass: string) {
    if (!this.supabase) return;
    const { data, error } = await this.supabase.auth.signUp({ email, password: pass });
    if (error) throw error;
    return data;
  }

  // Iniciar sesión
  async signIn(email: string, pass: string) {
    if (!this.supabase) return;
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
  }

  // Cerrar sesión
  async signOut() {
    if (!this.supabase) return;
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  // Obtener usuario actual
  async getUser(): Promise<User | null> {
    if (!this.supabase) return null;
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }
}