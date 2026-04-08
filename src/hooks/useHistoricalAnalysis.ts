import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

export function useHistoricalAnalysis() {
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistoricalData = useCallback(async () => {
    setLoading(true);
    try {
      const client = generateClient<Schema>();
      
      // Consultamos el historial de nóminas y empleados de AWS RDS
      const { data: reviews } = await client.models.PayrollReview.list();
      const { data: employees } = await client.models.Employee.list();

      // Agrupamos datos por mes para el análisis histórico
      const analysis = employees.map(emp => {
        const empReviews = reviews.filter(r => r.employee_id === emp.id);
        return {
          employeeName: emp.name,
          totalReviews: empReviews.length,
          avgOvertime: empReviews.reduce((acc, curr) => acc + (curr.overtime_hours || 0), 0) / (empReviews.length || 1)
        };
      });

      setHistoricalData(analysis);
    } catch (error) {
      console.error('Error en análisis histórico de AWS:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  return { historicalData, loading, refresh: fetchHistoricalData };
}
