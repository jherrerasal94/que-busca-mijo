import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

export interface RedSocial {
  id: string;
  empresa_id: string;
  plataforma?: string | null;
  plataforma_id?: string | null;
  url: string;
}

export interface PublicacionConEmpresa {
  id: string;
  empresa_id: string;
  categoria_id: string | null;
  servicio_producto: string;
  precio: number | null;
  descripcion: string | null;
  foto_1: string | null;
  foto_2: string | null;
  foto_3: string | null;
  created_at: string;
  empresa?: {
    nombre?: string;
    direccion?: string;
    logo?: string | null;
    ciudad_id?: string;
    redes_sociales?: RedSocial[];
    ciudad?: {
      id?: string;
      nombre?: string;
      departamento?: {
        id?: string;
        nombre?: string;
        pais?: {
          id?: string;
          nombre?: string;
        };
      };
    };
  };
}

export interface Categoria {
  id: string;
  nombre: string;
  icono?: string;
  estado: string;
}

export interface Pais {
  id: string;
  nombre: string;
}

export interface Departamento {
  id: string;
  pais_id: string;
  nombre: string;
}

export interface Ciudad {
  id: string;
  departamento_id: string;
  nombre: string;
}

export interface FiltrosPublicaciones {
  query?: string;
  categoriaId?: string | null;
  paisId?: string;
  departamentoId?: string;
  ciudadId?: string;
}

export type OrdenPublicaciones = 'relevancia' | 'recientes';

// ID de la plataforma "WhatsApp Business" en la tabla plataformas_sociales
const PLATAFORMA_WHATSAPP_ID = '4e35d5d5-8d91-4131-8b04-dc44b5195527';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private authService = inject(AuthService);

  async cargarCatalogosGeograficos(): Promise<{ paises: Pais[]; departamentos: Departamento[]; ciudades: Ciudad[] }> {
    const supabase = this.authService.getSupabaseClient();

    const resPaises = await supabase.from('paises').select('id, nombre').order('nombre');
    const resDepts = await supabase.from('departamentos').select('id, pais_id, nombre').order('nombre');
    const resCiudades = await supabase.from('ciudades').select('id, departamento_id, nombre').order('nombre');

    return {
      paises: resPaises.data || [],
      departamentos: resDepts.data || [],
      ciudades: resCiudades.data || []
    };
  }

  async cargarCategorias(): Promise<Categoria[]> {
    const { data } = await this.authService.getSupabaseClient()
      .from('categorias')
      .select('id, nombre, icono, estado')
      .eq('estado', 'activo')
      .order('nombre', { ascending: true });

    return (data as Categoria[]) || [];
  }

  async cargarPublicaciones(): Promise<PublicacionConEmpresa[]> {
    const { data, error } = await this.authService.getSupabaseClient()
      .from('publicaciones')
      .select(`
        *,
        empresa:empresas (
          nombre,
          direccion,
          logo,
          ciudad_id,
          redes_sociales (
            url,
            plataforma,
            plataforma_id
          ),
          ciudad:ciudades (
            id,
            nombre,
            departamento:departamentos (
              id,
              nombre,
              pais:paises (
                id,
                nombre
              )
            )
          )
        )
      `)
      .eq('estado', 'activo')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar publicaciones con ubicación de empresa:', error);
      return [];
    }

    return (data as PublicacionConEmpresa[]) || [];
  }

  // Filtro puro, sin efectos secundarios: lo usan tanto Home (preview en vivo)
  // como Resultados (página completa), así no hay dos implementaciones del
  // mismo criterio de búsqueda que puedan desincronizarse.
  filtrar(lista: PublicacionConEmpresa[], filtros: FiltrosPublicaciones): PublicacionConEmpresa[] {
    const query = (filtros.query || '').toLowerCase().trim();

    return lista.filter(pub => {
      const cumpleQuery = !query ||
        pub.servicio_producto.toLowerCase().includes(query) ||
        (pub.descripcion && pub.descripcion.toLowerCase().includes(query)) ||
        (pub.empresa?.nombre && pub.empresa.nombre.toLowerCase().includes(query)) ||
        (pub.empresa?.ciudad?.nombre && pub.empresa.ciudad.nombre.toLowerCase().includes(query));

      const cumpleCategoria = !filtros.categoriaId || pub.categoria_id === filtros.categoriaId;

      const ciudadObj = pub.empresa?.ciudad;
      const deptoObj = ciudadObj?.departamento;
      const paisObj = deptoObj?.pais;

      const cumplePais = !filtros.paisId || paisObj?.id === filtros.paisId;
      const cumpleDepto = !filtros.departamentoId || deptoObj?.id === filtros.departamentoId;
      const cumpleCiudad = !filtros.ciudadId || ciudadObj?.id === filtros.ciudadId;

      return cumpleQuery && cumpleCategoria && cumplePais && cumpleDepto && cumpleCiudad;
    });
  }

  // "Relevancia" aquí es una puntuación simple por coincidencia de texto
  // (no hay motor de búsqueda semántica aún, tal como pide el brief: primero
  // una búsqueda tradicional sólida). Sin query de texto, cae a "recientes".
  ordenar(lista: PublicacionConEmpresa[], orden: OrdenPublicaciones, query?: string): PublicacionConEmpresa[] {
    if (orden === 'relevancia' && query && query.trim()) {
      const q = query.toLowerCase().trim();
      const puntaje = (pub: PublicacionConEmpresa): number => {
        let score = 0;
        if (pub.servicio_producto.toLowerCase().includes(q)) score += 3;
        if (pub.descripcion?.toLowerCase().includes(q)) score += 1;
        if (pub.empresa?.nombre?.toLowerCase().includes(q)) score += 1;
        if (pub.empresa?.ciudad?.nombre?.toLowerCase().includes(q)) score += 1;
        return score;
      };

      return [...lista].sort((a, b) => {
        const diff = puntaje(b) - puntaje(a);
        if (diff !== 0) return diff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    // 'recientes', o 'relevancia' sin texto de búsqueda: por fecha de creación.
    return [...lista].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  obtenerNombreCategoria(categorias: Categoria[], categoriaId: string): string {
    const cat = categorias.find(c => c.id === categoriaId);
    return cat ? `${cat.icono || ''} ${cat.nombre}` : 'Categoría';
  }

  obtenerUbicacionTexto(pub: PublicacionConEmpresa): string {
    const partes = [
      pub.empresa?.ciudad?.nombre,
      pub.empresa?.ciudad?.departamento?.nombre,
      pub.empresa?.ciudad?.departamento?.pais?.nombre
    ].filter((parte): parte is string => !!parte);

    return partes.length ? partes.join(', ') : 'Ubicación no especificada';
  }

  obtenerLinkWhatsapp(pub: PublicacionConEmpresa): string | null {
    const redes = pub.empresa?.redes_sociales || [];

    const redWhatsapp = redes.find(r =>
      r.plataforma_id === PLATAFORMA_WHATSAPP_ID ||
      (r.plataforma || '').toLowerCase().includes('whatsapp')
    );

    if (!redWhatsapp?.url) return null;

    const valor = redWhatsapp.url.trim();

    if (/^https?:\/\//i.test(valor)) {
      return valor;
    }

    let numero = valor.replace(/\D/g, '');
    if (!numero) return null;

    if (numero.length <= 10) {
      numero = '57' + numero;
    }

    const mensaje = encodeURIComponent(
      `Hola, vi tu publicación "${pub.servicio_producto}" en Qué Busca Mijo y quisiera más información.`
    );
    return `https://wa.me/${numero}?text=${mensaje}`;
  }
}