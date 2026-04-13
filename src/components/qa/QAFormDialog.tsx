import { useState, useMemo, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Typography, Box, Grid, Avatar, Stack, Divider, IconButton,
  ToggleButton, ToggleButtonGroup, LinearProgress, TextField,
  Autocomplete, FormControl, InputLabel, Select, MenuItem,
  Paper, Tooltip, CircularProgress
} from '@mui/material';

// Iconos
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import ApartmentIcon from '@mui/icons-material/Apartment';
import SaveIcon from '@mui/icons-material/Save';
import WarningIcon from '@mui/icons-material/Warning';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';

import { QATemplate, QAQuestion } from '../../data/qaTemplates';
import { useEmployees } from '../../hooks/useEmployees';
import { useHotels } from '../../hooks/useHotels';
import { useAuth } from '../../hooks/useAuth';
import type { Employee, Hotel } from '../../types';

interface QAFormDialogProps {
  open: boolean;
  onClose: () => void;
  template: QATemplate | null;
  onSubmit: (data: any) => Promise<void>;
}

export default function QAFormDialog({ open, onClose, template, onSubmit }: QAFormDialogProps) {
  const { profile } = useAuth();
  const { employees } = useEmployees();
  const { hotels } = useHotels();
  
  // Estados del formulario
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, 'pass' | 'fail' | 'na'>>({});
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reiniciar selección al cambiar de hotel o abrir modal
  useEffect(() => {
    if (open) {
      setSelectedHotelId('');
      setTargetId('');
      setRoomNumber('');
      setAnswers({});
      setNotes('');
    }
  }, [open, template]);

  // Filtrar hoteles por zona del inspector
  const filteredHotels = useMemo(() => {
    if (profile?.role === 'INSPECTOR') {
      const userZone = profile?.assigned_zone;
      if (!userZone) return [];
      return hotels.filter(h => h.zone === userZone);
    }
    return hotels;
  }, [hotels, profile]);

  // Filtrar empleados basados en el hotel seleccionado
  const filteredEmployees = useMemo(() => {
    if (!selectedHotelId) return [];
    return employees.filter(e => e.hotelId === selectedHotelId);
  }, [employees, selectedHotelId]);

  // Cálculo del Score en tiempo real
  const score = useMemo(() => {
    if (!template) return 0;
    const answeredQuestions = template.questions.filter(q => answers[q.id] && answers[q.id] !== 'na');
    if (answeredQuestions.length === 0) return 0;

    let totalWeight = 0;
    let earnedWeight = 0;

    template.questions.forEach(q => {
      const ans = answers[q.id];
      if (ans && ans !== 'na') {
        const weight = q.isCritical ? 3 : 1; // PESO CRÍTICO x3
        totalWeight += weight;
        if (ans === 'pass') earnedWeight += weight;
      }
    });

    return Math.round((earnedWeight / totalWeight) * 100);
  }, [answers, template]);

  const handleAnswer = (questionId: string, value: 'pass' | 'fail' | 'na') => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSave = async () => {
    // Si es auditoría de hotel, el target es el hotel. 
    // Si es de staff/room, el target es el empleado.
    const finalTargetId = template?.id === 'hotel' ? selectedHotelId : targetId;

    if (!selectedHotelId) {
      alert('Por favor selecciona el hotel.');
      return;
    }

    if (template?.id !== 'hotel' && !targetId) {
      alert('Por favor selecciona el trabajador a auditar.');
      return;
    }

    if (template?.id === 'room' && !roomNumber) {
      alert('Por favor ingresa el número de habitación.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        type: template?.id,
        target_id: finalTargetId,
        room_number: roomNumber,
        answers,
        score,
        notes,
        zone: profile?.assigned_zone
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Agrupar preguntas por categoría
  const groupedQuestions = useMemo(() => {
    if (!template) return {};
    return template.questions.reduce((acc, q) => {
      if (!acc[q.category]) acc[q.category] = [];
      acc[q.category].push(q);
      return acc;
    }, {} as Record<string, QAQuestion[]>);
  }, [template]);

  if (!template) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper" PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ p: 3, background: 'linear-gradient(45deg, #0F172A 30%, #1e293b 90%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>{template.title}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>{template.description}</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </Box>
        <Box sx={{ width: '100%' }}>
          <LinearProgress 
            variant="determinate" 
            value={score} 
            sx={{ height: 8, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: score >= 90 ? '#4CAF50' : (score >= 70 ? '#FF9800' : '#f44336') } }} 
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
        {/* SELECCIÓN DEL OBJETIVO */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={template.id === 'hotel' ? 12 : 6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ApartmentIcon color="primary" /> Seleccionar Hotel
              </Typography>
              <Autocomplete
                options={filteredHotels}
                getOptionLabel={(option) => option.name}
                value={hotels.find(h => h.id === selectedHotelId) || null}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>{option.name}</li>
                )}
                onChange={(_, val) => {
                  setSelectedHotelId(val?.id || '');
                  setTargetId(''); // Resetear empleado al cambiar hotel
                }}
                renderInput={(params) => <TextField {...params} label="Hotel de la Auditoría" size="small" />}
              />
            </Grid>

            {template.id !== 'hotel' && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color="primary" /> Seleccionar Trabajador
                </Typography>
                <Autocomplete
                  disabled={!selectedHotelId}
                  options={filteredEmployees}
                  getOptionLabel={(option) => option.name}
                  value={employees.find(e => e.id === targetId) || null}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.role}</Typography>
                      </Box>
                    </li>
                  )}
                  onChange={(_, val) => setTargetId(val?.id || '')}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label={selectedHotelId ? "Buscar Empleado..." : "Primero selecciona un hotel"} 
                      size="small" 
                    />
                  )}
                />
              </Grid>
            )}

            {template.id === 'room' && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MeetingRoomIcon color="primary" /> Detalle de Habitación
                </Typography>
                <TextField 
                  fullWidth 
                  label="Número de Habitación" 
                  placeholder="Ej: 302, 415..." 
                  size="small"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                />
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* LISTADO DE PREGUNTAS */}
        <Stack spacing={4}>
          {Object.entries(groupedQuestions).map(([category, qs]) => (
            <Box key={category}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 900, letterSpacing: 1.2 }}>{category}</Typography>
              <Divider sx={{ mb: 2, mt: 0.5 }} />
              <Stack spacing={2}>
                {qs.map((q) => (
                  <Paper key={q.id} elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {q.isCritical && (
                        <Tooltip title="Punto Crítico">
                          <WarningIcon sx={{ color: '#f44336', fontSize: 18 }} />
                        </Tooltip>
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{q.text}</Typography>
                    </Box>
                    
                    <ToggleButtonGroup
                      value={answers[q.id] || ''}
                      exclusive
                      onChange={(_, val) => val && handleAnswer(q.id, val)}
                      size="small"
                      sx={{ bgcolor: 'white' }}
                    >
                      <ToggleButton value="pass" sx={{ px: 2, '&.Mui-selected': { bgcolor: 'success.main', color: 'white', '&:hover': { bgcolor: 'success.dark' } } }}>
                        <CheckCircleIcon sx={{ fontSize: 18, mr: 0.5 }} /> Cumple
                      </ToggleButton>
                      <ToggleButton value="fail" sx={{ px: 2, '&.Mui-selected': { bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } } }}>
                        <CancelIcon sx={{ fontSize: 18, mr: 0.5 }} /> No
                      </ToggleButton>
                      <ToggleButton value="na" sx={{ px: 2, '&.Mui-selected': { bgcolor: 'grey.500', color: 'white' } }}>
                        N/A
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Paper>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>

        {/* NOTAS ADICIONALES */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Observaciones Generales</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Escribe aquí cualquier detalle adicional..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            variant="outlined"
            sx={{ bgcolor: 'white', borderRadius: 2 }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: '#F8FAFC', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, color: score >= 90 ? 'success.main' : (score >= 70 ? 'warning.main' : 'error.main') }}>
            {score}%
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>CALIFICACIÓN<br/>PRELIMINAR</Typography>
        </Box>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 'bold' }}>Cancelar</Button>
        <Button 
          variant="contained" 
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={isSubmitting}
          sx={{ 
            px: 4, borderRadius: 2, fontWeight: 'bold',
            background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)',
            boxShadow: '0 4px 12px rgba(255, 87, 34, 0.3)'
          }}
        >
          Finalizar Auditoría
        </Button>
      </DialogActions>
    </Dialog>
  );
}
