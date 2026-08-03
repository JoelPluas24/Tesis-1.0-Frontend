import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../../../core/services/admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fisioterapeutas-inactivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inactivos.html'
})
export class FisioterapeutasInactivosComponent implements OnInit {
  fisioterapeutas: any[] = [];
  filtro = '';
  cargando = true;

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
    this.cargando = true;
    this.adminService.obtenerFisioterapeutasInactivos().subscribe({
      next: (res: any) => {
        // Backend devuelve { data: [...] } por el ApiResponse.success, o a veces el array directo
        this.fisioterapeutas = res.data || res;
        this.cargando = false;
      },
      error: (err) => {
        console.error("Error cargando fisioterapeutas inactivos", err);
        this.cargando = false;
      }
    });
  }

  reactivarFisioterapeuta(id: number) {
    if (confirm('¿Está seguro de querer reactivar a este fisioterapeuta? Podrá volver a iniciar sesión.')) {
      this.adminService.reactivarFisioterapeuta(id).subscribe({
        next: () => {
          this.cargarFisioterapeutas();
        },
        error: (err) => console.error("Error al reactivar", err)
      });
    }
  }
}
