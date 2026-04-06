import type { Employee, EmployeeAssignment } from '../types';

/**
 * MOCK DATABASE - Empleados
 */
let mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    employeeNumber: '1001',
    name: 'Juan Perez',
    hotelId: 'hotel-1',
    isActive: true,
    role: 'Camarista',
    employeeType: 'permanente',
    isBlacklisted: false,
    payrollType: 'timesheet',
    lastReviewedTimestamp: null,
    documentacion_completa: true,
    assignments: [
      { id: 'asgn-1', employeeId: 'emp-1', hotelId: 'hotel-1', role: 'Camarista', startDate: '2025-01-01', status: 'active' }
    ]
  },
  {
    id: 'emp-2',
    employeeNumber: '1002',
    name: 'Maria Lopez',
    hotelId: 'hotel-2',
    isActive: true,
    role: 'Recepcionista',
    employeeType: 'temporal',
    isBlacklisted: false,
    payrollType: 'Workrecord',
    lastReviewedTimestamp: null,
    documentacion_completa: true,
    assignments: [
      { id: 'asgn-2', employeeId: 'emp-2', hotelId: 'hotel-2', role: 'Recepcionista', startDate: '2025-01-01', status: 'active' }
    ]
  }
];

export const employeeService = {
  async getAll(): Promise<Employee[]> {
    console.info('[OFFLINE] Obteniendo empleados mock con historial');
    return [...mockEmployees];
  },

  async create(employee: Partial<Employee>): Promise<void> {
    const newId = `emp-${Date.now()}`;
    
    // GENERACIÓN AUTOMÁTICA DEL NÚMERO DE EMPLEADO (Formato: YY-NNN)
    let finalEmployeeNumber = employee.employeeNumber;
    
    if (!finalEmployeeNumber) {
      const currentYear = new Date().getFullYear().toString().slice(-2); // "26"
      const yearPrefix = `${currentYear}-`;
      
      // Buscar el número más alto del año actual
      const sameYearNumbers = mockEmployees
        .map(e => e.employeeNumber)
        .filter(num => num.startsWith(yearPrefix))
        .map(num => parseInt(num.split('-')[1] || '0'))
        .sort((a, b) => b - a);
      
      const nextId = (sameYearNumbers[0] || 0) + 1;
      finalEmployeeNumber = `${yearPrefix}${nextId.toString().padStart(3, '0')}`;
    }

    const newEmployee: Employee = {
      ...employee,
      id: newId,
      employeeNumber: finalEmployeeNumber,
      assignments: employee.hotelId ? [
        { 
          id: `asgn-${Date.now()}`, 
          employeeId: newId, 
          hotelId: employee.hotelId, 
          role: employee.role || 'Sin Cargo', 
          startDate: new Date().toISOString().split('T')[0], 
          status: 'active' 
        }
      ] : []
    } as Employee;
    
    mockEmployees.push(newEmployee);
    console.info('[OFFLINE] Empleado creado con Nº:', finalEmployeeNumber);
  },

  async update(id: string, updates: Partial<Employee>): Promise<void> {
    const existingIndex = mockEmployees.findIndex(e => e.id === id);
    if (existingIndex === -1) return;

    const oldEmployee = mockEmployees[existingIndex];
    
    // LÓGICA DE TRASLADO: Detectar si el hotel cambió
    if (updates.hotelId && updates.hotelId !== oldEmployee.hotelId) {
      console.info('[OFFLINE] ¡Traslado detectado! De:', oldEmployee.hotelId, 'a:', updates.hotelId);
      
      const assignments = oldEmployee.assignments || [];
      
      // 1. Cerrar asignación actual
      const updatedAssignments: EmployeeAssignment[] = assignments.map(as => 
        as.status === 'active' ? { ...as, status: 'transferred', endDate: new Date().toISOString().split('T')[0] } : as
      );

      // 2. Abrir nueva asignación
      updatedAssignments.push({
        id: `asgn-${Date.now()}`,
        employeeId: id,
        hotelId: updates.hotelId,
        role: updates.role || oldEmployee.role,
        startDate: new Date().toISOString().split('T')[0],
        status: 'active'
      });

      updates.assignments = updatedAssignments;
    }

    mockEmployees[existingIndex] = { ...oldEmployee, ...updates };
    console.info('[OFFLINE] Empleado actualizado con historial:', id, updates);
  },

  async delete(id: string): Promise<void> {
    mockEmployees = mockEmployees.filter(e => e.id !== id);
    console.info('[OFFLINE] Empleado y su historial eliminados:', id);
  }
};
