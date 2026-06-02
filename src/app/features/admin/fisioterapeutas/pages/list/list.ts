import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../../../core/services/admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class FisioterapeutasList implements OnInit {
  fisioterapeutas: any[] = [];
  filtro = '';

  get fisioterapeutasFiltrados() {
    const term = this.filtro.toLowerCase().trim();
    if (!term) return this.fisioterapeutas;
    return this.fisioterapeutas.filter(f =>
      f.nombres?.toLowerCase().includes(term) ||
      f.apellidos?.toLowerCase().includes(term) ||
      f.email?.toLowerCase().includes(term) ||
      f.especialidad?.toLowerCase().includes(term)
    );
  }

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.cargarFisioterapeutas();
  }

  cargarFisioterapeutas() {
    this.adminService.obtenerFisioterapeutas().subscribe({
      next: (res: any) => {
        this.fisioterapeutas = res;
      },
      error: (err) => {
        console.error("Error cargando fisioterapeutas", err);
      }
    });
  }

  // --- LÓGICA DE ELIMINACIÓN (BAJA)
  eliminarFisioterapeuta(id: number) {
    if (confirm('¿Está seguro de querer dar de baja a este fisioterapeuta? Se desactivará su cuenta y todos sus pacientes asignados quedarán libres.')) {
      this.adminService.eliminarFisioterapeuta(id).subscribe({
        next: () => {
          this.cargarFisioterapeutas(); // Recargar lista
        },
        error: (err) => console.error("Error al dar de baja", err)
      });
    }
  }

  // --- LÓGICA DE EDICIÓN (MODAL)
  mostrarModal = false;
  fisioterapeutaForm: any = {};

  abrirModalEdicion(fisioterapeuta: any) {
    this.fisioterapeutaForm = { ...fisioterapeuta };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardarEdicion() {
    // admin.controller.ts uses req.params.id to look up usuario_id inside table fisioterapeutas
    // So ID here is the fisioterapeuta.id
    this.adminService.actualizarFisioterapeuta(this.fisioterapeutaForm.id, this.fisioterapeutaForm).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarFisioterapeutas();
      },
      error: (err) => console.error("Error al actualizar fisioterapeuta", err)
    });
  }

}
