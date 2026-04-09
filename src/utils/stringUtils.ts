/**
 * UTILIDADES DE FORMATEO DE TEXTO (NIVEL ENTERPRISE)
 */

/**
 * Convierte cualquier texto a "Title Case" (Ej: JUAN PEREZ -> Juan Perez)
 * Versión optimizada para permitir espacios mientras se escribe.
 */
export const toTitleCase = (text: string): string => {
  if (!text) return '';
  
  // Si el último carácter es un espacio, lo mantenemos para permitir seguir escribiendo
  const endsWithSpace = text.endsWith(' ');
  
  const formatted = text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return endsWithSpace ? formatted + ' ' : formatted;
};

/**
 * Obtiene las iniciales de un nombre (Ej: Juan Perez -> JP)
 */
export const getInitials = (name: string): string => {
  if (!name) return '??';
  return name
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase())
    .slice(0, 2)
    .join('');
};

/**
 * Limpia espacios dobles y recorta extremos
 */
export const cleanText = (text: string): string => {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
};
