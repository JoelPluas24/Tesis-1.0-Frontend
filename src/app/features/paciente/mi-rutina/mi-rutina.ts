import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PacienteService } from '../../../core/services/paciente.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { SocketService } from '../../../core/services/socket.service';
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
  totalSesionesPlan: number = 0;
  fechaInicioPlan: string = '';
  fechaFinPlan: string = '';

  // Calendario e Historial
  historial: any[] = [];
  calendario: any[] = [];
  mesActual: number = new Date().getMonth();
  anioActual: number = new Date().getFullYear();
  mesActualNombre: string = '';
  diasSemana: string[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  fechasCompletadas: Set<string> = new Set();
  today = new Date();

  get historialActivo() {
    if (!this.rutina) return [];
    return this.historial.filter(h => h.rutina_id === this.rutina.id);
  }


  constructor(
    private pacienteService: PacienteService,
    private userService: UserService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private socketService: SocketService
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
        this.totalSesionesPlan = data.total_dias || 10; // total_dias actually contains total_sesiones from backend
        this.fechaInicioPlan = data.fecha_inicio || '';
        this.fechaFinPlan = data.fecha_fin || '';

        // Ahora solo leemos los ejercicios realizados para calcular las sesiones completadas
        this.diasCompletados = data.ejercicios_realizados > 0 && data.total_ejercicios > 0 
           ? Math.floor(data.ejercicios_realizados / (data.total_ejercicios / this.totalSesionesPlan))
           : 0;
        
        if (this.diasCompletados > this.totalSesionesPlan) {
           this.diasCompletados = this.totalSesionesPlan;
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
        this.historial = (Array.isArray(datos) ? datos : []).map(h => {
          return {
            ...h,
            expandido: false,
            lista_ejercicios: h.nombres_ejercicios ? h.nombres_ejercicios.split(',').map((e: string) => e.trim()) : []
          };
        });

        this.fechasCompletadas = new Set(
          this.historial.map((h: any) => h.fecha.split('T')[0])
        );
        this.generarCalendario();
      },
      error: (err: HttpErrorResponse) => console.error("Error al cargar historial", err)
    });
  }

  generarCalendario() {
    console.log('Fechas completadas:', Array.from(this.fechasCompletadas));
    console.log('Mes actual:', this.mesActual, 'Año:', this.anioActual);
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    this.mesActualNombre = `${nombresMeses[this.mesActual]} ${this.anioActual}`;

    const primerDia = new Date(this.anioActual, this.mesActual, 1);
    const ultimoDia = new Date(this.anioActual, this.mesActual + 1, 0);
    const diaInicioSemana = primerDia.getDay();
    const hoy = new Date();

    const dias = [];
    for (let i = 0; i < diaInicioSemana; i++) {
      dias.push({ nro: null, completado: false, esHoy: false });
    }
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      const fechaStr = `${this.anioActual}-${(this.mesActual + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const completado = this.fechasCompletadas.has(fechaStr);
      const esHoy = i === hoy.getDate() &&
        this.mesActual === hoy.getMonth() &&
        this.anioActual === hoy.getFullYear();
      dias.push({ nro: i, completado, esHoy });
    }
    this.calendario = dias;
    console.log('Días con completado=true:', dias.filter(d => d.completado));
  }
  // Agrega estos dos métodos nuevos
  mesAnterior() {
    if (this.mesActual === 0) {
      this.mesActual = 11;
      this.anioActual--;
    } else {
      this.mesActual--;
    }
    this.generarCalendario();
    this.cdr.detectChanges();
  }

  mesSiguiente() {
    const hoy = new Date();
    // No permitir navegar más allá del mes actual
    if (this.anioActual === hoy.getFullYear() && this.mesActual === hoy.getMonth()) return;
    if (this.mesActual === 11) {
      this.mesActual = 0;
      this.anioActual++;
    } else {
      this.mesActual++;
    }
    this.generarCalendario();
    this.cdr.detectChanges()
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

  get planExpirado(): boolean {
    if (!this.fechaFinPlan) return false;
    const hoyStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Guayaquil' }).format(new Date());
    const cleanFinStr = this.fechaFinPlan.split('T')[0];
    return hoyStr > cleanFinStr;
  }

  get planAunNoInicia(): boolean {
    if (!this.fechaInicioPlan) return false;
    const hoyStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Guayaquil' }).format(new Date());
    const cleanInicioStr = this.fechaInicioPlan.split('T')[0];
    return hoyStr < cleanInicioStr;
  }

  getArray(n: number): any[] {
    return Array(n);
  }

  marcarCompletado(ejercicio: any) {
    if (this.planAunNoInicia) {
      this.socketService.enviarNotificacionLocal("Plan Futuro", "Tu plan aún no ha iniciado. Podrás registrar tu avance a partir de la fecha de inicio.");
      return;
    }
    if (this.planExpirado) {
      this.socketService.enviarNotificacionLocal("Plan Finalizado", "Tu plan de recuperación ha concluido. Por favor, contacta a tu fisioterapeuta.");
      return;
    }
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
        const errorMsg = err.error?.message || "Ocurrió un error al intentar guardar tu avance. Por favor, intenta de nuevo.";
        this.socketService.enviarNotificacionLocal("Error", errorMsg);
      }
    });
  }

  finalizarYSalir() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

}
