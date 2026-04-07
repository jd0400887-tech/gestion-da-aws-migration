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

// Función para inicializar la App
async function initApp() {
  try {
    // Intentar cargar la configuración real de AWS
    // @ts-ignore
    const outputs = await import('../amplify_outputs.json');
    Amplify.configure(outputs.default);
    console.info('🚀 OranjeApp: Conectada a AWS Cloud con éxito.');
  } catch (e) {
    console.warn('⚠️ OranjeApp: Funcionando en MODO DESCONECTADO (Mocks).');
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
}

initApp();
