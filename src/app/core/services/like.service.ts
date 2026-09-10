import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service'; // Ajusta esta ruta según dónde tengas tu AuthService

@Injectable({
  providedIn: 'root'
})
export class LikeService {
  private authService = inject(AuthService);

  /**
   * Verifica si un transeúnte específico ya le dio "Me gusta" a una publicación.
   */
  async verificarSiDioLike(publicacionId: string, transeunteId: string): Promise<boolean> {
    try {
      const supabase = this.authService.getSupabaseClient();
      const { data, error } = await supabase
        .from('likes_publicacion')
        .select('*')
        .eq('publicacion_id', publicacionId)
        .eq('transeunte_id', transeunteId)
        .maybeSingle();

      if (error) {
        console.error('Error al verificar like:', error);
        return false;
      }
      return !!data;
    } catch (err) {
      console.error('Excepción al verificar like:', err);
      return false;
    }
  }

  /**
   * Alterna el estado del "Me gusta" (Inserta si no existe, borra si ya existe).
   */
  async toggleLike(publicacionId: string, transeunteId: string, yaDioLike: boolean): Promise<boolean> {
    const supabase = this.authService.getSupabaseClient();

    if (yaDioLike) {
      const { error } = await supabase
        .from('likes_publicacion')
        .delete()
        .eq('publicacion_id', publicacionId)
        .eq('transeunte_id', transeunteId);

      if (error) throw error;
      return false; // Ahora está sin like
    } else {
      const { error } = await supabase
        .from('likes_publicacion')
        .insert({
          publicacion_id: publicacionId,
          transeunte_id: transeunteId
        });

      if (error) throw error;
      return true; // Ahora tiene like
    }
  }

  /**
   * Obtiene el número total de likes de una publicación.
   */
  async contarLikes(publicacionId: string): Promise<number> {
    try {
      const supabase = this.authService.getSupabaseClient();
      const { count, error } = await supabase
        .from('likes_publicacion')
        .select('*', { count: 'exact', head: true })
        .eq('publicacion_id', publicacionId);

      if (error) {
        console.error('Error al contar likes:', error);
        return 0;
      }
      return count || 0;
    } catch (err) {
      console.error('Excepción al contar likes:', err);
      return 0;
    }
  }
}