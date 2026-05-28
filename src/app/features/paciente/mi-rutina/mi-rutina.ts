import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PacienteService } from '../../../core/services/paciente.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
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

  // Progreso
  progresoGlobal: number = 0;
  diasCompletados: number = 0;
  totalDiasPlan: number = 0;
  fechaInicioPlan: string = '';
  fechaFinPlan: string = '';

  // Calendario e Historial
  historial: any[] = [];
  calendario: any[] = [];
  mesActualNombre: string = '';
  diasSemana: string[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  fechasCompletadas: Set<string> = new Set();

  constructor(
    private pacienteService: PacienteService,
    private userService: UserService,
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Al cargar la vista de paciente, primero necesitamos obtener su paciente_id desde el perfil del token
    this.userService.perfil().subscribe({
      next: (res: any) => {
        this.usuario = res;
        if (this.usuario.paciente_id) {
          this.cargarMiRutina(this.usuario.paciente_id);
          this.cargarMiProgreso(this.usuario.paciente_id);
          this.cargarMiHistorial(this.usuario.paciente_id);
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

  cargarMiProgreso(pacienteId: number) {
    this.pacienteService.obtenerMiProgreso(pacienteId).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.progresoGlobal = data.porcentaje_cumplimiento || 0;
        this.totalDiasPlan = data.total_dias || 0;
        this.fechaInicioPlan = data.fecha_inicio || '';
        this.fechaFinPlan = data.fecha_fin || '';

        if (this.fechaInicioPlan && this.totalDiasPlan > 0) {
          const cleanStr = this.fechaInicioPlan.split('T')[0];
          const [year, month, day] = cleanStr.split('-').map(Number);
          const inicio = new Date(year, month - 1, day);
          const hoy = new Date();
          inicio.setHours(0, 0, 0, 0);
          hoy.setHours(0, 0, 0, 0);
          const diffTime = hoy.getTime() - inicio.getTime();
          let diaActual = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

          if (diaActual < 1) diaActual = 1;
          if (diaActual > this.totalDiasPlan) diaActual = this.totalDiasPlan;

          this.diasCompletados = diaActual;
        } else {
          this.diasCompletados = 0;
        }
      },
      error: (err: HttpErrorResponse) => console.error("Error al cargar progreso", err)
    });
  }

  cargarMiHistorial(pacienteId: number) {
    this.pacienteService.obtenerHistorial(pacienteId).subscribe({
      next: (res: any) => {
        // El backend devuelve { success, message, data: [...] }
        const datos = Array.isArray(res) ? res : (res?.data ?? []);
        this.historial = Array.isArray(datos) ? datos : [];

        this.fechasCompletadas = new Set(
          this.historial.map((h: any) => h.fecha.split('T')[0])
        );
        this.generarCalendario();
      },
      error: (err: HttpErrorResponse) => console.error("Error al cargar historial", err)
    });
  }

  generarCalendario() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();

    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    this.mesActualNombre = `${nombresMeses[mes]} ${anio}`;

    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);

    // Obtener día de la semana del 1er día (0 = Domingo, 1 = Lunes...)
    const diaInicioSemana = primerDia.getDay();

    const dias = [];

    // Rellenar días en blanco antes del primer día del mes
    for (let i = 0; i < diaInicioSemana; i++) {
      dias.push({ nro: null, completado: false, esHoy: false });
    }

    // Rellenar los días del mes
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      const fechaStr = `${anio}-${(mes + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const completado = this.fechasCompletadas.has(fechaStr);
      const esHoy = i === hoy.getDate();
      dias.push({ nro: i, completado, esHoy });
    }

    this.calendario = dias;
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
        this.ejercicios = res.map((ej: any) => {
          let metaDiaria = 1;
          const match = ej.frecuencia ? ej.frecuencia.match(/\d+/) : null;
          if (match && parseInt(match[0], 10) > 0) {
            metaDiaria = parseInt(match[0], 10);
          }
          const completadas = ej.vecesCompletadasHoy || 0;
          return {
            ...ej,
            vecesCompletadasHoy: completadas,
            metaDiaria: metaDiaria,
            completadoHoy: completadas >= metaDiaria
          };
        });
        this.cargando = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error("Error al cargar ejercicios acumulados", err);
        this.cargando = false;
      }
    });
  }

  getArray(n: number): any[] {
    return Array(n);
  }

  marcarCompletado(ejercicio: any) {
    if (ejercicio.completadoHoy) return; // Si ya se completó no hacer nada

    this.pacienteService.registrarCumplimiento(ejercicio.id).subscribe({
      next: (res: any) => {
        ejercicio.vecesCompletadasHoy += 1;
        if (ejercicio.vecesCompletadasHoy >= ejercicio.metaDiaria) {
          ejercicio.completadoHoy = true;
        }
        // Refrescar el progreso global desde el backend para animar la barra
        if (this.usuario?.paciente_id) {
          this.cargarMiProgreso(this.usuario.paciente_id);
          this.cargarMiHistorial(this.usuario.paciente_id);
        }

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

  finalizarYSalir() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

}
