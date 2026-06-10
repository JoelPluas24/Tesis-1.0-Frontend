import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../../../core/services/admin.service';
import { SocketService } from '../../../../../core/services/socket.service';

@Component({
  selector: 'app-ejercicio-form',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './form.html',
  styleUrl: './form.css',
})
export class Form implements OnInit {
  id: number | null = null;
  ejercicio: any = {
    nombre: '',
    descripcion: '',
    indicaciones: '',
    contraindicaciones: '',
    nivel_dificultad: 'BAJO',
    video_url: ''
  };

  cargando = false;
  guardando = false;

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService
  ) { }

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('id');

    if (paramId) {
      this.id = Number(paramId);
      this.cargarEjercicio();
    }
  }

  cargarEjercicio() {
    this.cargando = true;
    this.adminService.obtenerEjercicio(this.id!).subscribe({
      next: (data: any) => {
        this.ejercicio = Array.isArray(data) ? (data[0] || this.ejercicio) : data;
        this.cargando = false;
      },
      error: (err) => {
        console.error("Error al cargar ejercicio", err);
        this.cargando = false;
        this.socketService.enviarNotificacionLocal("Error", "Ocurrió un error cargando el ejercicio seleccionado.");
      }
    });
  }

  guardar() {
    if (!this.ejercicio.nombre) {
      this.socketService.enviarNotificacionLocal("Ejercicio", "El nombre del ejercicio es obligatorio.");
      return;
    }

    this.guardando = true;

    if (this.id) {
      this.adminService.actualizarEjercicio(this.id, this.ejercicio).subscribe({
        next: () => {
          this.guardando = false;
          this.router.navigate(['/admin/ejercicios']);
        },
        error: (err) => {
          console.error("Error al actualizar", err);
          this.socketService.enviarNotificacionLocal("Error", "Ocurrió un error al actualizar el ejercicio.");
          this.guardando = false;
        }
      });
    } else {
      this.adminService.crearEjercicio(this.ejercicio).subscribe({
        next: () => {
          this.guardando = false;
          this.router.navigate(['/admin/ejercicios']);
        },
        error: (err) => {
          console.error("Error al crear", err);
          this.socketService.enviarNotificacionLocal("Error", "Ocurrió un error al crear el ejercicio.");
          this.guardando = false;
        }
      });
    }
  }
}
