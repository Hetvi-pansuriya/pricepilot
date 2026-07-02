import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CompanySetup from "./pages/CompanySetup";
import AnalysisWaiting from "./pages/AnalysisWaiting";
import Report from "./pages/Report";
import History from "./pages/History";
import ReportCompare from "./pages/ReportCompare";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProfileSettings from "./pages/ProfileSettings";
import AllHistory from "./pages/AllHistory";
export default function App() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes> 
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/company/new/setup" element={<CompanySetup />} />
        <Route path="/company/:companyId/setup" element={<CompanySetup />} />
        <Route
          path="/company/:companyId/analyzing/:sessionId"
          element={<AnalysisWaiting />}
        />
        <Route
          path="/company/:companyId/report/:sessionId"
          element={<Report />}
        />
        <Route path="/company/:companyId/history" element={<History />} />
        <Route path="/company/:companyId/compare/:sessionA/:sessionB" element={<ReportCompare />} />
        <Route path="/profile" element={<ProfileSettings />} />
        <Route path="/history" element={<AllHistory />} />
      </Route>
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
