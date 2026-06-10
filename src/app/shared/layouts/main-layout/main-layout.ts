import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { SocketService } from '../../../core/services/socket.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive, FormsModule],
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
  mostrarNotificacionesDropdown = false;
  notificacionSeleccionada: any = null;
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

    const stored = localStorage.getItem('rehabsoft_notifications');
    if (stored) {
      try {
        this.notificaciones = JSON.parse(stored);
      } catch (e) {
        this.notificaciones = [];
      }
    }

    this.socketSub = this.socketService.notifications$.subscribe(data => {
      const nuevaNotif = {
        ...data,
        leida: false,
        id: data.id || Date.now() + Math.random().toString(36).substr(2, 9)
      };
      this.notificaciones.unshift(nuevaNotif);
      this.guardarNotificaciones();
      this.mostrarNotificacionToast(nuevaNotif);
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

  // Métodos de Notificaciones
  toggleNotificacionesDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.mostrarNotificacionesDropdown = !this.mostrarNotificacionesDropdown;
  }

  cerrarNotificacionesDropdown() {
    this.mostrarNotificacionesDropdown = false;
  }

  abrirNotificacion(notif: any, event: MouseEvent) {
    event.stopPropagation();
    notif.leida = true;
    this.notificacionSeleccionada = notif;
    this.guardarNotificaciones();
    this.cerrarNotificacionesDropdown();
  }

  cerrarNotificacionModal() {
    this.notificacionSeleccionada = null;
  }

  eliminarNotificacion(index: number, event: MouseEvent) {
    event.stopPropagation();
    this.notificaciones.splice(index, 1);
    this.guardarNotificaciones();
  }

  limpiarTodas(event: MouseEvent) {
    event.stopPropagation();
    this.notificaciones = [];
    this.guardarNotificaciones();
  }

  guardarNotificaciones() {
    localStorage.setItem('rehabsoft_notifications', JSON.stringify(this.notificaciones));
  }

}
