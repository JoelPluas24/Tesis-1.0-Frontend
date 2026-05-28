import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../../core/services/admin.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create',
  imports: [CommonModule, FormsModule],
  templateUrl: './create.html',
  styleUrl: './create.css',
})
export class PacienteCreate {
  nombres = '';
  apellidos = '';
  email = '';
  password = '';
  edad = '';
  genero = 'MASCULINO';
  direccion = '';

  constructor(
    private adminService: AdminService,
    private router: Router,
  ) {}

  crear() {
    const data: any = {
      nombres: this.nombres,
      apellidos: this.apellidos,
      email: this.email,
      password: this.password,
      genero: this.genero,
    };

    if (this.edad !== '' && this.edad !== null && this.edad !== undefined) {
      data.edad = Number(this.edad);
    }
    
    if (this.direccion && this.direccion.trim() !== '') {
      data.direccion = this.direccion;
    }

    this.adminService.crearPaciente(data).subscribe({
      next: () => {
        alert('Paciente creado correctamente');
        this.router.navigate(['/admin/pacientes']);
      },
      error: (err) => {
        console.error(err);
        alert('Error al crear paciente');
      },
    });
  }
}
