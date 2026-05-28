import { Component, OnInit } from '@angular/core';
import { FisioterapeutaService } from '../../../../../core/services/fisioterapeuta.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mis-pacientes',
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-pacientes.html',
  styleUrl: './mis-pacientes.css',
})
export class MisPacientes implements OnInit {
  pacientes: any[] = [];
  
  // Modal de Historial Clínico
  showModal: boolean = false;
  pacienteSeleccionado: any = null;
  historialRutinas: any[] = [];
  rutinaHistoricaSeleccionada: any = null;
  ejerciciosHistoricos: any[] = [];
  patologiaActual: any = null;

  constructor(private fisioService: FisioterapeutaService) { }

  ngOnInit(): void {
    this.fisioService.obtenerMisPacientes().subscribe({
      next: (res: any) => {
        this.pacientes = res.pacientes;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  abrirHistorial(paciente: any) {
    this.pacienteSeleccionado = paciente;
    this.showModal = true;
    this.historialRutinas = [];

    // Obtener rutinas históricas
    this.fisioService.obtenerHistorialRutinas(paciente.id).subscribe({
      next: (res: any) => {
        this.historialRutinas = (res.data?.historial || res.historial || []).filter((r: any) => r.activa === 0);
      },
      error: (err) => console.error("Error cargando historial de rutinas", err)
    });
  }

  cerrarHistorial() {
    this.showModal = false;
    this.pacienteSeleccionado = null;
    this.rutinaHistoricaSeleccionada = null;
    this.ejerciciosHistoricos = [];
  }

  verDetallesHistoricos(rutina: any) {
    if (this.rutinaHistoricaSeleccionada?.id === rutina.id) {
       this.rutinaHistoricaSeleccionada = null;
       this.ejerciciosHistoricos = [];
       return;
    }
    this.rutinaHistoricaSeleccionada = rutina;
    this.fisioService.obtenerEjerciciosPorRutina(rutina.id).subscribe({
      next: (res: any) => {
        this.ejerciciosHistoricos = res.data || res;
      },
      error: (err) => console.error("Error obteniendo ejercicios históricos", err)
    });
  }
}
