import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ErrorBanner from '../components/common/ErrorBanner';
import '../styles/Login.css';
import '../styles/layout.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="ambient-bg" />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 10 }}>
        <ErrorBanner message={error} onDismiss={() => setError('')} />

        <div className="login-card" style={{ marginTop: error ? 'var(--space-3)' : 0 }}>
          {/* Brand */}
          <div className="login-brand">
            <div className="login-logo">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M7 18L11 10L15 14L21 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 21L11 16L15 18L21 12" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="login-title">PricePilot</h1>
            <p className="login-subtitle">Know what your pricing is really worth</p>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
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
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
            >
              Log In
            </Button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p>
              Don't have an account?
              <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </div>

        <div className="login-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}
