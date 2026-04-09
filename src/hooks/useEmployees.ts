import { useHotels } from './useHotels';
import { employeeService } from '../services/employeeService';
import { usePositions } from './usePositions';
import type { Employee } from '../types';
import { useCallback, useMemo } from 'react';

/**
 * HOOK DE GESTIÓN DE EMPLEADOS (AWS CLOUD)
 * Centraliza la lógica de personal y sincroniza con cargos dinámicos.
 */
export function useEmployees() {
  const { employees, refreshHotels, loading } = useHotels();
  const { positions } = usePositions();

  const roles = useMemo(() => {
    return positions.map(p => p.name);
  }, [positions]);

  const addEmployee = useCallback(async (employee: Partial<Employee>) => {
    await employeeService.create(employee);
    await refreshHotels();
  }, [refreshHotels]);

  const updateEmployee = useCallback(async (employee: Partial<Employee>) => {
    if (!employee.id) return;
    await employeeService.update(employee.id, employee);
    await refreshHotels();
  }, [refreshHotels]);

  const deleteEmployee = useCallback(async (id: string) => {
    await employeeService.delete(id);
    await refreshHotels();
  }, [refreshHotels]);

  const toggleEmployeeBlacklist = useCallback(async (id: string) => {
    const employee = employees.find(e => e.id === id);
    if (!employee) return;

    const updateData: Partial<Employee> = {
      id,
      isBlacklisted: !employee.isBlacklisted,
      // Si estamos activando la lista negra, desactivamos al empleado
      isActive: employee.isBlacklisted ? employee.isActive : false
    };

    await updateEmployee(updateData);
  }, [employees, updateEmployee]);

  return {
    employees,
    roles, // Estos son ahora los cargos dinámicos de AWS
    addEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeBlacklist,
    loading
  };
}
