import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCompany } from "../../api/companies";
import Button from "../common/Button";
import "./Navbar.css";

export default function Navbar() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { companyId } = useParams();
  const [companyName, setCompanyName] = useState("");
  useEffect(() => {
    if (!companyId) {
      setCompanyName("");
      return;
    }
    getCompany(companyId)
      .then((company) => setCompanyName(company.name))
      .catch(() => setCompanyName(""));
  }, [companyId]);
  const onLogout = () => {
    logout();
    navigate("/login");
  };
  return (
    <>
      <aside className="app-sidebar sidebar">
        <div className="brand">◒ <strong>PricePilot</strong></div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className="nav-link">
            <span className="nav-icon">⊞</span> Dashboard
          </NavLink>
        </nav>
        {companyId && (
          <div className="sidebar-context">
            <span>Company workspace</span>
            <strong>{companyName || companyId.slice(0, 8)}</strong>
            {location.pathname.includes("/history") && <small>History</small>}
            {location.pathname.includes("/report/") && <small>Report</small>}
            {location.pathname.includes("/setup") && <small>Setup</small>}
          </div>
        )}
        <div className="sidebar-footer-links">
          <a
            href="https://github.com"
            className="nav-link-sm"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
          <span className="nav-link-sm" onClick={onLogout}>
            Logout
          </span>
        </div>
        <div className="profile row">
          <span className="avatar">{email[0]?.toUpperCase() || "P"}</span>
          <span className="profile-email">{email}</span>
          <Button size="sm" variant="ghost" onClick={onLogout}>↪</Button>
        </div>
      </aside>
      <header className="app-topbar">
        <strong>Pricing intelligence workspace</strong>
      </header>
    </>
  );
}
