import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PacienteService } from '../../../core/services/paciente.service';
import { UserService } from '../../../core/services/user.service';
import { HttpErrorResponse } from '@angular/common/http';
@Component({
  selector: 'app-mi-rutina',
  imports: [CommonModule],
  templateUrl: './mi-rutina.html',
  styleUrl: './mi-rutina.css',
})
export class MiRutina implements OnInit {

  usuario: any;
  rutina: any = null;
  ejercicios: any[] = [];
  cargando = true;
  altaExitosa = false;

  constructor(
    private pacienteService: PacienteService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    // Al cargar la vista de paciente, primero necesitamos obtener su paciente_id desde el perfil del token
    this.userService.perfil().subscribe({
      next: (res: any) => {
        this.usuario = res;
        if (this.usuario.paciente_id) {
          this.cargarMiRutina(this.usuario.paciente_id);
        } else {
          console.warn("Este usuario no tiene un paciente asociado");
          this.cargando = false;
        }
      },
      error: () => {
        console.error('No se pudo cargar el perfil');
        this.cargando = false;
      }
    });
  }

  cargarMiRutina(pacienteId: number) {
    // 1. Obtener la rutina activa para indicaciones/fechas
    this.pacienteService.obtenerMiRutinaActiva(pacienteId).subscribe({
      next: (res: any) => {
        this.rutina = res.rutina;
      },
      error: (err: HttpErrorResponse) => {
        console.warn("No se encontró rutina activa para cabecera", err);
      }
    });

    // 2. Obtener la lista acumulada de ejercicios
    this.pacienteService.obtenerMisEjerciciosAcumulados(pacienteId).subscribe({
      next: (res: any) => {
        this.ejercicios = res.map((ej: any) => ({
          ...ej,
          completadoHoy: !!ej.completadoHoy // Persistir estado real desde BD
        }));
        this.cargando = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error("Error al cargar ejercicios acumulados", err);
        this.cargando = false;
      }
    });
  }

  marcarCompletado(ejercicio: any) {
    if (ejercicio.completadoHoy) return; // Si ya se completó no hacer nada

    this.pacienteService.registrarCumplimiento(ejercicio.id).subscribe({
      next: (res: any) => {
        ejercicio.completadoHoy = true;
        if (res && res.altaMedica) {
          this.altaExitosa = true;
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error("Error al registrar cumplimiento", err);
        alert("Ocurrió un error al intentar guardar tu avance. Por favor, intenta de nuevo.");
      }
    });
  }

}
