import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ErrorBanner from '../components/common/ErrorBanner';
import '../styles/Signup.css';
import '../styles/layout.css';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="ambient-bg" />

      {/* Top bar */}
      <div className="signup-topbar">
        <div className="signup-topbar-logo">
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M7 18L11 10L15 14L21 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="signup-topbar-title">PricePilot</span>
      </div>

      <div className="signup-card">
        {/* Header */}
        <div className="signup-header">
          <h1>Create your account</h1>
          <p>Analyze, optimize, and pilot your SaaS pricing strategy.</p>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} />

        {/* Form */}
        <form className="signup-form" onSubmit={handleSubmit} style={{ marginTop: error ? 'var(--space-4)' : 0 }}>
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            hint="Minimum 6 characters"
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={loading}
          >
            Sign Up
          </Button>
        </form>

        {/* Footer */}
        <div className="signup-footer">
          <p>
            Already have an account?
            <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>

      <div className="signup-page-footer">
        © 2024 PricePilot Analytics Inc. Built for Scale.
      </div>
    </div>
  );
}
