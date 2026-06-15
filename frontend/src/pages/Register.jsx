import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AlertCircle, UserPlus } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!name.trim()) throw new Error('Name is required');
      if (!email.trim()) throw new Error('Email is required');
      if (password.length < 6) throw new Error('Password must be at least 6 characters');

      await api.register(name, email, password);
      // Success: navigate to OTP verification with email in state
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--teal-accent)', marginBottom: '1rem' }}>
            <UserPlus size={24} />
          </div>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Register to open your secure bank account</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

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
            <label className="form-label">Password</label>
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
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
