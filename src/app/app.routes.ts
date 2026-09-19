import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { GestionPublicacionesComponent } from './pages/gestion-publicaciones/gestion-publicaciones.component';
import { AuthGuards } from './core/guards/auth.guard';
import { PlanesComponent } from './pages/planes/planes.component';
import { AdquirirPlanComponent } from './pages/adquirir-plan/adquirir-plan.component';
import { GestionarPlanesComponent } from './pages/gestionar-planes/gestionar-planes.component';
import { GestionCategoriasComponent } from './admin/gestion-categorias/gestion-categorias.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },                  // Página principal
  { path: 'login', component: LoginComponent },            // Página de Login
  { path: 'register', component: RegisterComponent },      // Página de Registro
  { path: 'planes', component: PlanesComponent },          // Página de Planes
  { path: 'adquirir-plan', component: AdquirirPlanComponent }, // Adquirir Plan
  { path: 'admin-planes', component: GestionarPlanesComponent }, // Gestión Admin de Planes

  // Rutas Protegidas
  {
    path: 'perfil',
    component: PerfilComponent,
    canActivate: [AuthGuards.isAuthenticated]               // 🔒 Requiere iniciar sesión
  },
  {
    path: 'mis-publicaciones',
    component: GestionPublicacionesComponent,
    canActivate: [AuthGuards.isEmpresa]                    // 🔒 Exclusivo para Empresas
  },
  {
    path: 'admin/categorias',
    component: GestionCategoriasComponent,
    canActivate: [AuthGuards.isAdmin]                      // 🔒 Exclusivo para Administradores (ajusta si tu guard tiene otro nombre)
  },

  { path: '**', redirectTo: '' }                           // Redirección de fallback
];