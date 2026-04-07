import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { Employee } from '../types';

/**
 * SERVICIO PROFESIONAL DE EMPLEADOS (AWS AMPLIFY)
 * Conexión directa con la base de datos en la nube.
 */
export const employeeService = {
  // Generamos el cliente dentro de las funciones para asegurar que Amplify esté configurado
  getClient() {
    return generateClient<Schema>();
  },

  async getAll(): Promise<Employee[]> {
    console.info('📡 [AWS] Intentando obtener empleados de la nube...');
    try {
      const client = this.getClient();
      const { data: employees } = await client.models.Employee.list();
      console.info(`✅ [AWS] ${employees.length} empleados obtenidos.`);
      return employees.map(emp => ({
        id: emp.id,
        employeeNumber: emp.employee_number,
        name: emp.name,
        hotelId: emp.hotelId || '',
        role: emp.role,
        isActive: emp.is_active || true,
        employeeType: (emp.employee_type as 'permanente' | 'temporal') || 'permanente',
        payrollType: (emp.payroll_type as 'timesheet' | 'Workrecord') || 'timesheet',
        documentacion_completa: emp.documentacion_completa || true,
        isBlacklisted: false,
        lastReviewedTimestamp: null,
      }));
    } catch (error) {
      console.error('❌ Error al obtener empleados de AWS:', error);
      return [];
    }
  },

  async create(employee: Partial<Employee>): Promise<void> {
    console.info('📡 [AWS] Creando nuevo empleado en la nube...');
    try {
      const client = this.getClient();
      let finalNumber = employee.employeeNumber;
      if (!finalNumber) {
        const year = new Date().getFullYear().toString().slice(-2);
        finalNumber = `${year}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      }

      await client.models.Employee.create({
        employee_number: finalNumber,
        name: employee.name || 'Sin Nombre',
        role: employee.role || 'Sin Cargo',
        hotelId: employee.hotelId,
        is_active: true,
        employee_type: employee.employeeType || 'permanente',
        payroll_type: employee.payrollType || 'timesheet',
        documentacion_completa: employee.documentacion_completa ?? true,
      });
      
      console.info('✅ Empleado creado exitosamente en AWS.');
    } catch (error) {
      console.error('❌ Error al crear empleado en AWS:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Employee>): Promise<void> {
    try {
      const client = this.getClient();
      await client.models.Employee.update({
        id,
        name: updates.name,
        role: updates.role,
        hotelId: updates.hotelId,
        is_active: updates.isActive,
        employee_type: updates.employeeType,
        payroll_type: updates.payrollType,
        documentacion_completa: updates.documentacion_completa
      });
    } catch (error) {
      console.error('❌ Error al actualizar en AWS:', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.models.Employee.delete({ id });
    } catch (error) {
      console.error('❌ Error al eliminar en AWS:', error);
    }
  }
};
