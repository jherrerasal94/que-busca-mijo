import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient, User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

// 🔥 1. Creamos un WebSocket falso para engañar a Supabase en el servidor (SSR)
class DummyWebSocket {
  constructor() { }
  close() { }
  send() { }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private platformId = inject(PLATFORM_ID);

  constructor() {
    const isBrowser = isPlatformBrowser(this.platformId);

    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: isBrowser,
          autoRefreshToken: isBrowser,
          detectSessionInUrl: isBrowser
        },
        // 🔥 2. Le decimos que use el Dummy solo si está en el servidor
        realtime: {
          transport: isBrowser ? undefined : (DummyWebSocket as any)
        }
      }
    );
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    if (!isPlatformBrowser(this.platformId)) return;
    return this.supabase.auth.onAuthStateChange(callback);
  }

  async signUp(email: string, password: string, metaData: Record<string, any>) {
    return await this.supabase.auth.signUp({
      email,
      password,
      options: { data: metaData }
    });
  }

  async signIn(email: string, pass: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  getSupabaseClient() {
    return this.supabase;
  }

  // Método para solicitar la recuperación de contraseña por correo
  async recuperarPassword(email: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-password`,
    });
    if (error) throw error;
    return data;
  }

  async obtenerRolUsuario(userId: string): Promise<'admin' | 'empresa' | 'transeunte' | null> {
    const supabase = this.getSupabaseClient();

    // 1. Verificar en administradores
    const { data: admin } = await supabase
      .from('administradores')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (admin) return 'admin';

    // 2. Verificar en empresas
    const { data: empresa } = await supabase
      .from('empresas')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (empresa) return 'empresa';

    // 3. Verificar en transeuntes
    const { data: transeunte } = await supabase
      .from('transeuntes')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (transeunte) return 'transeunte';

    return null;
  }
  async actualizarPassword(nuevaPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password: nuevaPassword
    });
    if (error) throw error;
    return data;
  }
}