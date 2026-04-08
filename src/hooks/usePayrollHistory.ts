import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

export interface PayrollReview {
  id: string;
  employee_id: string;
  review_date: string;
  overtime_hours: number | null;
}

export function usePayrollHistory(from: Date, to: Date) {
  const [history, setHistory] = useState<PayrollReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const client = generateClient<Schema>();
      const { data } = await client.models.PayrollReview.list();
      
      // Filtro manual por fecha (AWS Amplify list no siempre soporta filtros complejos de fecha en RDS por defecto)
      const filtered = data.filter(r => {
        const date = new Date(r.review_date);
        return date >= from && date <= to;
      });

      setHistory(filtered.map(r => ({
        id: r.id,
        employee_id: r.employee_id,
        review_date: r.review_date,
        overtime_hours: r.overtime_hours || 0
      })));
    } catch (error) {
      console.error('Error fetching payroll history from AWS:', error);
      setHistory([]);
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    if (from && to) {
      fetchHistory();
    }
  }, [from, to, fetchHistory]);

  return { history, loading, refreshHistory: fetchHistory };
}
