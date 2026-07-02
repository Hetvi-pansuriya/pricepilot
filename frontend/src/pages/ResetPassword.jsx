import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";
import Button from "../components/common/Button";
import ErrorBanner from "../components/common/ErrorBanner";
import "./Login.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!done) return undefined;
    const timer = setTimeout(() => navigate("/login"), 2000);
    return () => clearTimeout(timer);
  }, [done, navigate]);
  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.detail || "Reset failed. Link may be expired.");
    } finally {
      setBusy(false);
    }
  };
  if (!token) return <main className="auth-page"><section className="auth-card auth-success"><p className="danger">Invalid or missing reset link.</p><Link to="/forgot-password">Request a new one →</Link></section></main>;
  if (done) return <main className="auth-page"><section className="auth-card auth-success"><span className="auth-logo-icon">✓</span><h2>Password updated!</h2><p>Redirecting you to login…</p></section></main>;
  return (
    <main className="auth-page"><section className="auth-card">
      <div className="auth-logo"><h1>Set new password</h1><p>Choose a strong password for your account.</p></div>
      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <form className="auth-form" onSubmit={submit}>
        <div className="form-field"><label>New Password</label><div className="password-wrap"><input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required /><Button type="button" size="sm" variant="ghost" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</Button></div></div>
        <div className="form-field"><label>Confirm Password</label><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
        <Button type="submit" fullWidth loading={busy}>Update Password</Button>
      </form>
    </section></main>
  );
}
