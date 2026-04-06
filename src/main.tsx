import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import App from './App.tsx';
import theme from './theme.ts';
import './index.css';

// Configuración de AWS Amplify Gen 2
try {
  // @ts-ignore - Este archivo es generado dinámicamente por AWS Amplify
  import('../amplify_outputs.json').then((outputs) => {
    Amplify.configure(outputs.default);
    console.info('🚀 OranjeApp: Conectada a AWS Cloud con éxito.');
  }).catch(() => {
    console.warn('⚠️ OranjeApp: Funcionando en MODO DESCONECTADO (Mocks).');
  });
} catch (e) {
  console.warn('⚠️ OranjeApp: Configuración de AWS no detectada.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Authenticator.Provider>
        <App />
      </Authenticator.Provider>
    </ThemeProvider>
  </StrictMode>
);
