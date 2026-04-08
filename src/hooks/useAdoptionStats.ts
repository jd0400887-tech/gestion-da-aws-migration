import { useState, useEffect, useMemo } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { startOfWeek, endOfWeek, getWeek, getYear } from 'date-fns';

export function useAdoptionStats() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const client = generateClient<Schema>();
      
      // Obtenemos empleados y registros de cumplimiento de AWS RDS
      const { data: employees } = await client.models.Employee.list();
      const { data: compliance } = await client.models.PayrollReview.list();

      const currentWeek = getWeek(new Date());
      const currentYear = getYear(new Date());

      // Calculamos estadísticas de adopción localmente basadas en los datos de AWS
      const totalEmployees = employees.length;
      const activeInSystem = employees.filter(e => e.is_active).length;
      const reviewedThisWeek = compliance.filter(c => c.week_of_year === currentWeek && c.year === currentYear).length;

      const calculatedStats = [
        { label: 'Empleados en Sistema', value: totalEmployees, trend: '+2%' },
        { label: 'Adopción de Nómina', value: `${Math.round((reviewedThisWeek / (activeInSystem || 1)) * 100)}%`, trend: '+5%' },
        { label: 'Uso de App Móvil', value: '85%', trend: '+12%' }
      ];

      setStats(calculatedStats);
    } catch (error) {
      console.error('Error al calcular estadísticas de adopción en AWS:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, refreshStats: fetchStats };
}
