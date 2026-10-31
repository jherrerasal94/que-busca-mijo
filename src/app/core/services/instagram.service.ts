import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InstagramService {
  private http = inject(HttpClient);
  
  // Endpoint oficial de la Graph API para obtener las publicaciones multimedia y sus campos clave
  private apiUrl = `https://graph.facebook.com/v20.0/${environment.instagramUserId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${environment.instagramToken}`;

  getInstagramFeed(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}