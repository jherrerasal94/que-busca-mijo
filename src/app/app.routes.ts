import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },       // Página principal
  { path: 'login', component: LoginComponent },   // Página de Login
  { path: 'register', component: RegisterComponent }, // Página de Registro
  { path: '**', redirectTo: '' }               // Cualquier ruta no encontrada redirige al Inicio
];
