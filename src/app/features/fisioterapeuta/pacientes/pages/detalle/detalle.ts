import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FisioterapeutaService } from '../../../../../core/services/fisioterapeuta.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BaseChartDirective],
  templateUrl: './detalle.html',
  styleUrl: './detalle.css',
})
export class DetallePaciente implements OnInit {

  pacienteId!: number;
  rutina: any = null;
  ejercicios: any[] = [];
  progreso: any[] = [];
  pacienteInfo: any = null;

  // Fase de Recuperacion
  faseActual: string = '';
  editandoFase: boolean = false;
  guardandoFase: boolean = false;
  faseSeleccionada: string = '';

  // Métricas de progreso
  totalEjercicios: number = 0;
  ejerciciosRealizados: number = 0;
  porcentajeCumplimiento: number = 0;
  totalDias: number = 1;
  ejerciciosDiarios: number = 0;

  // Configuración del Gráfico (Bar Chart)
  public progressChartType: ChartType = 'bar';
  public progressChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public progressChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  // Patologías
  patologiaActual: any = null;
  todasPatologias: any[] = [];
  editandoPatologia: boolean = false;
  guardandoPatologia: boolean = false;
  patologiaSeleccionadaId: number | '' = '';

  // Historial de Rutinas
  historialRutinas: any[] = [];
  rutinaHistoricaSeleccionada: any = null;
  ejerciciosHistoricos: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private fisioService: FisioterapeutaService
  ) { }

  ngOnInit(): void {
    this.pacienteId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarInformacionPaciente();
    this.cargarPatologiaPaciente();
    this.cargarCatalogoPatologias();
    this.cargarRutinaActiva();
    this.cargarProgreso();
  }

  cargarInformacionPaciente() {
    this.fisioService.obtenerMisPacientes().subscribe({
      next: (res: any) => {
        const pacientes = res.pacientes || res;
        this.pacienteInfo = pacientes.find((p: any) => p.id === this.pacienteId);
        if (this.pacienteInfo) {
          this.faseActual = this.pacienteInfo.fase_recuperacion || 'AGUDA';
        }
      },
      error: (err) => console.error("Error obteniendo detalles del paciente", err)
    });
  }

  activarEdicionFase() {
    this.editandoFase = true;
    this.faseSeleccionada = this.faseActual;
  }

  cancelarEdicionFase() {
    this.editandoFase = false;
  }

  guardarFase() {
    if (!this.faseSeleccionada) return;
    this.guardandoFase = true;
    this.fisioService.asignarFasePaciente(this.pacienteId, this.faseSeleccionada).subscribe({
      next: () => {
        this.faseActual = this.faseSeleccionada;
        this.guardandoFase = false;
        this.editandoFase = false;
        if (this.pacienteInfo) {
          this.pacienteInfo.fase_recuperacion = this.faseSeleccionada;
        }
      },
      error: (err) => {
        console.error("Error al actualizar fase", err);
        this.guardandoFase = false;
        alert("Ocurrió un error guardando la fase de recuperación.");
      }
    });
  }

  cargarPatologiaPaciente() {
    this.fisioService.obtenerPatologiasPaciente(this.pacienteId).subscribe({
      next: (res: any) => {
        if (res && res.length > 0) {
          this.patologiaActual = res[0]; // Asumimos 1 patología principal por ahora
          this.patologiaSeleccionadaId = this.patologiaActual.id;
        } else {
          this.patologiaActual = null;
          this.patologiaSeleccionadaId = '';
        }
      },
      error: (err) => console.error("Error al cargar patología del paciente", err)
    });
  }

  cargarCatalogoPatologias() {
    this.fisioService.obtenerPatologiasBase().subscribe({
      next: (res: any) => {
        this.todasPatologias = res;
      },
      error: (err) => console.error("Error al cargar catálogo de patologías", err)
    });
  }

  activarEdicionPatologia() {
    this.editandoPatologia = true;
  }

  cancelarEdicionPatologia() {
    this.editandoPatologia = false;
    this.patologiaSeleccionadaId = this.patologiaActual ? this.patologiaActual.id : '';
  }

  guardarPatologia() {
    if (!this.patologiaSeleccionadaId) {
      alert("Por favor seleccione un diagnóstico del catálogo.");
      return;
    }
    this.guardandoPatologia = true;
    this.fisioService.asignarPatologiasPaciente(this.pacienteId, [Number(this.patologiaSeleccionadaId)]).subscribe({
      next: () => {
        this.guardandoPatologia = false;
        this.editandoPatologia = false;
        this.cargarPatologiaPaciente();
      },
      error: (err) => {
        console.error("Error al asignar", err);
        this.guardandoPatologia = false;
        alert("Ocurrió un error guardando el diagnóstico clínico.");
      }
    });
  }

  cargarRutinaActiva() {
    // 1. Obtener la rutina activa (para fecha e indicaciones)
    this.fisioService.obtenerRutinaActiva(this.pacienteId).subscribe({
      next: (res: any) => {
        this.rutina = res.rutina;
      },
      error: (err) => {
        console.warn("El paciente no tiene rutina activa actualmente.", err);
        this.rutina = null;
      }
    });

    // 2. Obtener TODOS los ejercicios asignados (acumulativo)
    this.fisioService.obtenerEjerciciosTotalesPaciente(this.pacienteId).subscribe({
      next: (res: any) => {
        this.ejercicios = res;
      },
      error: (err) => {
        console.error("Error al cargar ejercicios acumulados", err);
      }
    });
  }

  cargarProgreso() {
    this.fisioService.obtenerProgreso(this.pacienteId).subscribe({
      next: (res: any) => {
        this.progreso = res.progreso;
        this.totalEjercicios = res.total_ejercicios || 0;
        this.ejerciciosRealizados = res.ejercicios_realizados || 0;
        this.porcentajeCumplimiento = res.porcentaje_cumplimiento || 0;
        
        // Información adicional para el cálculo
        this.totalDias = res.total_dias || 1;
        this.ejerciciosDiarios = this.totalEjercicios > 0 ? (this.totalEjercicios / this.totalDias) : 0;

        this.setupChartData();
      },
      error: (err) => {
        console.error("Error al cargar progreso", err);
      }
    });
  }

  setupChartData() {
    if (this.progreso && this.progreso.length > 0) {
      const labels = this.progreso.map((p: any) => p.nombre);
      const data = this.progreso.map((p: any) => p.veces_realizado);

      this.progressChartData = {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: '#10b981', // green-500
            hoverBackgroundColor: '#059669', // green-600
            borderRadius: 4
          }
        ]
      };
    }
  }

}
