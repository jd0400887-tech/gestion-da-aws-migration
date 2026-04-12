import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

export type QualityLevel = 'Elite' | 'Standard' | 'Below Standard' | 'No Data';

export function useEmployeeQuality(employeeId: string) {
  const [iq, setIq] = useState<number | null>(null);
  const [level, setLevel] = useState<QualityLevel>('No Data');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchQuality = async () => {
      if (!employeeId) {
        if (isMounted) setLoading(false);
        return;
      }
      
      try {
        const client = generateClient<Schema>();
        const { data: audits } = await client.models.QAAudit.list({
          filter: { employee_id: { eq: employeeId } }
        });

        if (!isMounted) return;

        if (!audits || audits.length === 0) {
          setIq(null);
          setLevel('No Data');
        } else {
          const recentAudits = [...audits]
            .sort((a, b) => new Date(b.audit_date).getTime() - new Date(a.audit_date).getTime())
            .slice(0, 5);

          const avg = Math.round(recentAudits.reduce((acc, curr) => acc + curr.score, 0) / recentAudits.length);
          setIq(avg);
          
          if (avg >= 95) setLevel('Elite');
          else if (avg >= 80) setLevel('Standard');
          else setLevel('Below Standard');
        }
      } catch (error) {
        console.error('Error fetching employee quality:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQuality();
    return () => { isMounted = false; };
  }, [employeeId]);

  return { iq, level, loading };
}
