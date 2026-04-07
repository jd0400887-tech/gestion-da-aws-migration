import { createClient } from '@supabase/supabase-js';

// MIGRACIÓN ORANJEAPP A 100% AWS (RDS + COGNITO)
// Se neutraliza el cliente de Supabase para evitar errores de compilación
// Los datos ahora se leerán de AWS Amplify Gen 2

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.info('ℹ️ OranjeApp: Funcionando en infraestructura 100% AWS.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
