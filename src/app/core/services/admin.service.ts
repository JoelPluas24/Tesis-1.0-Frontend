import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminService {

    private http = inject(HttpClient);
    private API = 'http://localhost:3000/api/admin';

    //Crear Fisioterapeutas
    crearFisioterapeuta(data: any) {
        return this.http.post('http://localhost:3000/api/auth/register', { ...data, rol: 'FISIOTERAPEUTA' });
    }

    //Listar Fisioterapeutas
    obtenerFisioterapeutas() {
        return this.http.get(`${this.API}/fisioterapeutas`);
    }

    //Crear Pacientes.
    crearPaciente(data: any) {
        return this.http.post('http://localhost:3000/api/auth/register', { ...data, rol: 'PACIENTE' });
    }

    //listar Pacientes
    obtenerPacientes() {
        return this.http.get(`${this.API}/pacientes`);
    }

    //Reporte general Dashboard
    obtenerReporteGeneral() {
        return this.http.get(`${this.API}/reporte-general`);
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
        return this.http.get(`http://localhost:3000/api/patologias`);
    }

    obtenerPatologia(id: number) {
        return this.http.get(`http://localhost:3000/api/patologias/${id}`);
    }

    crearPatologia(data: any) {
        return this.http.post(`http://localhost:3000/api/patologias`, data);
    }

    actualizarPatologia(id: number, data: any) {
        return this.http.put(`http://localhost:3000/api/patologias/${id}`, data);
    }

    eliminarPatologia(id: number) {
        return this.http.delete(`http://localhost:3000/api/patologias/${id}`);
    }

    asociarEjerciciosPatologia(patologiaId: number, ejerciciosIds: number[]) {
        return this.http.post(`http://localhost:3000/api/ejercicios/asociar`, { 
            patologia_id: patologiaId, 
            ejercicios_ids: ejerciciosIds 
        });
    }

    obtenerEjerciciosPorPatologia(patologiaId: number) {
        return this.http.get(`http://localhost:3000/api/patologias/${patologiaId}/ejercicios`);
    }

    // Catálogos: Ejercicios
    obtenerEjercicios() {
        return this.http.get(`http://localhost:3000/api/ejercicios`);
    }

    obtenerEjercicio(id: number) {
        return this.http.get(`http://localhost:3000/api/ejercicios/${id}`);
    }

    crearEjercicio(data: any) {
        return this.http.post(`http://localhost:3000/api/ejercicios`, data);
    }

    actualizarEjercicio(id: number, data: any) {
        return this.http.put(`http://localhost:3000/api/ejercicios/${id}`, data);
    }

    eliminarEjercicio(id: number) {
        return this.http.delete(`http://localhost:3000/api/ejercicios/${id}`);
    }

}