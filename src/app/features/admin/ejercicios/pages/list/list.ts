import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../../../core/services/admin.service';

@Component({
  selector: 'app-ejercicios-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List implements OnInit {
  ejercicios: any[] = [];
  cargando = true;
  filtro = '';

  get ejerciciosFiltrados() {
    const term = this.filtro.toLowerCase().trim();
    if (!term) return this.ejercicios;
    return this.ejercicios.filter(e =>
      e.nombre?.toLowerCase().includes(term) ||
      e.descripcion?.toLowerCase().includes(term) ||
      e.nivel_dificultad?.toLowerCase().includes(term)
    );
  }

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargarEjercicios();
  }

  cargarEjercicios() {
    this.adminService.obtenerEjercicios().subscribe({
      next: (data: any) => {
        this.ejercicios = Array.isArray(data) ? data : [];
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error al cargar ejercicios', err);
        this.cargando = false;
      }
    });
  }

  eliminarEjercicio(id: number) {
    if (confirm('¿Está seguro de querer eliminar definitivamente este ejercicio del catálogo global? Se podría perder de las rutinas actuales.')) {
      this.adminService.eliminarEjercicio(id).subscribe({
        next: () => {
          this.cargarEjercicios();
        },
        error: (err) => console.error("Error al eliminar", err)
      });
    }
  }
}
