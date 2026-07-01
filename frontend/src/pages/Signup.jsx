import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import ErrorBanner from "../components/common/ErrorBanner";
import "./Signup.css";
export default function Signup() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [showConfirmPassword, setShowConfirmPassword] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    { signup } = useAuth(),
    n = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6)
      return setError("Password must be at least 6 characters");
    if (password !== confirmPassword)
      return setError("Passwords do not match");
    setBusy(true);
    try {
      await signup(email, password);
      n("/dashboard");
    } catch (e) {
      setError(e.detail);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-page page-container">
      <Card glow className="auth-card stack-lg">
        <div className="auth-logo">
          <span>◒</span>
          <strong>Create your account</strong>
          <p>Start making confident pricing decisions</p>
        </div>
        <ErrorBanner message={error} onDismiss={() => setError("")} />
        <form className="stack" onSubmit={submit}>
          <Input
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="form-field">
            <label htmlFor="password">Password *</label>
            <div className="password-control">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "◉" : "◌"}
              </Button>
            </div>
            <span className="hint">Minimum 6 characters</span>
          </div>
          <div className="form-field">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <div className="password-control">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowConfirmPassword((shown) => !shown)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                title={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? "◉" : "◌"}
              </Button>
            </div>
          </div>
          <Button type="submit" fullWidth loading={busy}>
            Create Account
          </Button>
        </form>
        <p>
          Already have an account? <Link to="/login">Log in →</Link>
        </p>
      </Card>
    </main>
  );
}
