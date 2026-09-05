import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { GestionPublicacionesComponent } from './pages/gestion-publicaciones/gestion-publicaciones.component';
import { AuthGuards } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },               // Página principal
  { path: 'login', component: LoginComponent },           // Página de Login
  { path: 'register', component: RegisterComponent },     // Página de Registro
  
  // Rutas Protegidas
  { 
    path: 'perfil', 
    component: PerfilComponent, 
    canActivate: [AuthGuards.isAuthenticated]           // 🔒 Requiere iniciar sesión
  }, 
  { 
    path: 'mis-publicaciones', 
    component: GestionPublicacionesComponent, 
    canActivate: [AuthGuards.isEmpresa]                 // 🔒 Exclusivo para Empresas
  }, 

  { path: '**', redirectTo: '' }                       // Redirección de fallback
];