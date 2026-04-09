import { useRef } from 'react';
import { 
  TextField, Button, Box, Grid, Typography, FormControl, InputLabel, 
  Select, MenuItem, InputAdornment, Stack, Divider, Avatar, Paper, IconButton, CircularProgress, useTheme 
} from '@mui/material';

// Iconos
import MyLocationIcon from '@mui/icons-material/MyLocation';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import MapIcon from '@mui/icons-material/Map';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';

import { toTitleCase } from '../../utils/stringUtils';
import { useAuth } from '../../hooks/useAuth';

interface HotelFormProps {
  hotelData: Partial<Hotel>;
  onFormChange: (field: keyof Hotel, value: any) => void;
  uploadHotelImage: (file: File, hotelId: string) => Promise<void>;
  isEditMode: boolean;
  uploading?: boolean;
}

export default function HotelForm({ hotelData, onFormChange, uploadHotelImage, isEditMode, uploading }: HotelFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuth();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  
  const isInspector = profile?.role === 'INSPECTOR';

  /**
   * FUNCIÓN DE FORMATEO PROFESIONAL USANDO UTILIDAD GLOBAL
   */
  const handleFormattedChange = (field: keyof Hotel, value: string) => {
    onFormChange(field, toTitleCase(value));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onFormChange('latitude', position.coords.latitude);
          onFormChange('longitude', position.coords.longitude);
        },
        (error) => {
          console.error("Error getting location: ", error);
          alert(`Error al obtener ubicación: ${error.message}`);
        }
      );
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && hotelData.id) {
      uploadHotelImage(file, hotelData.id);
    }
  };

  const handleUploadClick = () => {
    if (!hotelData.id) {
      alert("Por favor, guarda el hotel primero antes de subir una foto.");
      return;
    }
    fileInputRef.current?.click();
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Grid container spacing={3}>
        
        {/* --- SECCIÓN 1: IDENTIFICACIÓN --- */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ 
            p: 2, borderRadius: 3, 
            background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.08) 0%, rgba(255, 255, 255, 0) 100%)',
            border: '1px solid rgba(255, 87, 34, 0.1)'
          }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, boxShadow: '0 4px 10px rgba(255, 87, 34, 0.3)' }}>
                <ApartmentIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Identificación del Hotel</Typography>
                <Typography variant="caption" color="text.secondary">Datos maestros y zona operativa</Typography>
              </Box>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField 
                  label="Nombre del Establecimiento" 
                  fullWidth size="small" 
                  value={hotelData.name || ''} 
                  onChange={(e) => handleFormattedChange('name', e.target.value)} 
                  required 
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><ApartmentIcon color="primary" fontSize="small" /></InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small" required sx={inputStyles}>
                  <InputLabel>Zona Asignada</InputLabel>
                  <Select 
                    value={hotelData.zone || 'Centro'} 
                    label="Zona Asignada" 
                    onChange={(e) => onFormChange('zone', e.target.value)} 
                    disabled={isInspector}
                    startAdornment={<InputAdornment position="start"><MapIcon color="primary" fontSize="small" /></InputAdornment>}
                  >
                    <MenuItem value="Centro">Centro</MenuItem>
                    <MenuItem value="Norte">Norte</MenuItem>
                    <MenuItem value="Noroeste">Noroeste</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* --- SECCIÓN 2: CONTACTO Y UBICACIÓN --- */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ 
            p: 2, borderRadius: 3, height: '100%',
            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(255, 255, 255, 0) 100%)',
            border: '1px solid rgba(33, 150, 243, 0.1)'
          }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
              <Avatar sx={{ bgcolor: '#2196F3', width: 40, height: 40, boxShadow: '0 4px 10px rgba(33, 150, 243, 0.3)' }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Contacto y Dirección</Typography>
                <Typography variant="caption" color="text.secondary">Información logística y operativa</Typography>
              </Box>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Gerente / Contacto" 
                  fullWidth size="small" 
                  value={hotelData.managerName || ''} 
                  onChange={(e) => handleFormattedChange('managerName', e.target.value)}
                  sx={inputStyles}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" color="info" /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Teléfono" 
                  fullWidth size="small" 
                  value={hotelData.phone || ''} 
                  onChange={(e) => onFormChange('phone', e.target.value)}
                  sx={inputStyles}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" color="info" /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="Correo Electrónico Oficial" 
                  fullWidth size="small" 
                  value={hotelData.email || ''} 
                  onChange={(e) => onFormChange('email', e.target.value.toLowerCase())}
                  sx={inputStyles}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" color="info" /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Ciudad" 
                  fullWidth size="small" 
                  value={hotelData.city || ''} 
                  onChange={(e) => handleFormattedChange('city', e.target.value)} 
                  required 
                  sx={inputStyles}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LocationCityIcon fontSize="small" color="info" /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Dirección Completa" 
                  fullWidth size="small" 
                  value={hotelData.address || ''} 
                  onChange={(e) => handleFormattedChange('address', e.target.value)} 
                  required 
                  sx={inputStyles}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon fontSize="small" color="info" /></InputAdornment> }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* --- SECCIÓN 3: MULTIMEDIA Y GPS --- */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ 
            p: 2, borderRadius: 3, height: '100%',
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(255, 255, 255, 0) 100%)',
            border: '1px solid rgba(76, 175, 80, 0.1)'
          }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
              <Avatar sx={{ bgcolor: '#4CAF50', width: 40, height: 40, boxShadow: '0 4px 10px rgba(76, 175, 80, 0.3)' }}>
                <PhotoCameraIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Multimedia y GPS</Typography>
                <Typography variant="caption" color="text.secondary">Posicionamiento global</Typography>
              </Box>
            </Stack>

            <Paper variant="outlined" sx={{ 
              p: 1, borderRadius: 3, textAlign: 'center', mb: 2, 
              height: 140, display: 'flex', flexDirection: 'column', 
              justifyContent: 'center', position: 'relative',
              backgroundColor: 'rgba(255,255,255,0.02)', borderStyle: 'dashed'
            }}>
              {uploading ? (
                <Box><CircularProgress size={30} /><Typography variant="caption" display="block" sx={{ mt: 1 }}>AWS S3...</Typography></Box>
              ) : hotelData.imageUrl ? (
                <Box sx={{ position: 'relative', height: '100%' }}>
                  <img src={hotelData.imageUrl} alt="Hotel" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  <IconButton 
                    size="small" 
                    onClick={handleUploadClick}
                    sx={{ position: 'absolute', bottom: 5, right: 5, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                  >
                    <AddPhotoAlternateIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box>
                  <PhotoCameraIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
                  <Button size="small" onClick={handleUploadClick} sx={{ textTransform: 'none', fontWeight: 'bold' }}>Subir Imagen</Button>
                </Box>
              )}
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
            </Paper>

            <Stack spacing={1.5}>
              <Button 
                variant="contained" 
                startIcon={<MyLocationIcon />} 
                onClick={handleGetLocation} 
                fullWidth size="small"
                sx={{ borderRadius: 2, fontWeight: 'bold', py: 1, boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)', bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' } }}
              >
                Capturar Mi Ubicación
              </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField label="Lat" fullWidth size="small" value={hotelData.latitude || ''} disabled sx={inputStyles} />
                <TextField label="Long" fullWidth size="small" value={hotelData.longitude || ''} disabled sx={inputStyles} />
              </Box>
            </Stack>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}
