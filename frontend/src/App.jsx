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
export default function App() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes> 
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
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
