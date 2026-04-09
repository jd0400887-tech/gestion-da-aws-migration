import { Grid, Box, Typography } from '@mui/material';
import EmployeeCard from './EmployeeCard';
import type { Employee, Hotel } from '../../types';
import PeopleIcon from '@mui/icons-material/People';

interface EmployeeGridProps {
  employees: Employee[];
  hotels: Hotel[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export default function EmployeeGrid({ employees, hotels, onEdit, onDelete }: EmployeeGridProps) {
  if (employees.length === 0) {
    return (
      <Box sx={{ py: 10, textAlign: 'center', opacity: 0.5 }}>
        <PeopleIcon sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h6">No hay colaboradores que coincidan</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {employees.map((employee) => (
        <Grid item key={employee.id} xs={12} sm={6} md={4} lg={3}>
          <EmployeeCard 
            employee={employee} 
            hotels={hotels || []} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        </Grid>
      ))}
    </Grid>
  );
}
