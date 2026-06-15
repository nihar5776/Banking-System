import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../App';
import { api } from '../services/api';
import { AlertCircle, LogIn, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { setUser } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.info) {
      setInfo(location.state.info);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (!email.trim() || !password) throw new Error('All fields are required');

      const response = await api.login(email, password);
      
      // Save to sessionStorage & Context
      sessionStorage.setItem('user', JSON.stringify(response.user));
      sessionStorage.setItem('token', response.token);
      
      // Clear the cookie immediately so backend falls back to tab-isolated Authorization header
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      setUser(response.user);
      
      // Redirect to Dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
      // If the user needs to verify OTP first, redirect them to /verify-otp
      if (err.message && err.message.toLowerCase().includes('verify otp')) {
        setTimeout(() => {
          navigate('/verify-otp', { state: { email } });
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--ocean-blue)', marginBottom: '1rem' }}>
            <LogIn size={24} />
          </div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to manage your bank account</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="alert alert-success" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.2)', color: '#93C5FD' }}>
            <CheckCircle2 size={16} />
            <span>{info}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--ocean-blue)', fontWeight: 600 }}>
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer-text">
          Don't have an account? <Link to="/register">Register Now</Link>
        </p>
      </div>
    </div>
  );
}
