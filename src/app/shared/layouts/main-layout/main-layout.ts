import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout implements OnInit {

  usuario: any;

  constructor(
    private auth: AuthService,
    private router: Router,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.userService.perfil().subscribe({
      next: (res) => {
        this.usuario = res;
      },
      error: (err) => {
        console.error("Error al obtener el perfil", err);
      }
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

}
