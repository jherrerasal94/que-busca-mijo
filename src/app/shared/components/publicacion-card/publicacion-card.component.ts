import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LikeService } from '../../../core/services/like.service'; // Ajusta la ruta a tu service de likes

@Component({
  selector: 'app-publicacion-card',
  standalone: true, // Si usas componentes standalone en Angular
  imports: [CommonModule],
  templateUrl: './publicacion-card.component.html',
  styleUrls: ['./publicacion-card.component.css']
})
export class PublicacionCardComponent implements OnInit {
  private likeService = inject(LikeService);

  @Input() publicacion: any;          // Objeto con los datos de la publicación
  @Input() transeunteId: string = ''; // ID del transeúnte actual logueado

  hasLiked: boolean = false;
  totalLikes: number = 0;
  cargandoLike = false;

  async ngOnInit() {
    if (this.publicacion?.id && this.transeunteId) {
      // 1. Contar los likes totales de la publicación
      this.totalLikes = await this.likeService.contarLikes(this.publicacion.id);
      
      // 2. Verificar si este usuario ya le dio like anteriormente
      this.hasLiked = await this.likeService.verificarSiDioLike(this.publicacion.id, this.transeunteId);
    }
  }

  async onToggleLike() {
    if (!this.transeunteId) {
      console.warn('Inicia sesión para dar me gusta.');
      return;
    }

    if (this.cargandoLike) return; // Evita clics repetidos mientras procesa
    this.cargandoLike = true;

    try {
      // Alterna en Supabase y devuelve el nuevo estado (true/false)
      this.hasLiked = await this.likeService.toggleLike(
        this.publicacion.id, 
        this.transeunteId, 
        this.hasLiked
      );

      // Actualiza el contador local al instante
      this.totalLikes = this.hasLiked ? this.totalLikes + 1 : this.totalLikes - 1;
    } catch (error) {
      console.error('Error al dar like:', error);
    } finally {
      this.cargandoLike = false;
    }
  }
}