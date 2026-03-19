import { createClient } from '@supabase/supabase-js';

// Las llaves se leen exclusivamente del archivo .env (no subir el .env real a GitHub)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Configuración: Las variables de entorno de Supabase no están presentes. Se requiere configurar un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
}

// Inicializar el cliente (aunque las variables no existan, para evitar errores de compilación)
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
