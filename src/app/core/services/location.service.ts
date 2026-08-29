import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface Pais {
  id: string;
  nombre: string;
}

export interface Departamento {
  id: string;
  nombre: string;
  pais_id: string;
}

export interface Ciudad {
  id: string;
  nombre: string;
  departamento_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private authService = inject(AuthService);
  private get supabase() {
    return this.authService.getSupabaseClient();
  }

  /* Obtener todos los países */
  async getPaises(): Promise<Pais[]> {
    const { data, error } = await this.supabase
      .from('paises')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al cargar países:', error.message);
      return [];
    }
    return data || [];
  }

  /* Obtener departamentos filtrados por País */
  async getDepartamentosByPais(paisId: string): Promise<Departamento[]> {
    if (!paisId) return [];

    const { data, error } = await this.supabase
      .from('departamentos')
      .select('id, nombre, pais_id')
      .eq('pais_id', paisId)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al cargar departamentos:', error.message);
      return [];
    }
    return data || [];
  }

  /* Obtener ciudades filtradas por Departamento */
  async getCiudadesByDepartamento(departamentoId: string): Promise<Ciudad[]> {
    if (!departamentoId) return [];

    const { data, error } = await this.supabase
      .from('ciudades')
      .select('id, nombre, departamento_id')
      .eq('departamento_id', departamentoId)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al cargar ciudades:', error.message);
      return [];
    }
    return data || [];
  }
}