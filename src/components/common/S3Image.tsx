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

      // SI ES UNA URL DE S3 (Legacy Fix)
      if (path.includes('s3.amazonaws.com') || path.includes('.s3.')) {
        try {
          const urlObj = new URL(path);
          // Eliminamos el primer slash y los query parameters
          const cleanPath = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
          
          // Buscamos donde empieza 'hotel-images'
          const imagesIndex = cleanPath.indexOf('hotel-images/');
          if (imagesIndex !== -1) {
            s3Path = cleanPath.substring(imagesIndex);
          } else {
            s3Path = cleanPath;
          }
        } catch (e) {
          console.warn("Error parseando URL legacy de S3:", e);
        }
      } 
      // SI ES UNA URL EXTERNA NORMAL (No S3)
      else if (path.startsWith('http')) {
        setUrl(path);
        setLoading(false);
        return;
      }

      try {
        // Pedimos una URL fresca a AWS usando la ruta limpia
        const result = await getUrl({ 
          path: s3Path,
          options: {
            expiresIn: 3600 // Válida por 1 hora
          }
        });
        setUrl(result.url.toString());
      } catch (error) {
        console.error("Error resolviendo imagen S3:", error);
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
