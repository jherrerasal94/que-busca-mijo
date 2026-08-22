import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <!-- Navbar Global único -->
    <app-navbar />

    <!-- Las vistas (Home, Login, Register) se cargan aquí -->
    <router-outlet />
  `
})
export class AppComponent {}