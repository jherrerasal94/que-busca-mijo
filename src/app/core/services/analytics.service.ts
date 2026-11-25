import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

// Los 8 eventos que pedía el brief original (sección 18): búsquedas,
// productos vistos, negocios vistos, clics en WhatsApp, registros,
// creación de empresas, creación de publicaciones, conversión a plan pago.
export type TipoEventoAnalytics =
  | 'busqueda'
  | 'vista_producto'
  | 'vista_empresa'
  | 'clic_whatsapp'
  | 'registro'
  | 'creacion_empresa'
  | 'creacion_publicacion'
  | 'conversion_plan';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private authService = inject(AuthService);

  async registrarEvento(tipo: TipoEventoAnalytics, metadata: Record<string, any> = {}): Promise<void> {
    try {
      const user = await this.authService.getUser();

      await this.authService.getSupabaseClient()
        .from('eventos_analytics')
        .insert({
          tipo_evento: tipo,
          usuario_id: user?.id || null,
          metadata
        });
    } catch (err) {
      // Un evento de analytics que falla NUNCA debe romper la experiencia
      // del usuario -- se registra en consola y se sigue de largo.
      console.warn('No se pudo registrar el evento de analytics:', tipo, err);
    }
  }
}