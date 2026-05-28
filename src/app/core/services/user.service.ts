import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {

    private http = inject(HttpClient);
    private API = environment.apiUrl;

    perfil() {
        return this.http.get(`${this.API}/users/perfil`);
    }

    cambiarPassword(currentPassword: string, newPassword: string) {
        return this.http.put(`${this.API}/users/cambiar-password`, { currentPassword, newPassword });
    }
}