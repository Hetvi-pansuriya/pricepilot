import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCompany } from "../../api/companies";
import Button from "../common/Button";
import "./Navbar.css";

export default function Navbar() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [companyName, setCompanyName] = useState("");
  useEffect(() => {
    if (!companyId || companyId === "new") return setCompanyName("");
    getCompany(companyId).then((company) => setCompanyName(company.name)).catch(() => setCompanyName(""));
  }, [companyId]);
  const onLogout = () => { logout(); navigate("/login"); };
  const initial = (email?.[0] || "P").toUpperCase();
  return <>
    <aside className="app-sidebar">
      <div className="sidebar-brand"><span className="brand-icon">◒</span><strong>PricePilot</strong></div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><span>⊞</span> Dashboard</NavLink>
        <NavLink to="/dashboard" className={() => `nav-link ${companyId ? "active" : ""}`}><span>▦</span> Companies</NavLink>
        <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><span>▥</span> Analysis History</NavLink>
      </nav>
      {companyId && companyId !== "new" && <div className="sidebar-context"><span>Current company</span><strong>{companyName || companyId.slice(0, 8)}</strong></div>}
      <div className="sidebar-bottom">
        <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><span>⚙</span> Profile Settings</NavLink>
        <Button variant="ghost" onClick={onLogout}>↪ Logout</Button>
        <div className="sidebar-user"><span className="user-avatar">{initial}</span><span className="user-email">{email}</span></div>
      </div>
    </aside>
    <header className="app-topbar"><strong>Pricing intelligence workspace</strong><div className="topbar-right"><div className="search-box"><span>⌕</span><input placeholder="Search companies…" disabled title="Coming soon" /></div><button className="topbar-avatar" onClick={() => navigate("/profile")} title="Profile">{initial}</button></div></header>
  </>;
}
