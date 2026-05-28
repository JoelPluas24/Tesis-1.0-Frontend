import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FisioterapeutaService {

    private http = inject(HttpClient);
    private API = 'http://localhost:3000/api/fisioterapeuta';

    obtenerMisPacientes() {
        return this.http.get(`${this.API}/mis-pacientes`);
    }

    obtenerReporteFisioterapeuta() {
        return this.http.get(`${this.API}/reporte`);
    }

    obtenerRutinaActiva(paciente_id: number) {
        return this.http.get(`http://localhost:3000/api/rutinas/activa/${paciente_id}`);
    }

    obtenerEjerciciosTotalesPaciente(paciente_id: number) {
        return this.http.get(`http://localhost:3000/api/rutinas/paciente/${paciente_id}/ejercicios`);
    }

    obtenerHistorialRutinas(paciente_id: number) {
        return this.http.get(`http://localhost:3000/api/rutinas/historial/${paciente_id}`);
    }

    obtenerEjerciciosPorRutina(rutina_id: number) {
        return this.http.get(`http://localhost:3000/api/rutinas/${rutina_id}/ejercicios`);
    }

    obtenerProgreso(paciente_id: number) {
        return this.http.get(`http://localhost:3000/api/cumplimiento/progreso/${paciente_id}`);
    }

    obtenerEjerciciosRecomendados(paciente_id: number) {
        return this.http.get(`http://localhost:3000/api/pacientes/${paciente_id}/recomendaciones`);
    }

    crearRutina(data: any) {
        return this.http.post('http://localhost:3000/api/rutinas', data);
    }

    editarRutina(rutina_id: number, data: any) {
        return this.http.put(`http://localhost:3000/api/rutinas/${rutina_id}`, data);
    }

    eliminarRutina(rutina_id: number) {
        return this.http.delete(`http://localhost:3000/api/rutinas/${rutina_id}`);
    }

    obtenerTodosLosEjercicios() {
        return this.http.get('http://localhost:3000/api/ejercicios');
    }

    obtenerPatologiasBase() {
        return this.http.get('http://localhost:3000/api/patologias');
    }

    obtenerPatologiasPaciente(paciente_id: number) {
        return this.http.get(`${this.API}/pacientes/${paciente_id}/patologias`);
    }

    asignarPatologiasPaciente(paciente_id: number, patologia_ids: number[]) {
        return this.http.post(`${this.API}/pacientes/${paciente_id}/patologias`, { patologia_ids });
    }

    asignarFasePaciente(paciente_id: number, fase_recuperacion: string) {
        return this.http.put(`${this.API}/pacientes/${paciente_id}/fase`, { fase_recuperacion });
    }
}