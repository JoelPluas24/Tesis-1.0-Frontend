import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../../../core/services/admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SocketService } from '../../../../../core/services/socket.service';

@Component({
  selector: 'app-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class PacientesList implements OnInit {
  pacientes: any[] = [];
  fisioterapeutas: any[] = [];
  cargando = true;
  filtro = '';

  get pacientesFiltrados() {
    const term = this.filtro.toLowerCase().trim();
    if (!term) return this.pacientes;
    return this.pacientes.filter(p =>
      p.nombres?.toLowerCase().includes(term) ||
      p.apellidos?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term)
    );
  }

  // Selección Múltiple
  pacientesSeleccionados: Set<number> = new Set<number>();
  mostrarModalAsignacion = false;
  fisioterapeutaSeleccionado: number | null = null;
  enviandoAsignacion = false;

  constructor(
    private adminService: AdminService,
    private socketService: SocketService
  ) { }

  ngOnInit(): void {
    this.cargarPacientes();
    this.cargarFisioterapeutasParaAsignacion();
  }

  cargarPacientes() {
    this.adminService.obtenerPacientes().subscribe({
      next: (data: any) => {
        this.pacientes = data;
        this.cargando = false;
        // Limpiar selección al recargar
        this.pacientesSeleccionados.clear();
      },
      error: (err: any) => {
        console.error('Error al cargar pacientes', err);
        this.cargando = false;
      }
    });
  }

  cargarFisioterapeutasParaAsignacion() {
    this.adminService.obtenerFisioterapeutas().subscribe({
      next: (data: any) => {
        this.fisioterapeutas = data;
      },
      error: (err: any) => {
        console.error('Error al cargar fisioterapeutas', err);
      }
    });
  }

  // --- LÓGICA DE ELIMINACIÓN (BAJA)
  eliminarPaciente(id: number) {
    if (confirm('¿Está seguro de querer dar de baja a este paciente? Perderá acceso a la plataforma y se liberará el cupo.')) {
      this.adminService.eliminarPaciente(id).subscribe({
        next: () => {
          this.cargarPacientes(); // Recargar lista
        },
        error: (err) => console.error("Error al dar de baja", err)
      });
    }
  }

  // --- LÓGICA DE EDICIÓN (MODAL)
  mostrarModal = false;
  pacienteForm: any = {};

  abrirModalEdicion(paciente: any) {
    // Clonamos el objeto para no editar directamente sobre la tabla hasta guardar
    this.pacienteForm = { ...paciente };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardarEdicion() {
    const id = this.pacienteForm.usuario_id || this.pacienteForm.id;
    this.adminService.actualizarPaciente(this.pacienteForm.id, this.pacienteForm).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarPacientes();
      },
      error: (err) => console.error("Error al actualizar paciente", err)
    });
  }

  // ---- LÓGICA DE SELECCIÓN MÚLTIPLE Y ASIGNACIÓN ----

  toggleSeleccion(id: number) {
    if (this.pacientesSeleccionados.has(id)) {
      this.pacientesSeleccionados.delete(id);
    } else {
      this.pacientesSeleccionados.add(id);
    }
  }

  toggleSeleccionTodos(event: any) {
    if (event.target.checked) {
      this.pacientes.forEach(p => this.pacientesSeleccionados.add(p.id));
    } else {
      this.pacientesSeleccionados.clear();
    }
  }

  estaSeleccionado(id: number): boolean {
    return this.pacientesSeleccionados.has(id);
  }

  todosSeleccionados(): boolean {
    return this.pacientes.length > 0 && this.pacientesSeleccionados.size === this.pacientes.length;
  }

  abrirModalAsignacion() {
    if (this.pacientesSeleccionados.size === 0) return;
    this.fisioterapeutaSeleccionado = null;
    this.mostrarModalAsignacion = true;
  }

  cerrarModalAsignacion() {
    this.mostrarModalAsignacion = false;
  }

  confirmarAsignacionMasiva() {
    if (!this.fisioterapeutaSeleccionado || this.pacientesSeleccionados.size === 0) return;

    this.enviandoAsignacion = true;
    const ids = Array.from(this.pacientesSeleccionados);

    this.adminService.asignarPacientes(this.fisioterapeutaSeleccionado, ids).subscribe({
      next: (res: any) => {
        this.enviandoAsignacion = false;
        this.cerrarModalAsignacion();
        this.cargarPacientes(); // Refrescar para ver los cambios de asignación
        this.socketService.enviarNotificacionLocal('Asignación Clínica', res.message || 'Asignación completada con éxito.');
      },
      error: (err: any) => {
        this.enviandoAsignacion = false;
        console.error('Error al asignar pacientes', err);
        
        // El backend ahora devuelve mensajes específicos de validación
        const errorMsg = err.error?.message || 'Ocurrió un error en la asignación masiva.';
        this.socketService.enviarNotificacionLocal('Atención', errorMsg);
      }
    });
  }

  obtenerNombreFisioterapeuta(fisioterapeutaId: any): string {
    if (!fisioterapeutaId) return 'Sin asignar';
    const fisio = this.fisioterapeutas.find(f => f.id === Number(fisioterapeutaId));
    return fisio ? `Dr. ${fisio.nombres} ${fisio.apellidos}` : 'Sin asignar';
  }

}
