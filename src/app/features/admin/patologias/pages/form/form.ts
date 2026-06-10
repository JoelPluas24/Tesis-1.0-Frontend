import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../../../core/services/admin.service';
import { SocketService } from '../../../../../core/services/socket.service';

@Component({
  selector: 'app-patologia-form',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './form.html',
  styleUrl: './form.css',
})
export class Form implements OnInit {
  id: number | null = null;
  patologia: any = {
    nombre: '',
    descripcion: '',
    nivel_gravedad: 'LEVE'
  };
  
  // Ejercicios
  todosLosEjercicios: any[] = [];
  ejerciciosAsociados: Set<number> = new Set<number>();
  
  cargando = false;
  guardando = false;

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('id');
    this.cargarTodosLosEjercicios();

    if (paramId) {
      this.id = Number(paramId);
      this.cargarDistribucion();
    }
  }

  cargarTodosLosEjercicios() {
    this.adminService.obtenerEjercicios().subscribe({
      next: (data: any) => {
        this.todosLosEjercicios = Array.isArray(data) ? data : [];
      },
      error: (err) => console.error("Error cargando el catálogo de ejercicios", err)
    });
  }

  cargarDistribucion() {
    if(!this.id) return;
    this.cargando = true;
    
    // Cargar la patología
    this.adminService.obtenerPatologia(this.id).subscribe({
      next: (data: any) => {
        this.patologia = Array.isArray(data) ? data[0] || this.patologia : data;
        
        // Cargar ejercicios asociados
        this.adminService.obtenerEjerciciosPorPatologia(this.id!).subscribe({
          next: (ejercicios: any) => {
            const arr = Array.isArray(ejercicios) ? ejercicios : (ejercicios?.ejercicios || []);
            arr.forEach((e: any) => this.ejerciciosAsociados.add(e.id || e.ejercicio_id));
            this.cargando = false;
          },
          error: (err) => {
            console.error("Error al cargar ejercicios asociados", err);
            this.cargando = false;
          }
        });
      },
      error: (err) => {
        console.error("Error al cargar patología", err);
        this.cargando = false;
      }
    });
  }

  toggleEjercicio(ejercicioId: number) {
    if (this.ejerciciosAsociados.has(ejercicioId)) {
      this.ejerciciosAsociados.delete(ejercicioId);
    } else {
      this.ejerciciosAsociados.add(ejercicioId);
    }
  }

  estaAsociado(ejercicioId: number): boolean {
    return this.ejerciciosAsociados.has(ejercicioId);
  }

  guardar() {
    if (!this.patologia.nombre) {
      this.socketService.enviarNotificacionLocal("Patología", "El nombre de la patología es obligatorio.");
      return;
    }

    this.guardando = true;
    
    if (this.id) {
      // Actualizar
      this.adminService.actualizarPatologia(this.id, this.patologia).subscribe({
        next: () => {
          this.guardarAsociaciones(this.id!);
        },
        error: (err) => {
          console.error("Error al actualizar", err);
          this.socketService.enviarNotificacionLocal("Error", "Ocurrió un error guardando los datos.");
          this.guardando = false;
        }
      });
    } else {
      // Crear
      this.adminService.crearPatologia(this.patologia).subscribe({
        next: (res: any) => {
          // Tratar de obtener el ID insertado
          const nuevaId = res?.id || res?.insertId || res?.patologia?.id || (Array.isArray(res) ? res[0]?.id || res[0]?.insertId : null) || null; 
          
          if(nuevaId && this.ejerciciosAsociados.size > 0) {
             this.guardarAsociaciones(nuevaId);
          } else {
             // Redirigir porque no sabemos el ID, o no hay nada que asociar
             this.router.navigate(['/admin/patologias']);
          }
        },
        error: (err) => {
          console.error("Error al crear", err);
          this.socketService.enviarNotificacionLocal("Error", "Ocurrió un error creando la patología.");
          this.guardando = false;
        }
      });
    }
  }

  guardarAsociaciones(patologiaId: number) {
    const ids = Array.from(this.ejerciciosAsociados);
    this.adminService.asociarEjerciciosPatologia(patologiaId, ids).subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate(['/admin/patologias']);
      },
      error: (err) => {
        console.error("Error al asociar", err);
        this.guardando = false;
        this.router.navigate(['/admin/patologias']); // Navigate anyway
      }
    });
  }
}
