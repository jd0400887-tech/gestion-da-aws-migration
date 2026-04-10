import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import RequestCard from './RequestCard';
import type { StaffingRequest, Hotel } from '../../types';

interface KanbanColumnProps {
  id: string;
  title: string;
  requests: StaffingRequest[];
  hotels: Hotel[]; // Añadimos la prop de hoteles
  bgColor?: string;
  textColor?: string;
  onEditRequest: (request: StaffingRequest) => void;
  onArchiveRequest: (id: string) => void;
  onDeleteRequest?: (id: string) => void;
}

export default function KanbanColumn({ 
  id, title, requests, hotels, onEditRequest, onArchiveRequest, onDeleteRequest 
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  return (
    <Paper sx={{
      height: '100%',
      p: 1.5,
      borderRadius: '16px',
      backgroundColor: isLight ? '#F1F5F9' : 'rgba(0, 0, 0, 0.2)',
      border: '1px solid',
      borderColor: isOver ? '#00BCD4' : (isLight ? '#E2E8F0' : 'rgba(255, 87, 34, 0.3)'),
      boxShadow: isOver ? '0 0 8px #00BCD4' : 'none',
      transition: 'all 0.2s ease-in-out',
      minWidth: '280px'
    }}>
      <Typography variant="subtitle1" gutterBottom sx={{
        textTransform: 'uppercase',
        color: isLight ? '#475569' : 'primary.main',
        fontWeight: 800,
        fontSize: '0.75rem',
        letterSpacing: '1px',
        mb: 2,
        px: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {title} 
        <Box component="span" sx={{ 
          backgroundColor: isLight ? '#CBD5E1' : 'rgba(255,255,255,0.1)', 
          px: 1, py: 0.2, borderRadius: '10px', fontSize: '0.7rem'
        }}>
          {requests.length}
        </Box>
      </Typography>

      <SortableContext id={id} items={requests} strategy={verticalListSortingStrategy}>
        <Box ref={setNodeRef} sx={{ 
          minHeight: '200px', 
          maxHeight: 'calc(100vh - 350px)',
          overflowY: 'auto', 
          p: 0.5
        }}>
          {requests.map(request => {
            // Enriquecemos la solicitud con el nombre del hotel antes de pasarla a la tarjeta
            const hotel = hotels.find(h => h.id === request.hotel_id);
            const enrichedRequest = {
              ...request,
              hotelName: hotel ? hotel.name : 'Hotel no encontrado'
            };

            return (
              <RequestCard 
                key={request.id} 
                request={enrichedRequest} 
                onEdit={onEditRequest} 
                onArchive={onArchiveRequest} // Pasar la función a la tarjeta
              />
            );
          })}
        </Box>
      </SortableContext>
    </Paper>
  );
}
