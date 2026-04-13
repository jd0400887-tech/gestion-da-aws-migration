import { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getUrl } from 'aws-amplify/storage';
import ApartmentIcon from '@mui/icons-material/Apartment';

interface S3ImageProps {
  path: string | null | undefined;
  alt?: string;
  style?: React.CSSProperties;
  height?: number | string;
  className?: string;
}

/**
 * COMPONENTE INTELIGENTE DE IMÁGENES S3
 * Resuelve rutas y URLs caducadas de S3 de forma automática.
 */
export default function S3Image({ path, alt, style, height, className }: S3ImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveUrl = async () => {
      setLoading(true);
      if (!path) {
        setLoading(false);
        setUrl(null);
        return;
      }

      let s3Path = path;

      // Limpieza de ruta: eliminar espacios y slashes iniciales
      s3Path = s3Path.trim();
      if (s3Path.startsWith('/')) {
        s3Path = s3Path.substring(1);
      }

      // SI ES UNA URL DE S3 (Legacy Fix profunda)
      if (path.includes('s3.amazonaws.com') || path.includes('.s3.') || path.includes('?X-Amz-Algorithm')) {
        try {
          // Extraemos la ruta ignorando los query parameters
          const cleanPathOnly = path.split('?')[0];
          const urlObj = new URL(cleanPathOnly.startsWith('http') ? cleanPathOnly : `https://${cleanPathOnly}`);
          
          let pathname = urlObj.pathname;
          if (pathname.startsWith('/')) pathname = pathname.substring(1);
          
          // El path real en el bucket suele empezar en 'hotel-images' o 'employee-docs'
          const markers = ['hotel-images/', 'employee-docs/'];
          let foundMarker = false;
          
          for (const marker of markers) {
            const index = pathname.indexOf(marker);
            if (index !== -1) {
              s3Path = pathname.substring(index);
              foundMarker = true;
              break;
            }
          }
          
          if (!foundMarker) s3Path = pathname;
        } catch (e) {
          console.warn("⚠️ [S3Image] Error parseando URL legacy:", e);
        }
      } 
      // SI ES UNA URL EXTERNA NORMAL (No S3)
      else if (path.startsWith('http')) {
        setUrl(path);
        setLoading(false);
        return;
      }

      if (!s3Path) {
        setLoading(false);
        setUrl(null);
        return;
      }

      try {
        // Pedimos una URL fresca a AWS usando la ruta limpia
        const result = await getUrl({ 
          path: s3Path,
          options: {
            expiresIn: 3600 
          }
        });
        setUrl(result.url.toString());
      } catch (error) {
        console.error("❌ [S3Image] Error resolviendo ruta S3:", s3Path, error);
        setUrl(null);
      } finally {
        setLoading(false);
      }
    };

    resolveUrl();
  }, [path]);

  if (loading) {
    return (
      <Box sx={{ height: height || '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.05)' }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (!url) {
    return (
      <Box sx={{ height: height || '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.03)' }}>
        <ApartmentIcon sx={{ fontSize: 40, opacity: 0.1 }} />
      </Box>
    );
  }

  return (
    <img 
      src={url} 
      alt={alt || "Hotel"} 
      className={className}
      style={{ 
        width: '100%', 
        height: height || '100%', 
        objectFit: 'cover', 
        display: 'block',
        ...style 
      }} 
    />
  );
}
