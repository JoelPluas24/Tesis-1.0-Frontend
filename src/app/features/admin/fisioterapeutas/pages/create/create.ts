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
export class FisioCreate {
  nombres = '';
  apellidos = '';
  email = '';
  especialidad = '';
  telefono = '';
  password = '';

  constructor(
    private adminService: AdminService,
    private router: Router
  ) { }

  crear() {
    const data = {
      nombres: this.nombres,
      apellidos: this.apellidos,
      email: this.email,
      //especialidad: this.especialidad,
      telefono: this.telefono,
      password: this.password
    };

    this.adminService.crearFisioterapeuta(data).subscribe({
      next: () => {
        alert('Fisioterapeuta creado');
        this.router.navigate(['/admin/fisioterapeutas']);
      },
      error: (err) => {
        console.error(err);
        alert('Error al crear');
      }
    });
  }
}
