import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { SocketService } from '../../../core/services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  imports: [RouterLink, RouterOutlet, RouterLinkActive, FormsModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout implements OnInit, OnDestroy {

  usuario: any;
  sidebarOpen = false;
  
  // Notificaciones
  notificaciones: any[] = [];
  mostrarToast = false;
  toastData: any = null;
  private socketSub: Subscription | undefined;
  private routerSub: Subscription | undefined;

  // Modal Cambiar Password
  mostrarModalPassword = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  passwordSuccess = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private userService: UserService,
    private socketService: SocketService
  ) { }

  ngOnInit(): void {
    this.userService.perfil().subscribe({
      next: (res: any) => {
        this.usuario = res;
        this.socketService.connect(this.usuario.id);
      },
      error: (err) => {
        console.error("Error al obtener el perfil", err);
      }
    });

    this.socketSub = this.socketService.notifications$.subscribe(data => {
      this.notificaciones.unshift(data);
      this.mostrarNotificacionToast(data);
    });

    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.sidebarOpen = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
    this.socketService.disconnect();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  mostrarNotificacionToast(data: any) {
    this.toastData = data;
    this.mostrarToast = true;
    setTimeout(() => {
      this.mostrarToast = false;
    }, 5000);
  }

  abrirModalPassword() {
    this.mostrarModalPassword = true;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError = '';
    this.passwordSuccess = '';
  }

  cerrarModalPassword() {
    this.mostrarModalPassword = false;
  }

  cambiarPassword() {
    this.passwordError = '';
    this.passwordSuccess = '';

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Las contraseñas nuevas no coinciden.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.passwordError = 'La nueva contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.userService.cambiarPassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.passwordSuccess = 'Contraseña actualizada correctamente.';
        setTimeout(() => this.cerrarModalPassword(), 2000);
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'Error al cambiar la contraseña';
      }
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

}
