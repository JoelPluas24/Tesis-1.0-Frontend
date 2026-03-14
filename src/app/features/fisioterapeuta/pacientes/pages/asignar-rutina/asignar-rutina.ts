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

  // Formulario General
  fechaInicio = new Date().toISOString().split('T')[0]; // Fecha de hoy
  observaciones = '';

  // Control de Ejercicios Seleccionados
  ejerciciosAgregados: any[] = [];
  ejercicioSeleccionadoId = '';
  seriesTemp = 3;
  repeticionesTemp = 10;
  frecuenciaTemp = 'Diaria';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fisioService: FisioterapeutaService
  ) { }

  ngOnInit(): void {
    this.pacienteId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarRecomendaciones();
    this.cargarTodosLosEjercicios();
    this.cargarRutinaActual();
  }

  cargarRutinaActual() {
    this.fisioService.obtenerRutinaActiva(this.pacienteId).subscribe({
      next: (res: any) => {
        if (res.ejercicios && res.ejercicios.length > 0) {
          // Pre-llenar la lista con lo que ya tiene
          this.ejerciciosAgregados = res.ejercicios.map((e: any) => ({
            ejercicio_id: e.id,
            nombre: e.nombre,
            series: e.series,
            repeticiones: e.repeticiones,
            frecuencia: e.frecuencia
          }));
          this.observaciones = res.rutina?.observaciones || '';
        }
      },
      error: (err) => {
        // Si no hay rutina activa, no hacemos nada (404 es esperado)
        console.log("Paciente sin rutina previa activa.");
      }
    });
  }

  cargarRecomendaciones() {
    this.fisioService.obtenerEjerciciosRecomendados(this.pacienteId).subscribe({
      next: (res: any) => {
        this.faseRecuperacion = res.fase_recuperacion;
        this.ejerciciosRecomendados = res.ejercicios_recomendados;
      },
      error: (err) => {
        console.error("Error cargando recomendaciones", err);
      }
    });
  }

  cargarTodosLosEjercicios() {
    this.fisioService.obtenerTodosLosEjercicios().subscribe({
      next: (res: any) => {
        this.todosLosEjercicios = Array.isArray(res) ? res : [];
      },
      error: (err) => {
        console.error("Error cargando el catálogo general", err);
      }
    });
  }

  agregarEjercicio() {
    if (!this.ejercicioSeleccionadoId) {
      alert("Por favor seleccione un ejercicio");
      return;
    }

    // Buscar el objeto completo del ejercicio en recomendados o en todos
    let ejEncontrado = this.ejerciciosRecomendados.find(
      e => e.id === Number(this.ejercicioSeleccionadoId)
    );

    if (!ejEncontrado) {
      ejEncontrado = this.todosLosEjercicios.find(
        e => e.id === Number(this.ejercicioSeleccionadoId)
      );
    }

    // Evitar duplicados
    const yaExiste = this.ejerciciosAgregados.find(e => e.ejercicio_id === ejEncontrado.id);
    if (yaExiste) {
      alert("Este ejercicio ya fue agregado a la rutina");
      return;
    }

    this.ejerciciosAgregados.push({
      ejercicio_id: ejEncontrado.id,
      nombre: ejEncontrado.nombre,
      series: this.seriesTemp,
      repeticiones: this.repeticionesTemp,
      frecuencia: this.frecuenciaTemp
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
      alert("La rutina debe tener al menos un ejercicio");
      return;
    }
    if (!this.fechaInicio) {
      alert("Debe indicar la fecha de inicio");
      return;
    }

    const payload = {
      paciente_id: this.pacienteId,
      fecha_inicio: this.fechaInicio,
      observaciones: this.observaciones,
      // Al backend solo se le envía los datos necesarios, no el nombre text
      ejercicios: this.ejerciciosAgregados.map(e => ({
        ejercicio_id: e.ejercicio_id,
        series: e.series,
        repeticiones: e.repeticiones,
        frecuencia: e.frecuencia
      }))
    };

    this.fisioService.crearRutina(payload).subscribe({
      next: () => {
        alert("Rutina asignada exitosamente");
        this.router.navigate(['/fisioterapeuta/pacientes', this.pacienteId]);
      },
      error: (err) => {
        console.error("Error creando rutina", err);
        alert("Ocurrió un error al asignar la rutina");
      }
    });

  }

}
