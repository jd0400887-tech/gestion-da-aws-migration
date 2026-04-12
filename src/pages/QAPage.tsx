import { useState, useMemo, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Button, Stack, Avatar, 
  Chip, Divider, useTheme, Card, CardContent,
  List, ListItem, ListItemAvatar, ListItemText, CircularProgress,
  Tooltip, Snackbar, Alert, Tabs, Tab
} from '@mui/material';

// Iconos
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PersonIcon from '@mui/icons-material/Person';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';

import { useAuth } from '../hooks/useAuth';
import { QA_TEMPLATES, QATemplate } from '../data/qaTemplates';
import QAFormDialog from '../components/qa/QAFormDialog';
import QADetailsDialog from '../components/qa/QADetailsDialog';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { useHotels } from '../hooks/useHotels';
import { useEmployees } from '../hooks/useEmployees';

export default function QAPage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { profile, user } = useAuth();
  const { hotels } = useHotels();
  const { employees } = useEmployees();
  
  const [activeTab, setActiveTab] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QATemplate | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState<any[]>([]);

  // Cargar auditorías reales de AWS
  const fetchAudits = async () => {
    setLoading(true);
    try {
      const client = generateClient<Schema>();
      const { data } = await client.models.QAAudit.list();
      
      const enrichedAudits = data.map(audit => {
        const hotel = hotels.find(h => h.id === audit.hotel_id);
        const employee = audit.employee_id ? employees.find(e => e.id === audit.employee_id) : null;
        
        return {
          ...audit,
          hotelName: hotel?.name || 'N/A',
          inspectorName: audit.auditor_name || 'Inspector',
          targetName: audit.audit_type === 'staff' ? (employee?.name || 'Empleado') : (hotel?.name || 'Hotel'),
          targetType: audit.audit_type
        };
      }).sort((a, b) => new Date(b.audit_date).getTime() - new Date(a.audit_date).getTime());

      setAudits(enrichedAudits);
    } catch (error: any) {
      console.error('Error al cargar auditorías de AWS:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile && hotels.length > 0 && employees.length > 0) fetchAudits();
  }, [profile, hotels, employees]);

  // LÓGICA DE COBERTURA (Control Mensual)
  const coverageStats = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    // Filtrar empleados de la zona del inspector si aplica
    const targetEmployees = profile?.role === 'INSPECTOR' 
      ? employees.filter(e => hotels.find(h => h.id === e.hotelId)?.zone === profile.assigned_zone)
      : employees;

    const auditedIds = new Set(
      audits
        .filter(a => a.audit_type === 'staff' && a.audit_date.startsWith(currentMonth))
        .map(a => a.employee_id)
    );

    const pending = targetEmployees.filter(e => !auditedIds.has(e.id) && e.isActive && !e.isBlacklisted);
    const auditedCount = targetEmployees.length - pending.length;
    const percent = targetEmployees.length > 0 ? Math.round((auditedCount / targetEmployees.length) * 100) : 0;

    return {
      pendingEmployees: pending,
      percent,
      totalToAudit: targetEmployees.length
    };
  }, [employees, audits, profile, hotels]);

  const stats = useMemo(() => {
    if (audits.length === 0) return { totalAudits: 0, avgScore: 0, criticalFailures: 0 };
    const total = audits.length;
    const avg = Math.round(audits.reduce((acc, curr) => acc + curr.score, 0) / total);
    const criticals = audits.filter(a => a.score < 70).length;
    return { totalAudits: total, avgScore: avg, criticalFailures: criticals };
  }, [audits]);

  const handleStartAudit = (template: QATemplate) => {
    setSelectedTemplate(template);
    setIsDialogOpen(true);
  };

  const handleOpenDetails = (audit: any) => {
    setSelectedAudit(audit);
    setIsDetailsOpen(true);
  };

  const handleSubmitAudit = async (auditData: any) => {
    try {
      const client = generateClient<Schema>();
      
      let hotelId = auditData.target_id;
      let employeeId = null;

      if (auditData.type === 'staff' || auditData.type === 'room') {
        employeeId = auditData.target_id;
        const emp = employees.find(e => e.id === employeeId);
        hotelId = emp?.hotelId || '';
      }

      await client.models.QAAudit.create({
        audit_type: auditData.type,
        hotel_id: hotelId,
        employee_id: employeeId,
        room_number: auditData.room_number || null,
        auditor_name: profile?.name || user?.username || 'Anónimo',
        score: auditData.score,
        audit_date: new Date().toISOString().split('T')[0],
        observations: auditData.notes,
        checklist_results: JSON.stringify(auditData.answers)
      });

      setSnackbar({ open: true, message: 'Auditoría guardada correctamente', severity: 'success' });
      fetchAudits();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Error: ' + error.message, severity: 'error' });
    }
  };

  const getTemplateIcon = (id: string) => {
    switch (id) {
      case 'staff': return <PersonIcon fontSize="large" />;
      case 'room': return <MeetingRoomIcon fontSize="large" />;
      case 'hotel': return <ApartmentIcon fontSize="large" />;
      default: return <VerifiedUserIcon fontSize="large" />;
    }
  };

  const getTemplateColor = (id: string) => {
    switch (id) {
      case 'staff': return '#FF5722';
      case 'room': return '#2196F3';
      case 'hotel': return '#4CAF50';
      default: return '#9C27B0';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* HEADER */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, background: 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, boxShadow: '0 4px 12px rgba(255, 87, 34, 0.4)' }}>
            <VerifiedUserIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Panel de Calidad</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, fontWeight: 600 }}>CONTROL OPERATIVO Y COBERTURA MENSUAL</Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={2}>
          <Paper elevation={0} sx={{ px: 2.5, py: 1, bgcolor: 'white', borderRadius: 3, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1, color: '#0F172A' }}>{coverageStats.percent}%</Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.6rem', textTransform: 'uppercase', color: 'primary.main', display: 'block' }}>Cobertura Mes</Typography>
          </Paper>
        </Stack>
      </Paper>

      {/* TABS DE NAVEGACIÓN */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} color="primary">
          <Tab icon={<AddIcon sx={{ fontSize: 18 }} />} label="Nueva Auditoría" iconPosition="start" sx={{ fontWeight: 'bold' }} />
          <Tab icon={<AssignmentLateIcon sx={{ fontSize: 18 }} />} label={`Pendientes (${coverageStats.pendingEmployees.length})`} iconPosition="start" sx={{ fontWeight: 'bold' }} />
          <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} label="Historial Reciente" iconPosition="start" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      {/* CONTENIDO SEGÚN TAB */}
      {loading ? (
        <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress /></Box>
      ) : (
        <>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {QA_TEMPLATES.map((template) => {
                const color = getTemplateColor(template.id);
                return (
                  <Grid item xs={12} sm={4} key={template.id}>
                    <Card sx={{ borderRadius: 4, height: '100%', border: `1px solid ${color}22`, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-5px)', boxShadow: `0 8px 25px ${color}22` }, display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 56, height: 56, mb: 2 }}>{getTemplateIcon(template.id)}</Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{template.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{template.description}</Typography>
                      </CardContent>
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Button variant="contained" fullWidth onClick={() => handleStartAudit(template)} sx={{ borderRadius: 2, bgcolor: color, fontWeight: 'bold' }}>Iniciar Auditoría</Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {activeTab === 1 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                Este personal no ha recibido su auditoría de <b>Presentación Personal</b> en el mes actual.
              </Alert>
              <Grid container spacing={2}>
                {coverageStats.pendingEmployees.length > 0 ? (
                  coverageStats.pendingEmployees.map(emp => (
                    <Grid item xs={12} sm={6} md={4} key={emp.id}>
                      <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>{emp.name[0]}</Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{emp.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{emp.role} • {hotels.find(h => h.id === emp.hotelId)?.name}</Typography>
                          </Box>
                        </Box>
                        <Button size="small" variant="outlined" onClick={() => setActiveTab(0)} sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 'bold' }}>Evaluar</Button>
                      </Paper>
                    </Grid>
                  ))
                ) : (
                  <Box sx={{ p: 5, textAlign: 'center', width: '100%', opacity: 0.5 }}>
                    <FactCheckIcon sx={{ fontSize: 60, mb: 2, color: 'success.main' }} />
                    <Typography variant="h6">¡Meta cumplida!</Typography>
                    <Typography variant="body2">Todo el personal ha sido auditado este mes.</Typography>
                  </Box>
                )}
              </Grid>
            </Box>
          )}

          {activeTab === 2 && (
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
              {audits.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {audits.map((audit, index) => (
                    <Box key={audit.id}>
                      <ListItem sx={{ py: 2, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }} onClick={() => handleOpenDetails(audit)}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: `${getTemplateColor(audit.audit_type)}15`, color: getTemplateColor(audit.audit_type) }}>{getTemplateIcon(audit.audit_type)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={audit.targetName} 
                          secondary={`${new Date(audit.audit_date).toLocaleDateString()} • Por: ${audit.inspectorName} ${audit.room_number ? '• Hab: ' + audit.room_number : ''}`} 
                          primaryTypographyProps={{ fontWeight: 'bold' }} 
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: audit.score >= 90 ? 'success.main' : (audit.score >= 70 ? 'warning.main' : 'error.main') }}>{audit.score}%</Typography>
                          <Typography variant="caption" color="text.secondary">Resultado</Typography>
                        </Box>
                      </ListItem>
                      {index < audits.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 5, textAlign: 'center', opacity: 0.5 }}>
                  <HistoryIcon sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="body2">No hay historial disponible.</Typography>
                </Box>
              )}
            </Paper>
          )}
        </>
      )}

      <QAFormDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} template={selectedTemplate} onSubmit={handleSubmitAudit} />
      <QADetailsDialog open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} audit={selectedAudit} />
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
    </Box>
  );
}
