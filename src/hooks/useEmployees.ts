import { useHotels } from './useHotels';
import { employeeService } from '../services/employeeService';
import type { Employee } from '../types';
import { useCallback, useMemo } from 'react';
import { EMPLOYEE_POSITIONS } from '../data/constants';

export function useEmployees() {
  const { employees, refreshHotels } = useHotels();

  const roles = useMemo(() => {
    return EMPLOYEE_POSITIONS;
  }, []);

  const addEmployee = useCallback(async (employeeData: Partial<Employee>) => {
    await employeeService.create(employeeData);
    refreshHotels();
  }, [refreshHotels]);

  const updateEmployee = useCallback(async (updatedEmployee: Partial<Employee>) => {
    if (!updatedEmployee.id) return;
    await employeeService.update(updatedEmployee.id, updatedEmployee);
    refreshHotels();
  }, [refreshHotels]);

  const deleteEmployee = useCallback(async (id: string) => {
    await employeeService.delete(id);
    refreshHotels();
  }, [refreshHotels]);

  const toggleEmployeeBlacklist = useCallback(async (id: string) => {
    const employee = employees.find(e => e.id === id);
    if (!employee) return;

    const isBlacklisting = !employee.isBlacklisted;
    const updateData: Partial<Employee> = { id, isBlacklisted: isBlacklisting };

    if (isBlacklisting) {
      if (employee.isActive) {
        updateData.isActive = false;
      }
    } else {
      updateData.isActive = employee.isActive;
    }

    await updateEmployee(updateData);
  }, [employees, updateEmployee]);

  return {
    employees,
    roles,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeBlacklist,
  };
}
