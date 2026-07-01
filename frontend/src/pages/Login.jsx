import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import ErrorBanner from "../components/common/ErrorBanner";
import "./Login.css";
export default function Login() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    { login } = useAuth(),
    n = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
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
          <strong>PricePilot</strong>
          <p>Know what your pricing is really worth</p>
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" fullWidth loading={busy}>
            Log In
          </Button>
        </form>
        <p>
          Don't have an account? <Link to="/signup">Sign up →</Link>
        </p>
      </Card>
    </main>
  );
}
