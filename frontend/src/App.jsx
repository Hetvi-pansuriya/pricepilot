import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CompanySetup from './pages/CompanySetup';
import AnalysisWaiting from './pages/AnalysisWaiting';
import Report from './pages/Report';
import History from './pages/History';

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/company/new/setup" element={<CompanySetup />} />
        <Route path="/company/:companyId/setup" element={<CompanySetup />} />
        <Route path="/company/:companyId/analyzing/:sessionId" element={<AnalysisWaiting />} />
        <Route path="/company/:companyId/report/:sessionId" element={<Report />} />
        <Route path="/company/:companyId/history" element={<History />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
