import * as XLSX from 'xlsx';
import type { Employee, Hotel } from '../types';

/**
 * EXPORTACIÓN PROFESIONAL DE EMPLEADOS (AWS NATIVE)
 */
export const exportEmployeesToExcel = (employees: Employee[], hotels: Hotel[]) => {
  const tableColumn = [
    'ID Sistema', 'Nº Empleado', 'Nombre Completo', 'Cargo', 
    'Teléfono', 'Email Personal', 'Tipo Personal', 'Tipo Nómina', 
    'Hotel Asignado', 'Ciudad', 'Estado', 'Doc. Completa', 
    'Lista Negra', 'Motivo Restricción'
  ];
  const tableRows: any[] = [];

  employees.forEach(employee => {
    const hotel = hotels.find(h => h.id === employee.hotelId);
    const employeeData = [
      employee.id,
      employee.employeeNumber,
      employee.name,
      employee.role,
      employee.phone || 'N/A',
      employee.email || 'N/A',
      employee.employeeType,
      employee.payrollType,
      hotel ? hotel.name : "SIN ASIGNAR",
      hotel ? hotel.city : "N/A",
      employee.isActive ? 'Activo' : 'Inactivo',
      employee.documentacion_completa ? 'Sí' : 'Pendiente',
      employee.isBlacklisted ? 'SÍ (Baneado)' : 'No',
      employee.blacklistReason || '-'
    ];
    tableRows.push(employeeData);
  });

  const ws = XLSX.utils.aoa_to_sheet([tableColumn, ...tableRows]);
  
  // Ajuste automático de ancho de columnas para legibilidad
  const wscols = tableColumn.map(c => ({ wch: c.length + 12 }));
  ws['!cols'] = wscols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Panel de Personal");
  XLSX.writeFile(wb, `Reporte_Personal_OranjeApp_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * EXPORTACIÓN EJECUTIVA DE HOTELES (AWS NATIVE)
 */
export const exportHotelsToExcel = (hotels: Hotel[]) => {
  const tableColumn = [
    'Código Hotel', 'Nombre del Hotel', 'Zona', 'Ciudad', 'Dirección', 
    'Gerente / Contacto', 'Teléfono', 'Email Oficial', 'Plantilla Total', 'Personal Activo'
  ];
  const tableRows: any[] = [];

  hotels.forEach(hotel => {
    const hotelData = [
      hotel.hotelCode || 'S/C',
      hotel.name,
      hotel.zone,
      hotel.city,
      hotel.address,
      hotel.managerName || 'No Registrado',
      hotel.phone || 'No Registrado',
      hotel.email || 'No Registrado',
      hotel.totalEmployees || 0,
      hotel.activeEmployees || 0,
    ];
    tableRows.push(hotelData);
  });

  const ws = XLSX.utils.aoa_to_sheet([tableColumn, ...tableRows]);
  
  // Ajuste de diseño profesional
  const wscols = tableColumn.map(c => ({ wch: c.length + 15 }));
  ws['!cols'] = wscols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Directorio de Hoteles");
  XLSX.writeFile(wb, `Reporte_Hoteles_OranjeApp_${new Date().toISOString().split('T')[0]}.xlsx`);
};
