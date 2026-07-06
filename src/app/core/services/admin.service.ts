import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {

    private http = inject(HttpClient);
    private API = `${environment.apiUrl}/admin`;

    //Crear Fisioterapeutas
    crearFisioterapeuta(data: any) {
        return this.http.post(`${environment.apiUrl}/auth/register`, { ...data, rol: 'FISIOTERAPEUTA' });
    }

    //Listar Fisioterapeutas
    obtenerFisioterapeutas() {
        return this.http.get(`${this.API}/fisioterapeutas`);
    }

    //Crear Pacientes.
    crearPaciente(data: any) {
        return this.http.post(`${environment.apiUrl}/auth/register`, { ...data, rol: 'PACIENTE' });
    }

    //listar Pacientes
    obtenerPacientes() {
        return this.http.get(`${this.API}/pacientes`);
    }

    //Reporte general Dashboard
    obtenerReporteGeneral(fechaInicio?: string, fechaFin?: string) {
        let params = new URLSearchParams();
        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);
        
        const queryString = params.toString();
        const url = queryString ? `${this.API}/reporte-general?${queryString}` : `${this.API}/reporte-general`;
        
        return this.http.get(url);
    }

    // Actualizar Paciente
    actualizarPaciente(id: number, data: any) {
        return this.http.put(`${this.API}/pacientes/${id}`, data);
    }

    // Listar Pacientes Inactivos
    obtenerPacientesInactivos() {
        return this.http.get(`${this.API}/pacientes-inactivos`);
    }

    // Reactivar Paciente
    reactivarPaciente(id: number) {
        return this.http.put(`${this.API}/pacientes/${id}/reactivar`, {});
    }

    // Eliminar Paciente (Baja lógica)
    eliminarPaciente(id: number) {
        return this.http.delete(`${this.API}/pacientes/${id}`);
    }

    // Actualizar Fisioterapeuta
    actualizarFisioterapeuta(id: number, data: any) {
        return this.http.put(`${this.API}/fisioterapeutas/${id}`, data);
    }

    // Eliminar Fisioterapeuta (Baja lógica)
    eliminarFisioterapeuta(id: number) {
        return this.http.delete(`${this.API}/fisioterapeutas/${id}`);
    }

    // Asignación Masiva
    asignarPacientes(fisioterapeutaId: number, pacienteIds: number[]) {
        return this.http.put(`${this.API}/asignar-paciente`, {
            fisioterapeutaId,
            pacienteIds
        });
    }

    // Catálogos: Patologías
    obtenerPatologias() {
        return this.http.get(`${environment.apiUrl}/patologias`);
    }

    obtenerPatologia(id: number) {
        return this.http.get(`${environment.apiUrl}/patologias/${id}`);
    }

    crearPatologia(data: any) {
        return this.http.post(`${environment.apiUrl}/patologias`, data);
    }

    actualizarPatologia(id: number, data: any) {
        return this.http.put(`${environment.apiUrl}/patologias/${id}`, data);
    }

    eliminarPatologia(id: number) {
        return this.http.delete(`${environment.apiUrl}/patologias/${id}`);
    }

    asociarEjerciciosPatologia(patologiaId: number, ejerciciosIds: number[]) {
        return this.http.post(`${environment.apiUrl}/ejercicios/asociar`, { 
            patologia_id: patologiaId, 
            ejercicios_ids: ejerciciosIds 
        });
    }

    obtenerEjerciciosPorPatologia(patologiaId: number) {
        return this.http.get(`${environment.apiUrl}/patologias/${patologiaId}/ejercicios`);
    }

    // Catálogos: Ejercicios
    obtenerEjercicios() {
        return this.http.get(`${environment.apiUrl}/ejercicios`);
    }

    obtenerEjercicio(id: number) {
        return this.http.get(`${environment.apiUrl}/ejercicios/${id}`);
    }

    crearEjercicio(data: any) {
        return this.http.post(`${environment.apiUrl}/ejercicios`, data);
    }

    actualizarEjercicio(id: number, data: any) {
        return this.http.put(`${environment.apiUrl}/ejercicios/${id}`, data);
    }

    eliminarEjercicio(id: number) {
        return this.http.delete(`${environment.apiUrl}/ejercicios/${id}`);
    }

}