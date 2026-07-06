import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  generarInformeDeAlta(pacienteInfo: any, patologia: any, rutinaInfo: any, historial: any[]) {
    const doc = new jsPDF();
    
    // Configuración de la fuente
    doc.setFont("helvetica");

    // === TÍTULO PRINCIPAL ===
    doc.setFontSize(22);
    doc.setTextColor(30, 64, 175); // Azul oscuro
    doc.text("INFORME DE ALTA MÉDICA", 105, 20, { align: "center" });

    // === LÍNEA SEPARADORA ===
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, 25, 195, 25);

    // === DATOS DEL PACIENTE ===
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Datos del Paciente", 15, 35);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const pacienteNombre = `${pacienteInfo?.nombres || ''} ${pacienteInfo?.apellidos || ''}`;
    const fechaEmision = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    
    doc.text(`Nombre: ${pacienteNombre}`, 15, 45);
    doc.text(`Identificación: ${pacienteInfo?.cedula || 'N/A'}`, 15, 52);
    doc.text(`Fecha de Emisión: ${fechaEmision}`, 15, 59);

    // === DATOS CLÍNICOS ===
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen Clínico", 15, 72);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const diagnostico = patologia?.nombre || 'Sin diagnóstico registrado';
    const fase = pacienteInfo?.fase_recuperacion || 'N/A';
    const dolor = pacienteInfo?.nivel_dolor !== undefined ? `${pacienteInfo.nivel_dolor}/10` : 'N/A';
    
    doc.text(`Diagnóstico de Tratamiento: ${diagnostico}`, 15, 82);
    doc.text(`Fase de Recuperación Final: ${fase}`, 15, 89);
    doc.text(`Nivel de Dolor Reportado: ${dolor}`, 15, 96);

    // === DATOS DE LA RUTINA ===
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Desempeño del Plan Físico", 15, 109);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Días Planificados: ${rutinaInfo?.totalDiasPlan || 0}`, 15, 119);
    doc.text(`Días Completados: ${rutinaInfo?.diasCompletados || 0}`, 15, 126);
    doc.text(`Progreso Global: ${rutinaInfo?.progresoGlobal || 0}%`, 15, 133);

    // === TABLA DE HISTORIAL DE ACTIVIDAD ===
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Historial de Rutinas Finalizadas", 15, 148);

    const bodyData = historial.map((h: any) => {
      const fechaFin = h.fecha_finalizacion ? new Date(h.fecha_finalizacion).toLocaleDateString() : 'N/A';
      return [
        h.patologia_nombre || 'N/A',
        `${h.total_ejercicios} ejercicios`,
        fechaFin,
        h.observaciones || 'Sin observaciones'
      ];
    });

    if (bodyData.length > 0) {
      autoTable(doc, {
        startY: 153,
        head: [['Patología Tratada', 'Carga Asignada', 'Fecha Finalización', 'Observaciones']],
        body: bodyData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        styles: { fontSize: 10, cellPadding: 4 }
      });
    } else {
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("No se registraron rutinas finalizadas anteriores.", 15, 155);
    }

    // === FIRMA ===
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 155;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    doc.line(70, finalY + 40, 140, finalY + 40);
    doc.text("Firma del Fisioterapeuta", 105, finalY + 47, { align: "center" });

    // Descargar el archivo
    const fileName = `Alta_Medica_${pacienteInfo?.nombres || 'Paciente'}_${pacienteInfo?.apellidos || ''}.pdf`.replace(/\s+/g, '_');
    doc.save(fileName);
  }
}
