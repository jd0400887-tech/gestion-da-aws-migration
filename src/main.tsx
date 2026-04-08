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

// Importación de la configuración generada por AWS
import outputs from '../amplify_outputs.json';

try {
  Amplify.configure(outputs);
  console.info('🚀 OranjeApp: Conectada a AWS Cloud (Virginia) con éxito.');
} catch (e) {
  console.error('❌ Error configurando AWS:', e);
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
