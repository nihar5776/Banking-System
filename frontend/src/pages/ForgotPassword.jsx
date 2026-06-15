import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Reset Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!email.trim()) throw new Error('Email is required');
      const response = await api.sendResetOtp(email);
      setSuccess(response.message || 'Reset OTP sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!otp.trim() || password.length < 6) {
        throw new Error('OTP and password (min 6 characters) are required');
      }
      const response = await api.resetPassword(email, otp, password);
      setSuccess(response.message || 'Password changed successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { state: { info: 'Password changed successfully. You can now login.' } });
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--ocean-blue)', marginBottom: '1rem' }}>
            <KeyRound size={24} />
          </div>
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">
            {step === 1 ? 'Request a code to reset your password' : 'Enter the code and set your new password'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
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
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Sending Code...' : 'Request Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                disabled
              />
            </div>

            <div className="form-group">
              <label className="form-label">6-Digit Reset Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
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
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="auth-footer-text">
          Remember your password? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
