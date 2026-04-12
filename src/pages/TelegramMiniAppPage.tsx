import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Button, Stack, TextField, 
  Autocomplete, CircularProgress, IconButton, Alert,
  Stepper, Step, StepLabel, Container, Avatar
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Iconos
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ApartmentIcon from '@mui/icons-material/Apartment';

import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { useHotels } from '../hooks/useHotels';
import { usePositions } from '../hooks/usePositions';

export default function TelegramMiniAppPage() {
  const { hotels } = useHotels();
  const { positions } = usePositions();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    hotel_id: '',
    role: '',
    quantity: 1,
    type: 'temporal',
    date: new Date().toISOString().split('T')[0],
    time: '07:00'
  });

  const steps = ['Hotel', 'Cargo', 'Detalles', 'Confirmar'];

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const client = generateClient<Schema>();
      const request_number = `SR${new Date().getFullYear().toString().slice(-2)}-${Math.floor(Math.random()*900)+100}`;
      
      await client.models.StaffingRequest.create({
        request_number,
        hotel_id: formData.hotel_id,
        role: formData.role,
        quantity: formData.quantity,
        status: 'Pendiente',
        priority: 'medium',
        request_date: new Date().toISOString().split('T')[0],
        required_date: formData.date,
        notes: `Solicitud creada vía Oranje Portal (Telegram Mini App). Turno: ${formData.time}`,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Error al crear la solicitud");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 5, bgcolor: 'transparent' }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'success.main', mx: 'auto', mb: 3 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 50 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>🍊 ¡Listo!</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Tu solicitud ha sido enviada al equipo de reclutamiento.
            </Typography>
            <Button variant="contained" fullWidth onClick={() => window.location.reload()} sx={{ borderRadius: 3, py: 1.5, fontWeight: 'bold' }}>
              Hacer otra solicitud
            </Button>
          </Paper>
        </motion.div>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 5 }}>
      {/* HEADER MINI APP */}
      <Box sx={{ p: 3, background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)', color: 'white', borderRadius: '0 0 24px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Oranje Portal 🍊</Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Nueva Solicitud de Personal</Typography>
          </Box>
          <Avatar src="/vite.svg" sx={{ width: 32, height: 32 }} />
        </Stack>
      </Box>

      <Container maxWidth="xs" sx={{ mt: -2 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)' }}>
          
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.65rem', fontWeight: 800 } }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <AnimatePresence mode="wait">
            {activeStep === 0 && (
              <motion.div key="step0" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ApartmentIcon color="primary" fontSize="small" /> ¿Para qué hotel?
                </Typography>
                <Autocomplete
                  options={hotels}
                  getOptionLabel={(option) => option.name}
                  value={hotels.find(h => h.id === formData.hotel_id) || null}
                  onChange={(_, val) => setFormData({ ...formData, hotel_id: val?.id || '' })}
                  renderInput={(params) => <TextField {...params} label="Selecciona el Hotel" variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />}
                />
                <Button disabled={!formData.hotel_id} variant="contained" fullWidth onClick={handleNext} sx={{ mt: 4, py: 1.5, borderRadius: 3, fontWeight: 'bold' }}>Continuar</Button>
              </motion.div>
            )}

            {activeStep === 1 && (
              <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkIcon color="primary" fontSize="small" /> ¿Qué cargo necesitas?
                </Typography>
                <Stack spacing={1}>
                  {positions.map((pos) => (
                    <Paper 
                      key={pos.id} 
                      onClick={() => { setFormData({ ...formData, role: pos.name }); handleNext(); }}
                      sx={{ 
                        p: 2, borderRadius: 3, cursor: 'pointer', border: '1px solid',
                        borderColor: formData.role === pos.name ? 'primary.main' : 'rgba(0,0,0,0.05)',
                        bgcolor: formData.role === pos.name ? 'rgba(255, 87, 34, 0.05)' : 'white',
                        transition: 'all 0.2s', '&:active': { transform: 'scale(0.98)' }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{pos.name}</Typography>
                    </Paper>
                  ))}
                </Stack>
                <Button onClick={handleBack} sx={{ mt: 2, color: 'text.secondary', fontWeight: 'bold' }}>Regresar</Button>
              </motion.div>
            )}

            {activeStep === 2 && (
              <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>Detalles de la Solicitud</Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', ml: 1 }}>PERSONAS</Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      {[1, 2, 3, 5].map(n => (
                        <Avatar 
                          key={n} 
                          onClick={() => setFormData({ ...formData, quantity: n })}
                          sx={{ 
                            width: 45, height: 45, cursor: 'pointer', 
                            bgcolor: formData.quantity === n ? 'primary.main' : 'rgba(0,0,0,0.05)',
                            color: formData.quantity === n ? 'white' : 'text.primary',
                            fontSize: '1rem', fontWeight: 900, transition: 'all 0.2s'
                          }}
                        >
                          {n}
                        </Avatar>
                      ))}
                    </Stack>
                  </Box>

                  <TextField
                    type="date"
                    label="Fecha de Inicio"
                    fullWidth
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', ml: 1 }}>TURNO</Typography>
                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                      {[
                        { t: '07:00', l: 'Mañana' },
                        { t: '14:00', l: 'Tarde' },
                        { t: '22:00', l: 'Noche' }
                      ].map(turno => (
                        <Grid item xs={4} key={turno.t}>
                          <Paper 
                            onClick={() => setFormData({ ...formData, time: turno.t })}
                            sx={{ 
                              p: 1, textAlign: 'center', borderRadius: 2, cursor: 'pointer',
                              bgcolor: formData.time === turno.t ? 'primary.main' : 'white',
                              color: formData.time === turno.t ? 'white' : 'text.primary',
                              border: '1px solid rgba(0,0,0,0.05)'
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 900 }}>{turno.l}</Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Stack>
                <Button variant="contained" fullWidth onClick={handleNext} sx={{ mt: 4, py: 1.5, borderRadius: 3, fontWeight: 'bold' }}>Revisar Solicitud</Button>
                <Button onClick={handleBack} fullWidth sx={{ mt: 1, color: 'text.secondary', fontWeight: 'bold' }}>Regresar</Button>
              </motion.div>
            )}

            {activeStep === 3 && (
              <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Confirmar Solicitud 🍊</Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#F8FAFC', mb: 3 }}>
                  <Stack spacing={1.5}>
                    <DetailRow icon={<ApartmentIcon fontSize="small"/>} label="Hotel" value={hotels.find(h => h.id === formData.hotel_id)?.name} />
                    <DetailRow icon={<WorkIcon fontSize="small"/>} label="Cargo" value={formData.role} />
                    <DetailRow icon={<PeopleIcon fontSize="small"/>} label="Cantidad" value={`${formData.quantity} Persona(s)`} />
                    <DetailRow icon={<DateRangeIcon fontSize="small"/>} label="Inicio" value={formData.date} />
                    <DetailRow icon={<AccessTimeIcon fontSize="small"/>} label="Turno" value={formData.time} />
                  </Stack>
                </Paper>

                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

                <Button 
                  variant="contained" 
                  fullWidth 
                  disabled={loading}
                  onClick={handleSubmit} 
                  sx={{ 
                    py: 2, borderRadius: 3, fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #FF5722 30%, #FF8A65 90%)',
                    boxShadow: '0 4px 15px rgba(255, 87, 34, 0.3)'
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirmar y Enviar'}
                </Button>
                <Button onClick={handleBack} fullWidth sx={{ mt: 1, color: 'text.secondary', fontWeight: 'bold' }}>Regresar</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Paper>
      </Container>
    </Box>
  );
}

function DetailRow({ icon, label, value }: any) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem' }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>{value}</Typography>
      </Box>
    </Stack>
  );
}
