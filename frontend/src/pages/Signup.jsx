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
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    { signup } = useAuth(),
    n = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6)
      return setError("Password must be at least 6 characters");
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
          <Input
            label="Password"
            type="password"
            name="password"
            hint="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
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
