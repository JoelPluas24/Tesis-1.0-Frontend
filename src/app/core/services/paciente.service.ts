import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class PacienteService {

    private API = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    obtenerMiRutinaActiva(paciente_id: number) {
        return this.http.get(`${this.API}/rutinas/activa/${paciente_id}`);
    }

    obtenerMisEjerciciosAcumulados(paciente_id: number) {
        return this.http.get(`${this.API}/rutinas/paciente/${paciente_id}/ejercicios`);
    }

    registrarCumplimiento(ejercicio_id: number) {
        return this.http.post(`${this.API}/cumplimiento`, { ejercicio_id });
    }

}
