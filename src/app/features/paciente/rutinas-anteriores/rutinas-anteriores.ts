import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PacienteService } from '../../../core/services/paciente.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-rutinas-anteriores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rutinas-anteriores.html',
  styleUrl: './rutinas-anteriores.css'
})
export class RutinasAnterioresComponent implements OnInit {

  usuario: any;
  cargando = true;

  rutinasPorPatologia: { patologia: string, rutinas: any[] }[] = [];
  rutinaAnteriorSeleccionada: any = null;
  ejerciciosAnteriores: any[] = [];

  constructor(
    private pacienteService: PacienteService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userService.perfil().subscribe({
      next: (res: any) => {
        this.usuario = res;
        if (this.usuario.paciente_id) {
          this.cargarRutinasAnteriores(this.usuario.paciente_id);
        } else {
          this.cargando = false;
        }
      },
      error: () => {
        console.error('No se pudo cargar el perfil');
        this.cargando = false;
      }
    });
  }

  cargarRutinasAnteriores(pacienteId: number) {
    this.pacienteService.obtenerMisRutinasAnteriores(pacienteId).subscribe({
      next: (res: any) => {
        // Filtrar para no mostrar la rutina activa en el historial
        const data = res.data || res.historial || res || [];
        const previas = data.filter((r: any) => r.estado !== 'ACTIVA');
        
        // Agrupar por patología
        const map = new Map<string, any[]>();
        previas.forEach((r: any) => {
          const pat = r.patologia_nombre || 'Patología General';
          if (!map.has(pat)) {
            map.set(pat, []);
          }
          map.get(pat)!.push(r);
        });

        this.rutinasPorPatologia = Array.from(map.entries()).map(([patologia, rutinas]) => ({
          patologia,
          rutinas
        }));

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar rutinas anteriores', err);
        this.cargando = false;
      }
    });
  }

  verEjerciciosAnteriores(rutina: any) {
    if (this.rutinaAnteriorSeleccionada?.id === rutina.id) {
      this.rutinaAnteriorSeleccionada = null;
      this.ejerciciosAnteriores = [];
      return;
    }
    this.rutinaAnteriorSeleccionada = rutina;
    this.pacienteService.obtenerEjerciciosPorRutina(rutina.id).subscribe({
      next: (res: any) => {
        this.ejerciciosAnteriores = res.data || res || [];
      },
      error: (err) => console.error('Error al cargar ejercicios anteriores', err)
    });
  }
}
