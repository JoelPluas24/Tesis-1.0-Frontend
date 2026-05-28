import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PacienteService {

    private API = environment.apiUrl;

    constructor(private http: HttpClient) { }

    obtenerMiRutinaActiva(paciente_id: number) {
        return this.http.get(`${this.API}/rutinas/activa/${paciente_id}`);
    }

    obtenerMisEjerciciosAcumulados(paciente_id: number) {
        const d = new Date();
        const fecha_local = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        return this.http.get(`${this.API}/rutinas/paciente/${paciente_id}/ejercicios?fecha_local=${fecha_local}`);
    }

    registrarCumplimiento(ejercicio_id: number) {
        const d = new Date();
        const fecha_local = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        return this.http.post(`${this.API}/cumplimiento`, { ejercicio_id, fecha_local });
    }

    obtenerMiProgreso(paciente_id: number) {
        return this.http.get(`${this.API}/cumplimiento/progreso/${paciente_id}`);
    }

    obtenerHistorial(paciente_id: number) {
        return this.http.get(`${this.API}/cumplimiento/historial/${paciente_id}`);
    }

}
