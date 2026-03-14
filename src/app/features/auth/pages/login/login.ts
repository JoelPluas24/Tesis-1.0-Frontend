import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  email = '';
  password = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) { }

  onLogin() {
    this.auth.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.auth.saveToken(res.accessToken);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        alert('Credenciales incorrectas');
      }
    });
  }
}
