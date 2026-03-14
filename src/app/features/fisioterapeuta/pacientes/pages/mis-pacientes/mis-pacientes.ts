import { Component, OnInit } from '@angular/core';
import { FisioterapeutaService } from '../../../../../core/services/fisioterapeuta.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mis-pacientes',
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-pacientes.html',
  styleUrl: './mis-pacientes.css',
})
export class MisPacientes implements OnInit {
  pacientes: any[] = [];

  constructor(private fisioService: FisioterapeutaService) { }

  ngOnInit(): void {
    this.fisioService.obtenerMisPacientes().subscribe({
      next: (res: any) => {
        this.pacientes = res.pacientes;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}
