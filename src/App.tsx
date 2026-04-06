import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import { Authenticator, useAuthenticator, View, Image, useTheme } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import HotelsPage from './pages/HotelsPage';
import AttendanceReportPage from './pages/AttendanceReportPage';
import PayrollReviewPage from './pages/PayrollReviewPage';
import HotelDetailPage from './pages/HotelDetailPage';
import InformesPage from './pages/InformesPage';
import StaffingRequestsPage from './pages/StaffingRequestsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ArchivedRequestsPage from './pages/ArchivedRequestsPage';
import AdoptionTrackerPage from './pages/AdoptionTrackerPage';
import QAPage from './pages/QAPage';
import CorporateReportPage from './pages/CorporateReportPage';
import HistoricalReportPage from './pages/HistoricalReportPage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import { useAuth } from './hooks/useAuth';
import { lightTheme, darkTheme } from './theme';
import { PATHS } from './routes/paths';
import { ProtectedRoute } from './components/common/ProtectedRoute';

function AppContent() {
  const { authStatus, user } = useAuthenticator();
  const { profile, loading } = useAuth();
  const [forceShow, setForceShow] = useState(false);

  // Seleccionar tema basado en el rol (Light para campo, Dark para oficina/admin)
  const theme = (profile?.role === 'RECRUITER' || profile?.role === 'INSPECTOR') ? lightTheme : darkTheme;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setForceShow(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (authStatus === 'configuring') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#121212' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (authStatus !== 'authenticated') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <Authenticator hideSignUp={true} />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Rutas Públicas */}
        <Route path={PATHS.LOGIN} element={<Navigate to={PATHS.DASHBOARD} replace />} />

        {/* Rutas Privadas Protegidas */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          
          <Route path={PATHS.USERS} element={
            <ProtectedRoute allowedRoles={['ADMIN']}><UsersPage /></ProtectedRoute>
          } />

          <Route path={PATHS.EMPLOYEES} element={<EmployeesPage />} />
          <Route path={PATHS.HOTELS} element={<HotelsPage />} />
          <Route path={PATHS.HOTEL_DETAIL} element={<HotelDetailPage />} />
          <Route path={PATHS.ATTENDANCE} element={<AttendanceReportPage />} />
          <Route path={PATHS.PAYROLL} element={<PayrollReviewPage />} />
          <Route path={PATHS.REPORTS} element={<InformesPage />} />
          <Route path={PATHS.REQUESTS} element={<StaffingRequestsPage />} />
          <Route path={PATHS.APPLICATIONS} element={<ApplicationsPage />} />
          <Route path={PATHS.QA} element={<QAPage />} />
          <Route path={PATHS.ARCHIVED_REQUESTS} element={<ArchivedRequestsPage />} />
          <Route path={PATHS.ADOPTION_TRACKER} element={<AdoptionTrackerPage />} />
          <Route path={PATHS.CORPORATE_REPORT} element={<CorporateReportPage />} />
          <Route path={PATHS.HISTORICAL_REPORT} element={<HistoricalReportPage />} />
        </Route>

        <Route path="*" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      </Routes>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Authenticator.Provider>
      <AppContent />
    </Authenticator.Provider>
  );
}

export default App;
