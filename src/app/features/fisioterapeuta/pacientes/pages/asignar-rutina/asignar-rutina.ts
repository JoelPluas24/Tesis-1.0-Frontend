import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FisioterapeutaService } from '../../../../../core/services/fisioterapeuta.service';

@Component({
  selector: 'app-asignar-rutina',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './asignar-rutina.html',
  styleUrl: './asignar-rutina.css',
})
export class AsignarRutina implements OnInit {
  pacienteId!: number;
  faseRecuperacion = '';
  ejerciciosRecomendados: any[] = [];
  todosLosEjercicios: any[] = [];
  pacienteInfo: any = null;

  // Formulario General
  fechaInicio = ''; //new Date().toISOString().split('T')[0];
  fechaFin = '';
  observaciones = '';

  // Control de Ejercicios Seleccionados
  ejerciciosAgregados: any[] = [];
  ejercicioSeleccionadoId = '';
  seriesTemp = 3;
  repeticionesTemp = 10;
  frecuenciaTemp = 'Diaria';

  rutinaActualId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fisioService: FisioterapeutaService,
  ) {}

  ngOnInit(): void {
    this.pacienteId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarInformacionPaciente();
    this.cargarRecomendaciones();
    this.cargarTodosLosEjercicios();
    this.cargarRutinaActual();
    this.cargarHistorialRutinas();
  }

  cargarInformacionPaciente() {
    this.fisioService.obtenerMisPacientes().subscribe({
      next: (res: any) => {
        const pacientes = res.pacientes || res;
        this.pacienteInfo = pacientes.find((p: any) => p.id === this.pacienteId);
      },
      error: (err) => console.error("Error obteniendo detalles del paciente", err)
    });
  }

  cargarRutinaActual() {
    this.fisioService.obtenerRutinaActiva(this.pacienteId).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        if (payload.rutina) {
          this.rutinaActualId = payload.rutina.id;
          if (payload.rutina.fecha_inicio) {
            this.fechaInicio = payload.rutina.fecha_inicio.split('T')[0];
          }
          if (payload.rutina.fecha_fin) {
            this.fechaFin = payload.rutina.fecha_fin.split('T')[0];
          }
          this.observaciones = payload.rutina.observaciones || '';
        }
        if (payload.ejercicios && payload.ejercicios.length > 0) {
          // Pre-llenar la lista con lo que ya tiene
          this.ejerciciosAgregados = payload.ejercicios.map((e: any) => ({
            ejercicio_id: e.id,
            nombre: e.nombre,
            series: e.series,
            repeticiones: e.repeticiones,
            frecuencia: e.frecuencia,
          }));
        }
      },
      error: (err) => {
        // Si no hay rutina activa, no hacemos nada (404 es esperado)
        console.log('Paciente sin rutina previa activa.');
      },
    });
  }

  cargarRecomendaciones() {
    this.fisioService.obtenerEjerciciosRecomendados(this.pacienteId).subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.faseRecuperacion = payload.fase_recuperacion || 'Sin Fase';
        this.ejerciciosRecomendados = payload.ejercicios_recomendados || [];
      },
      error: (err) => {
        console.error('Error cargando recomendaciones', err);
      },
    });
  }

  cargarTodosLosEjercicios() {
    this.fisioService.obtenerTodosLosEjercicios().subscribe({
      next: (res: any) => {
        const payload = res.data || res;
        this.todosLosEjercicios = Array.isArray(payload) ? payload : [];
      },
      error: (err) => {
        console.error('Error cargando el catálogo general', err);
      },
    });
  }

  agregarEjercicio() {
    if (!this.ejercicioSeleccionadoId) {
      alert('Por favor seleccione un ejercicio');
      return;
    }

    // Buscar el objeto completo del ejercicio en recomendados o en todos
    let ejEncontrado = this.ejerciciosRecomendados.find(
      (e) => e.id === Number(this.ejercicioSeleccionadoId),
    );

    if (!ejEncontrado) {
      ejEncontrado = this.todosLosEjercicios.find(
        (e) => e.id === Number(this.ejercicioSeleccionadoId),
      );
    }

    // Evitar duplicados
    const yaExiste = this.ejerciciosAgregados.find((e) => e.ejercicio_id === ejEncontrado.id);
    if (yaExiste) {
      alert('Este ejercicio ya fue agregado a la rutina');
      return;
    }

    this.ejerciciosAgregados.push({
      ejercicio_id: ejEncontrado.id,
      nombre: ejEncontrado.nombre,
      series: this.seriesTemp,
      repeticiones: this.repeticionesTemp,
      frecuencia: this.frecuenciaTemp,
    });

    // Resetear formulario de ejercicio
    this.ejercicioSeleccionadoId = '';
    this.seriesTemp = 3;
    this.repeticionesTemp = 10;
    this.frecuenciaTemp = 'Diaria';
  }

  quitarEjercicio(index: number) {
    this.ejerciciosAgregados.splice(index, 1);
  }

  guardarRutina() {
    if (this.ejerciciosAgregados.length === 0) {
      alert('La rutina debe tener al menos un ejercicio');
      return;
    }
    if (!this.fechaInicio) {
      alert('Debe indicar la fecha de inicio');
      return;
    }
    if (!this.fechaFin) {
      alert('Debe indicar la fecha de fin');
      return;
    }

    const payload = {
      paciente_id: this.pacienteId,
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin,
      observaciones: this.observaciones,
      // Al backend solo se le envía los datos necesarios, no el nombre text
      ejercicios: this.ejerciciosAgregados.map((e) => ({
        ejercicio_id: e.ejercicio_id,
        series: e.series,
        repeticiones: e.repeticiones,
        frecuencia: e.frecuencia,
      })),
    };

    if (this.rutinaActualId) {
      this.fisioService.editarRutina(this.rutinaActualId, payload).subscribe({
        next: () => {
          alert('Rutina actualizada exitosamente');
          this.router.navigate(['/fisioterapeuta/pacientes', this.pacienteId]);
        },
        error: (err) => {
          console.error('Error editando rutina', err);
          alert('Ocurrió un error al actualizar la rutina');
        },
      });
    } else {
      this.fisioService.crearRutina(payload).subscribe({
        next: () => {
          alert('Rutina asignada exitosamente');
          this.router.navigate(['/fisioterapeuta/pacientes', this.pacienteId]);
        },
        error: (err) => {
          console.error('Error creando rutina', err);
          alert('Ocurrió un error al asignar la rutina');
        },
      });
    }
  }

  eliminarRutina() {
    if (!this.rutinaActualId) return;
    if (!confirm('¿Está seguro que desea eliminar esta rutina de forma permanente?')) return;

    this.fisioService.eliminarRutina(this.rutinaActualId).subscribe({
      next: () => {
        alert('Rutina eliminada exitosamente');
        this.router.navigate(['/fisioterapeuta/pacientes', this.pacienteId]);
      },
      error: (err) => {
        console.error('Error eliminando rutina', err);
        alert('Ocurrió un error al eliminar la rutina');
      }
    });
  }

  // Historial de Rutinas Pasadas
  historialRutinas: any[] = [];
  rutinaHistoricaSeleccionada: any = null;
  ejerciciosHistoricos: any[] = [];

  cargarHistorialRutinas() {
    this.fisioService.obtenerHistorialRutinas(this.pacienteId).subscribe({
      next: (res: any) => {
        // Filter out active routines to only show past ones in history
        this.historialRutinas = (res.data?.historial || res.historial || []).filter((r: any) => r.activa === 0);
      },
      error: (err) => console.error("Error cargando historial de rutinas", err)
    });
  }

  verDetallesHistoricos(rutina: any) {
    if (this.rutinaHistoricaSeleccionada?.id === rutina.id) {
       // Toggle off
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
