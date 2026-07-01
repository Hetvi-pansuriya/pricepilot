import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";
import "./Navbar.css";
export default function Navbar() {
  const { email, logout } = useAuth(),
    n = useNavigate();
  return (
    <>
      <aside className="app-sidebar sidebar">
        <div className="brand">
          ◒ <strong>PricePilot</strong>
        </div>
        <nav className="stack-sm">
          <NavLink to="/dashboard">⌂ Dashboard</NavLink>
        </nav>
        <div className="profile row">
          <span className="avatar">{email[0]?.toUpperCase() || "P"}</span>
          <span className="profile-email">{email}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              logout();
              n("/login");
            }}
          >
            ↪
          </Button>
        </div>
      </aside>
      <header className="app-topbar">
        <strong>Pricing intelligence workspace</strong>
      </header>
    </>
  );
}
