import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../../../core/services/admin.service';

@Component({
  selector: 'app-patologias-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List implements OnInit {
  patologias: any[] = [];
  cargando = true;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargarPatologias();
  }

  cargarPatologias() {
    this.adminService.obtenerPatologias().subscribe({
      next: (data: any) => {
        this.patologias = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar patologías', err);
        this.cargando = false;
      }
    });
  }

  eliminarPatologia(id: number) {
    if (confirm('¿Está seguro de querer eliminar definitivamente esta patología del catálogo?')) {
      this.adminService.eliminarPatologia(id).subscribe({
        next: () => {
          this.cargarPatologias();
        },
        error: (err) => console.error("Error al eliminar", err)
      });
    }
  }
}
