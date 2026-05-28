import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {

  email = '';
  password = '';
  showPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    // Si ya tiene un token al entrar al login, redirigir automáticamente
    if (this.auth.isLoggedIn()) {
      const token = this.auth.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.rol === 'FISIOTERAPEUTA') {
            this.router.navigate(['/fisioterapeuta/mis-pacientes']);
          } else if (payload.rol === 'PACIENTE') {
            this.router.navigate(['/paciente/mi-rutina']);
          } else {
            this.router.navigate(['/admin/pacientes']);
          }
        } catch (e) {
          // Token inválido, se queda en el login
        }
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    this.auth.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res: any) => {
        this.auth.saveToken(res.accessToken);
        // Decode token to get role
        try {
          const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
          if (payload.rol === 'FISIOTERAPEUTA') {
            this.router.navigate(['/fisioterapeuta/mis-pacientes']);
          } else if (payload.rol === 'PACIENTE') {
            this.router.navigate(['/paciente/mi-rutina']);
          } else {
            this.router.navigate(['/admin/pacientes']);
          }
        } catch (e) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        alert('Credenciales incorrectas');
      }
    });
  }
}
