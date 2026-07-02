import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import Button from "../components/common/Button";
import ErrorBanner from "../components/common/ErrorBanner";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (!email) return setError("Please enter your email.");
    setBusy(true);
    setError("");
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.detail || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-page">
      <section className="auth-card">
        {sent ? (
          <div className="auth-success">
            <span className="auth-logo-icon">✉</span>
            <h2>Check your email</h2>
            <p>If an account with <strong>{email}</strong> exists, a reset link has been sent.</p>
            <Link to="/login">← Back to login</Link>
          </div>
        ) : (
          <>
            <div className="auth-logo"><span className="auth-logo-icon">⌁</span><h1>Forgot password?</h1><p>Enter your email and we’ll send a reset link.</p></div>
            <ErrorBanner message={error} onDismiss={() => setError("")} />
            <form className="auth-form" onSubmit={submit}>
              <div className="form-field"><label htmlFor="forgot-email">Email</label><input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required /></div>
              <Button type="submit" fullWidth loading={busy}>Send Reset Link</Button>
            </form>
            <p className="auth-switch"><Link to="/login">← Back to login</Link></p>
          </>
        )}
      </section>
    </main>
  );
}
