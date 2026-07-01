import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "./Navbar";
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <div className="app-layout">
      <div className="app-main">
        <Navbar />
        <Outlet />
      </div>
    </div>
  ) : (
    <Navigate to="/login" replace />
  );
}
