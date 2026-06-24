import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FisioterapeutaService } from '../../../../../core/services/fisioterapeuta.service';
import { SocketService } from '../../../../../core/services/socket.service';

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
  hoy = new Date().toISOString().split('T')[0];

  // Explicación de Inferencia
  mostrarModalExplicacion: boolean = false;
  reglasExplicacion: { titulo: string, descripcion: string }[] = [];

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
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.pacienteId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarInformacionPaciente();
    this.cargarRecomendaciones();
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
        const reglasObj = payload.reglas_aplicadas || {};
        
        const descripcionesReglas: any = {
          'edad_avanzada': { titulo: 'EDAD AVANZADA', descripcion: 'El paciente es mayor a 60 años. Se excluyeron ejercicios con impacto articular y de alta dificultad para proteger la integridad ósea y articular.' },
          'fase_aguda': { titulo: 'FASE AGUDA', descripcion: 'El paciente está en fase AGUDA. Se limitó el catálogo a ejercicios de tipo Movilidad y Estiramiento, sin carga ni impacto articular, ordenados de menor a mayor dificultad.' },
          'nivel_dolor_alto': { titulo: 'NIVEL DOLOR ALTO', descripcion: 'El paciente reportó dolor severo (≥ 6). Se restringió a ejercicios de tipo Movilidad o Estiramiento que no requieran carga física.' },
          'comorbilidad_cardiaca': { titulo: 'COMORBILIDAD CARDIACA', descripcion: 'El paciente tiene comorbilidades cardíacas o hipertensión. Se excluyeron ejercicios que requieran carga y los de dificultad alta para evitar esfuerzo cardiovascular excesivo.' },
          'fase_fortalecimiento': { titulo: 'FASE FORTALECIMIENTO', descripcion: 'El paciente está en fase de FORTALECIMIENTO. Se permiten todos los tipos de ejercicios (incluidos con carga e impacto) ordenados de menor a mayor dificultad para progresión segura.' },
          'vida_sedentaria': { titulo: 'VIDA SEDENTARIA', descripcion: 'El paciente tiene un estilo de vida SEDENTARIO. Se excluyeron ejercicios con impacto articular y los que requieran carga física para evitar lesiones por desacondicionamiento.' }
        };

        this.reglasExplicacion = Object.keys(reglasObj)
          .filter(key => reglasObj[key])
          .map(key => descripcionesReglas[key] || { titulo: key.toUpperCase().replace(/_/g, ' '), descripcion: 'Regla aplicada por el motor de inferencia.' });
          
        const catalogoBase = payload.catalogo_general || [];
        this.todosLosEjercicios = catalogoBase;
      },
      error: (err) => {
        console.error('Error cargando recomendaciones', err);
      },
    });
  }
  
  agregarEjercicio() {
    if (!this.ejercicioSeleccionadoId) {
      this.socketService.enviarNotificacionLocal('Ejercicio', 'Por favor seleccione un ejercicio');
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
      this.socketService.enviarNotificacionLocal('Ejercicio', 'Este ejercicio ya fue agregado a la rutina');
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
      this.socketService.enviarNotificacionLocal('Rutina', 'La rutina debe tener al menos un ejercicio');
      return;
    }
    if (!this.fechaInicio) {
      this.socketService.enviarNotificacionLocal('Fechas', 'Debe indicar la fecha de inicio');
      return;
    }
    if (!this.fechaFin) {
      this.socketService.enviarNotificacionLocal('Fechas', 'Debe indicar la fecha de fin');
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
          this.socketService.enviarNotificacionLocal('Rutina Guardada', 'Rutina actualizada exitosamente');
          this.router.navigate(['/fisioterapeuta/pacientes', this.pacienteId]);
        },
        error: (err) => {
          console.error('Error editando rutina', err);
          this.socketService.enviarNotificacionLocal('Error', 'Ocurrió un error al actualizar la rutina');
        },
      });
    } else {
      this.fisioService.crearRutina(payload).subscribe({
        next: () => {
          this.socketService.enviarNotificacionLocal('Rutina Guardada', 'Rutina asignada exitosamente');
          this.router.navigate(['/fisioterapeuta/pacientes', this.pacienteId]);
        },
        error: (err) => {
          console.error('Error creando rutina', err);
          this.socketService.enviarNotificacionLocal('Error', 'Ocurrió un error al asignar la rutina');
        },
      });
    }
  }

  eliminarRutina() {
    if (!this.rutinaActualId) return;
    if (!confirm('¿Está seguro que desea eliminar esta rutina de forma permanente?')) return;

    this.fisioService.eliminarRutina(this.rutinaActualId).subscribe({
      next: () => {
        this.socketService.enviarNotificacionLocal('Rutina Eliminada', 'Rutina eliminada exitosamente');
        this.router.navigate(['/fisioterapeuta/pacientes', this.pacienteId]);
      },
      error: (err) => {
        console.error('Error eliminando rutina', err);
        this.socketService.enviarNotificacionLocal('Error', 'Ocurrió un error al eliminar la rutina');
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

  abrirExplicacionModal() {
    this.mostrarModalExplicacion = true;
  }

  cerrarExplicacionModal() {
    this.mostrarModalExplicacion = false;
  }
}
