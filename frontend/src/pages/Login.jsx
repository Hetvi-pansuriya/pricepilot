import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import ErrorBanner from "../components/common/ErrorBanner";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault();
    if (!email || !password) return setError("Please fill in all fields.");
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.detail || "Login failed. Please check your credentials.");
    } finally {
      setBusy(false);
    }
  };
  return <main className="auth-page"><section className="auth-card">
    <div className="auth-logo"><span className="auth-logo-icon">◒</span><h1>PricePilot</h1><p>Know what your pricing is really worth</p></div>
    <ErrorBanner message={error} onDismiss={() => setError("")} />
    <form className="auth-form" onSubmit={submit}>
      <div className="form-field"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required /></div>
      <div className="form-field"><div className="field-row-between"><label htmlFor="password">Password</label><Link className="forgot-link" to="/forgot-password">Forgot password?</Link></div><div className="password-wrap"><input id="password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /><Button type="button" size="sm" variant="ghost" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</Button></div></div>
      <Button type="submit" fullWidth loading={busy}>Sign In</Button>
    </form>
    <p className="auth-switch">Don't have an account? <Link to="/signup">Sign up →</Link></p>
  </section></main>;
}
