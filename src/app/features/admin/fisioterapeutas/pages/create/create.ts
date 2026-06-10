import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../../core/services/admin.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../../../../core/services/socket.service';

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
  telefono = '';
  password = '';

  constructor(
    private adminService: AdminService,
    private router: Router,
    private socketService: SocketService
  ) {}

  crear() {
    const data = {
      nombres: this.nombres,
      apellidos: this.apellidos,
      email: this.email,
      telefono: this.telefono,
      password: this.password,
    };

    this.adminService.crearFisioterapeuta(data).subscribe({
      next: () => {
        this.socketService.enviarNotificacionLocal('Fisioterapeuta', 'Fisioterapeuta creado exitosamente');
        this.router.navigate(['/admin/fisioterapeutas']);
      },
      error: (err) => {
        console.error(err);
        this.socketService.enviarNotificacionLocal('Error', 'Error al crear fisioterapeuta');
      },
    });
  }
}
