import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCompany, listCompanies } from "../../api/companies";
import Button from "../common/Button";
import "./Navbar.css";
import "./NavbarIconAdjustments.css";

export default function Navbar() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [companyName, setCompanyName] = useState("");
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    listCompanies().then(setCompanies).catch(() => setCompanies([]));
  }, []);
  useEffect(() => {
    if (!companyId || companyId === "new") return setCompanyName("");
    getCompany(companyId)
      .then((company) => setCompanyName(company.name))
      .catch(() => setCompanyName(""));
  }, [companyId]);
  const onLogout = () => {
    logout();
    navigate("/login");
  };
  const initial = (email?.[0] || "P").toUpperCase();
  const matches = companies
    .filter((company) =>
      company.name.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .slice(0, 6);
  return (
    <>
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">◒</span>
          <strong>PricePilot</strong>
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">⊞</span> Dashboard
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">▥</span> Analysis History
          </NavLink>
        </nav>
        {companyId && companyId !== "new" && (
          <div className="sidebar-context">
            <span>Current company</span>
            <strong>{companyName || companyId.slice(0, 8)}</strong>
          </div>
        )}
        <div className="sidebar-bottom">
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon profile-settings-icon">⚙</span> Profile Settings
          </NavLink>
          <Button fullWidth variant="danger" onClick={onLogout}>
            ↪ Logout
          </Button>
          <div className="sidebar-user">
            <span className="user-avatar">{initial}</span>
            <span className="user-email">{email}</span>
          </div>
        </div>
      </aside>
      <header className="app-topbar">
        <strong>Pricing intelligence workspace</strong>
        <div className="topbar-right">
          <div className="search-area">
            <div className="search-box">
              <span className="search-icon">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search companies…"
                aria-label="Search companies"
              />
            </div>
            {search.trim() && (
              <div className="search-results">
                {matches.map((company) => (
                  <button
                    type="button"
                    key={company.id}
                    onClick={() => {
                      setSearch("");
                      navigate(`/company/${company.id}/setup`);
                    }}
                  >
                    <strong>{company.name}</strong>
                    <span>{company.industry?.replaceAll("_", " ")}</span>
                  </button>
                ))}
                {!matches.length && <p>No companies found</p>}
              </div>
            )}
          </div>
          <div className="topbar-avatar" aria-label="Signed-in user">
            {initial}
          </div>
        </div>
      </header>
    </>
  );
}
