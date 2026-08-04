import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FisioterapeutaService } from '../../../../../core/services/fisioterapeuta.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { SocketService } from '../../../../../core/services/socket.service';
import { PdfService } from '../../../../../core/services/pdf.service';

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
  dandoAlta = false;

  // Fase de Recuperacion
  faseActual: string = '';
  editandoFase: boolean = false;
  guardandoFase: boolean = false;
  faseSeleccionada: string = '';

  // Métricas de progreso
  totalEjercicios: number = 0;
  ejerciciosRealizados: number = 0;
  porcentajeCumplimiento: number = 0;
  totalSesiones: number = 10;
  ejerciciosPorSesion: number = 0;

  // Configuración del Gráfico (Bar Chart)
  public progressChartType: ChartType = 'bar';
  public progressChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public progressChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        title: {
          display: true,
          text: 'Sesiones',
          font: { weight: 'bold' }
        }
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
  finalizandoRutina: boolean = false;

  // Datos Clínicos (Inferencia)
  editandoDatosClinicos: boolean = false;
  guardandoDatosClinicos: boolean = false;
  nivelDolorSeleccionado: number = 0;
  comorbilidadesSeleccionadas: string[] = [];
  nivelActividadSeleccionada: string = 'SEDENTARIO';
  todasComorbilidades: string[] = ['CARDIACA', 'HIPERTENSION', 'DIABETES', 'OBESIDAD'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fisioService: FisioterapeutaService,
    private socketService: SocketService,
    private pdfService: PdfService
  ) { }

  ngOnInit(): void {
    this.pacienteId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarInformacionPaciente();
    this.cargarPatologiaPaciente();
    this.cargarCatalogoPatologias();
    this.cargarRutinaActiva();
    this.cargarProgreso();
    this.cargarHistorialRutinas();
  }

  cargarInformacionPaciente() {
    this.fisioService.obtenerMisPacientes().subscribe({
      next: (res: any) => {
        const pacientes = res.pacientes || res;
        this.pacienteInfo = pacientes.find((p: any) => p.id === this.pacienteId);
        if (this.pacienteInfo) {
          this.faseActual = this.pacienteInfo.fase_recuperacion || 'AGUDA';
          this.nivelDolorSeleccionado = this.pacienteInfo.nivel_dolor || 0;
          this.comorbilidadesSeleccionadas = this.pacienteInfo.comorbilidades ? (typeof this.pacienteInfo.comorbilidades === 'string' ? JSON.parse(this.pacienteInfo.comorbilidades) : this.pacienteInfo.comorbilidades) : [];
          this.nivelActividadSeleccionada = this.pacienteInfo.nivel_actividad_fisica || 'SEDENTARIO';
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
        this.socketService.enviarNotificacionLocal("Fase de Recuperación", "Ocurrió un error guardando la fase de recuperación.");
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
    if (this.patologiaActual) {
      this.patologiaSeleccionadaId = this.patologiaActual.id;
      this.terminoBusquedaPatologia = `${this.patologiaActual.nombre} (${this.patologiaActual.nivel_gravedad})`;
    } else {
      this.patologiaSeleccionadaId = '';
      this.terminoBusquedaPatologia = '';
    }
  }

  cancelarEdicionPatologia() {
    this.editandoPatologia = false;
    this.dropdownPatologiaAbierto = false;
    this.patologiaSeleccionadaId = this.patologiaActual ? this.patologiaActual.id : '';
  }

  // Para el buscador de patologías
  dropdownPatologiaAbierto: boolean = false;
  terminoBusquedaPatologia: string = '';

  get patologiasFiltradas() {
    if (!this.terminoBusquedaPatologia) return this.todasPatologias;
    const term = this.terminoBusquedaPatologia.toLowerCase().trim();
    return this.todasPatologias.filter(p => 
      p.nombre.toLowerCase().includes(term) || 
      p.nivel_gravedad.toLowerCase().includes(term)
    );
  }

  seleccionarPatologia(pat: any) {
    this.patologiaSeleccionadaId = pat.id;
    this.terminoBusquedaPatologia = `${pat.nombre} (${pat.nivel_gravedad})`;
    this.dropdownPatologiaAbierto = false;
  }

  abrirDropdownPatologia() {
    this.dropdownPatologiaAbierto = true;
    this.terminoBusquedaPatologia = ''; // Limpiar para que vea todas al abrir
  }

  guardarPatologia() {
    if (!this.patologiaSeleccionadaId) {
      this.socketService.enviarNotificacionLocal("Diagnóstico", "Por favor seleccione un diagnóstico del catálogo.");
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
        this.socketService.enviarNotificacionLocal("Diagnóstico", "Ocurrió un error guardando el diagnóstico clínico.");
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

  cargarHistorialRutinas() {
    this.fisioService.obtenerHistorialRutinas(this.pacienteId).subscribe({
      next: (res: any) => {
        this.historialRutinas = res.historial || [];
      },
      error: (err) => console.error('Error al cargar historial de rutinas', err)
    });
  }



  get haIniciadoRutina(): boolean {
    if (!this.rutina || !this.rutina.fecha_inicio) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    // Convertir fecha de inicio (ISO string o Date) a objeto Date local
    const parts = this.rutina.fecha_inicio.split('T')[0].split('-');
    const fechaInicio = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    fechaInicio.setHours(0, 0, 0, 0);
    return hoy >= fechaInicio;
  }

  finalizarPlanActivo() {
    if (!this.rutina?.id) return;
    if (confirm('¿Está seguro de que desea finalizar el plan terapéutico actual? Este se archivará en el historial.')) {
      this.finalizandoRutina = true;
      this.fisioService.finalizarRutina(this.rutina.id).subscribe({
        next: () => {
          this.finalizandoRutina = false;
          this.rutina = null;
          this.ejercicios = [];
          this.cargarHistorialRutinas(); // Recargar el historial para ver el plan finalizado
        },
        error: (err) => {
          console.error('Error al finalizar plan', err);
          this.finalizandoRutina = false;
          alert('Hubo un error al finalizar el plan.');
        }
      });
    }
  }

  eliminarPlanActivo() {
    if (!this.rutina?.id) return;
    if (confirm('¿Está seguro de que desea eliminar este plan terapéutico de forma permanente?')) {
      this.fisioService.eliminarRutina(this.rutina.id).subscribe({
        next: () => {
          this.rutina = null;
          this.ejercicios = [];
          alert('Plan eliminado exitosamente.');
        },
        error: (err) => {
          console.error('Error al eliminar plan', err);
          alert('Hubo un error al eliminar el plan.');
        }
      });
    }
  }

  verEjerciciosHistoricos(rutina: any) {
    if (this.rutinaHistoricaSeleccionada?.id === rutina.id) {
      this.rutinaHistoricaSeleccionada = null;
      this.ejerciciosHistoricos = [];
      return;
    }
    this.rutinaHistoricaSeleccionada = rutina;
    this.fisioService.obtenerEjerciciosPorRutina(rutina.id).subscribe({
      next: (res: any) => {
        this.ejerciciosHistoricos = res.data || res || [];
      },
      error: (err) => console.error('Error al cargar ejercicios históricos', err)
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
        this.totalSesiones = res.total_dias || 10; // Backend still returns total_dias key for compatibility but it's sessions now
        this.ejerciciosPorSesion = this.totalEjercicios > 0 ? (this.totalEjercicios / this.totalSesiones) : 0;

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

      const palette = [
        '#10b981', // emerald-500
        '#3b82f6', // blue-500
        '#f59e0b', // amber-500
        '#ef4444', // red-500
        '#8b5cf6', // violet-500
        '#06b6d4', // cyan-500
        '#ec4899', // pink-500
        '#f97316', // orange-500
      ];

      const bgColors = labels.map((_: any, i: number) => palette[i % palette.length]);

      this.progressChartData = {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: bgColors,
            hoverBackgroundColor: bgColors,
            borderRadius: 4
          }
        ]
      };

      // Actualizar el límite superior del eje Y al total de sesiones
      this.progressChartOptions = {
        ...this.progressChartOptions,
        scales: {
          ...this.progressChartOptions?.scales,
          y: {
            ...(this.progressChartOptions?.scales as any)?.y,
            max: this.totalSesiones > 0 ? this.totalSesiones : 10,
            ticks: {
              ...(this.progressChartOptions?.scales as any)?.y?.ticks,
              stepSize: 1,
              autoSkip: false
            }
          }
        }
      };
    }
  }

  darAlta() {
    if (!confirm('¿Está seguro de querer dar de alta a este paciente? Esto inactivará su cuenta y finalizará su tratamiento.')) return;
    this.dandoAlta = true;
    
    // Compilamos información de la rutina activa si hay
    const rutinaInfo = {
      totalDiasPlan: this.totalSesiones,
      diasCompletados: this.ejerciciosRealizados > 0 ? Math.floor(this.ejerciciosRealizados / (this.ejerciciosPorSesion || 1)) : 0,
      progresoGlobal: this.porcentajeCumplimiento
    };

    // Generar el PDF antes de limpiar los datos en BD
    this.pdfService.generarInformeDeAlta(this.pacienteInfo, this.patologiaActual, rutinaInfo, this.historialRutinas);

    this.fisioService.darAltaPaciente(this.pacienteId).subscribe({
      next: () => {
        this.dandoAlta = false;
        this.socketService.enviarNotificacionLocal('Alta Médica', 'El paciente ha sido dado de alta exitosamente y el informe PDF ha sido descargado.');
        this.router.navigate(['/fisioterapeuta/mis-pacientes']);
      },
      error: (err) => {
        console.error("Error al dar de alta", err);
        this.dandoAlta = false;
        this.socketService.enviarNotificacionLocal('Error', 'Ocurrió un error al dar de alta al paciente.');
      }
    });
  }

  activarEdicionDatosClinicos() {
    this.editandoDatosClinicos = true;
    this.nivelDolorSeleccionado = this.pacienteInfo?.nivel_dolor || 0;
    this.comorbilidadesSeleccionadas = this.pacienteInfo?.comorbilidades ? (typeof this.pacienteInfo.comorbilidades === 'string' ? JSON.parse(this.pacienteInfo.comorbilidades) : this.pacienteInfo.comorbilidades) : [];
    this.nivelActividadSeleccionada = this.pacienteInfo?.nivel_actividad_fisica || 'SEDENTARIO';
  }

  cancelarEdicionDatosClinicos() {
    this.editandoDatosClinicos = false;
  }

  toggleComorbilidad(com: string) {
    if (this.comorbilidadesSeleccionadas.includes(com)) {
      this.comorbilidadesSeleccionadas = this.comorbilidadesSeleccionadas.filter(c => c !== com);
    } else {
      this.comorbilidadesSeleccionadas.push(com);
    }
  }

  guardarDatosClinicos() {
    this.guardandoDatosClinicos = true;
    const datos = {
      nivel_dolor: this.nivelDolorSeleccionado,
      comorbilidades: this.comorbilidadesSeleccionadas,
      nivel_actividad_fisica: this.nivelActividadSeleccionada
    };
    
    this.fisioService.actualizarDatosClinicosPaciente(this.pacienteId, datos).subscribe({
      next: () => {
        this.guardandoDatosClinicos = false;
        this.editandoDatosClinicos = false;
        if (this.pacienteInfo) {
          this.pacienteInfo.nivel_dolor = this.nivelDolorSeleccionado;
          this.pacienteInfo.comorbilidades = this.comorbilidadesSeleccionadas;
          this.pacienteInfo.nivel_actividad_fisica = this.nivelActividadSeleccionada;
        }
        this.socketService.enviarNotificacionLocal('Evaluación Clínica', 'Datos clínicos actualizados con éxito.');
      },
      error: (err) => {
        console.error("Error al guardar datos clínicos", err);
        this.guardandoDatosClinicos = false;
        this.socketService.enviarNotificacionLocal("Error", "No se pudieron guardar los datos clínicos.");
      }
    });
  }
}
