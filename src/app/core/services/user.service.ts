import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserService {

    private http = inject(HttpClient);
    private API = 'http://localhost:3000/api';

    perfil() {
        return this.http.get(`${this.API}/users/perfil`);
    }

    cambiarPassword(currentPassword: string, newPassword: string) {
        return this.http.put(`${this.API}/users/cambiar-password`, { currentPassword, newPassword });
    }
}