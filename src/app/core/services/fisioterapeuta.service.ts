import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FisioterapeutaService {

    private http = inject(HttpClient);
    private API = `${environment.apiUrl}/fisioterapeuta`;

    obtenerMisPacientes() {
        return this.http.get(`${this.API}/mis-pacientes`);
    }

    obtenerReporteFisioterapeuta() {
        return this.http.get(`${this.API}/reporte`);
    }

    obtenerRutinaActiva(paciente_id: number) {
        return this.http.get(`${environment.apiUrl}/rutinas/activa/${paciente_id}`);
    }

    obtenerEjerciciosTotalesPaciente(paciente_id: number) {
        return this.http.get(`${environment.apiUrl}/rutinas/paciente/${paciente_id}/ejercicios`);
    }

    obtenerHistorialRutinas(paciente_id: number) {
        return this.http.get(`${environment.apiUrl}/rutinas/historial/${paciente_id}`);
    }

    obtenerEjerciciosPorRutina(rutina_id: number) {
        return this.http.get(`${environment.apiUrl}/rutinas/${rutina_id}/ejercicios`);
    }

    obtenerProgreso(paciente_id: number) {
        return this.http.get(`${environment.apiUrl}/cumplimiento/progreso/${paciente_id}`);
    }

    obtenerEjerciciosRecomendados(paciente_id: number) {
        return this.http.get(`${environment.apiUrl}/pacientes/${paciente_id}/recomendaciones`);
    }

    crearRutina(data: any) {
        return this.http.post(`${environment.apiUrl}/rutinas`, data);
    }

    editarRutina(rutina_id: number, data: any) {
        return this.http.put(`${environment.apiUrl}/rutinas/${rutina_id}`, data);
    }

    finalizarRutina(rutina_id: number) {
        return this.http.put(`${environment.apiUrl}/rutinas/${rutina_id}/finalizar`, {});
    }

    eliminarRutina(rutina_id: number) {
        return this.http.delete(`${environment.apiUrl}/rutinas/${rutina_id}`);
    }

    obtenerTodosLosEjercicios() {
        return this.http.get(`${environment.apiUrl}/ejercicios`);
    }

    obtenerPatologiasBase() {
        return this.http.get(`${environment.apiUrl}/patologias`);
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

    darAltaPaciente(paciente_id: number) {
        return this.http.put(`${this.API}/pacientes/${paciente_id}/alta`, {});
    }

    actualizarDatosClinicosPaciente(paciente_id: number, datos: { nivel_dolor?: number, comorbilidades?: string[], nivel_actividad_fisica?: string }) {
        return this.http.put(`${this.API}/pacientes/${paciente_id}/datos-clinicos`, datos);
    }
}