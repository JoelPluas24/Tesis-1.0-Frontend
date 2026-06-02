import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../../../core/services/admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inactivos',
  imports: [CommonModule, FormsModule],
  templateUrl: './inactivos.html',
  styleUrl: './inactivos.css',
})
export class Inactivos implements OnInit {
  pacientes: any[] = [];
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

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.cargarPacientesInactivos();
  }

  cargarPacientesInactivos() {
    this.adminService.obtenerPacientesInactivos().subscribe({
      next: (data: any) => {
        this.pacientes = data;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error al cargar pacientes inactivos', err);
        this.cargando = false;
      }
    });
  }

  reactivarPaciente(id: number) {
    if (confirm('¿Está seguro de querer reactivar a este paciente?')) {
      this.adminService.reactivarPaciente(id).subscribe({
        next: () => {
          this.cargarPacientesInactivos(); // Recargar lista
        },
        error: (err: any) => console.error("Error al reactivar", err)
      });
    }
  }
}
