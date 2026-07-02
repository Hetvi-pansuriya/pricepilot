import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import ErrorBanner from "../components/common/ErrorBanner";
import "./Login.css";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    setError("");
    try {
      await signup(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.detail || "Signup failed.");
    } finally {
      setBusy(false);
    }
  };
  return <main className="auth-page"><section className="auth-card">
    <div className="auth-logo"><span className="auth-logo-icon">◒</span><h1>Create your account</h1><p>Start making confident pricing decisions</p></div>
    <ErrorBanner message={error} onDismiss={() => setError("")} />
    <form className="auth-form" onSubmit={submit}>
      <div className="form-field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div className="form-field"><label>Password</label><div className="password-wrap"><input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required /><Button type="button" size="sm" variant="ghost" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</Button></div></div>
      <div className="form-field"><label>Confirm Password</label><div className="password-wrap"><input type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} required /><Button type="button" size="sm" variant="ghost" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? "Hide" : "Show"}</Button></div></div>
      <Button type="submit" fullWidth loading={busy}>Create Account</Button>
    </form>
    <p className="auth-switch">Already have an account? <Link to="/login">Log in →</Link></p>
  </section></main>;
}
