import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { AdminService } from '../../../../core/services/admin.service';
import { PacienteService } from '../../../../core/services/paciente.service';
import { FisioterapeutaService } from '../../../../core/services/fisioterapeuta.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  usuario: any;
  reporte: any = null;
  cargandoReporte = false;
  filtroTiempo: string = 'todo';

  // Chart configuration: Distibución de Usuarios (Doughnut)
  public userChartType: ChartType = 'doughnut';
  public userChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public userChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  // Chart configuration: Actividad Global (Bar)
  public activityChartType: ChartType = 'bar';
  public activityChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public activityChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: { y: { beginAtZero: true } },
    plugins: {
      legend: { display: false },
    },
  };

  constructor(
    private userService: UserService,
    private adminService: AdminService,
    private pacienteService: PacienteService,
    private fisioterapeutaService: FisioterapeutaService,
  ) {}

  ngOnInit(): void {
    this.userService.perfil().subscribe({
      next: (res: any) => {
        this.usuario = res;

        if (this.usuario?.rol === 'ADMIN') {
          this.cargarReporteAdmin();
        } else if (this.usuario?.rol === 'PACIENTE') {
          this.cargarResumenPaciente();
        } else if (this.usuario?.rol === 'FISIOTERAPEUTA') {
          this.cargarReporteFisio();
        }
      },
      error: (err) => {
        console.error('Error perfil', err);
      },
    });
  }

  cargarResumenPaciente() {
    // Al ser un dashboard simple del paciente, consultamos la rutina activa para ver si tiene ejercicios asignados
    if (this.usuario?.paciente_id) {
      this.pacienteService.obtenerMiRutinaActiva(this.usuario.paciente_id).subscribe({
        next: (res: any) => {
          this.reporte = {
            tieneRutina: true,
            fecha_inicio: res.rutina?.fecha_inicio,
            fecha_fin: res.rutina?.fecha_fin,
            total_ejercicios: res.ejercicios?.length || 0,
          };
        },
        error: () => {
          this.reporte = { tieneRutina: false };
        },
      });
    }
  }

  cargarReporteFisio() {
    this.cargandoReporte = true;
    this.fisioterapeutaService.obtenerReporteFisioterapeuta().subscribe({
      next: (res: any) => {
        this.reporte = res.data || res;
        this.cargandoReporte = false;
      },
      error: (err) => {
        console.error('No se pudo cargar el reporte del fisioterapeuta', err);
        this.cargandoReporte = false;
      },
    });
  }

  cargarReporteAdmin() {
    this.cargandoReporte = true;
    let fechaInicio: string | undefined;
    let fechaFin: string | undefined;
    
    const hoy = new Date();
    
    if (this.filtroTiempo === 'este_mes') {
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
      fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (this.filtroTiempo === 'mes_pasado') {
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().split('T')[0];
      fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().split('T')[0];
    } else if (this.filtroTiempo === 'ultimos_7_dias') {
      const pastDate = new Date();
      pastDate.setDate(hoy.getDate() - 7);
      fechaInicio = pastDate.toISOString().split('T')[0];
      fechaFin = hoy.toISOString().split('T')[0];
    }

    this.adminService.obtenerReporteGeneral(fechaInicio, fechaFin).subscribe({
      next: (res: any) => {
        this.reporte = res.data || res;
        this.cargandoReporte = false;
        this.setupCharts();
      },
      error: (err) => {
        console.error('No se pudo cargar el reporte admin', err);
        this.cargandoReporte = false;
      },
    });
  }

  cambiarFiltro() {
    if (this.usuario?.rol === 'ADMIN') {
      this.cargarReporteAdmin();
    }
  }

  setupCharts() {
    // Doughnut Chart Data
    this.userChartData = {
      labels: ['Pacientes', 'Fisioterapeutas'],
      datasets: [
        {
          data: [this.reporte.total_pacientes, this.reporte.total_fisioterapeutas],
          backgroundColor: ['#3b82f6', '#4f46e5'], // blue-500, indigo-600
          hoverBackgroundColor: ['#2563eb', '#4338ca'],
        },
      ],
    };

    // Bar Chart Data
    this.activityChartData = {
      labels: ['Rutinas Activas', 'Ejercicios Completados'],
      datasets: [
        {
          data: [this.reporte.rutinas_activas, this.reporte.ejercicios_realizados],
          backgroundColor: ['#ef4444', '#10b981'], // red-500, green-500
          borderRadius: 6,
        },
      ],
    };
  }
}
