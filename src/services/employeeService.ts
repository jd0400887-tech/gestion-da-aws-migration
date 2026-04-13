import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { Employee } from '../types';

/**
 * SERVICIO PROFESIONAL DE EMPLEADOS (AWS RDS)
 * Sincronizado con esquema original PostgreSQL (snake_case).
 */
export const employeeService = {
  getClient() {
    return generateClient<Schema>();
  },

  async getAll(): Promise<Employee[]> {
    try {
      const client = this.getClient();
      console.info('📡 [AWS] Consultando empleados en RDS PostgreSQL...');
      const { data: employees, errors } = await client.models.Employee.list();
      
      if (errors) {
        console.warn('⚠️ [AWS] Avisos al listar empleados:', errors);
      }

      if (!employees || employees.length === 0) {
        console.info('ℹ️ [AWS] No se encontraron empleados en la base de datos.');
        return [];
      }

      console.info(`✅ [AWS] Se recuperaron ${employees.length} empleados.`);
      
      return employees.map(emp => ({
        id: emp.id,
        employeeNumber: emp.employee_number || 'N/A',
        name: emp.name,
        hotelId: emp.current_hotel_id || '',
        role: emp.role,
        isActive: emp.is_active ?? true,
        employeeType: (emp.employee_type as any) || 'permanente',
        phone: emp.phone || '',
        email: emp.email || '',
        isBlacklisted: emp.is_blacklisted ?? false,
        blacklistReason: emp.blacklist_reason || '',
        payrollType: (emp.payroll_type as any) || 'timesheet',
        documentacion_completa: emp.documentacion_completa ?? true,
        lastReviewedTimestamp: emp.last_reviewed_timestamp || null,
        image_url: emp.image_url || null
      }));
    } catch (error: any) {
      if (error.message?.includes('No current user')) return [];
      console.error('❌ Error al obtener empleados de RDS:', error);
      return [];
    }
  },

  async create(employee: Partial<Employee>): Promise<void> {
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
        current_hotel_id: employee.hotelId || '',
        is_active: employee.isActive ?? true,
        employee_type: employee.employeeType || 'permanente',
        phone: employee.phone,
        email: employee.email,
        is_blacklisted: employee.isBlacklisted ?? false,
        blacklist_reason: employee.blacklistReason,
        payroll_type: employee.payrollType || 'timesheet',
        documentacion_completa: employee.documentacion_completa ?? true
      });
    } catch (error) {
      console.error('❌ Error al crear empleado en RDS:', error);
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
        current_hotel_id: updates.hotelId,
        is_active: updates.isActive,
        employee_type: updates.employeeType,
        phone: updates.phone,
        email: updates.email,
        is_blacklisted: updates.isBlacklisted,
        blacklist_reason: updates.blacklistReason,
        payroll_type: updates.payrollType,
        documentacion_completa: updates.documentacion_completa,
        last_reviewed_timestamp: updates.lastReviewedTimestamp
      });
    } catch (error) {
      console.error('❌ Error al actualizar empleado en RDS:', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.models.Employee.delete({ id });
    } catch (error) {
      console.error('❌ Error al eliminar empleado en RDS:', error);
    }
  }
};
