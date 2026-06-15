import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      setError('No email found to verify. Please enter your email.');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!email.trim()) throw new Error('Email is required');
      if (otp.length !== 6) throw new Error('OTP must be exactly 6 digits');

      const response = await api.verifyOtp(email, otp);
      setSuccess(response.message || 'OTP verified successfully!');
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login', { state: { info: 'Account verified successfully. You can now login.' } });
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setError('');
    setSuccess('');
    setResending(true);

    try {
      const response = await api.resendOtp(email);
      setSuccess(response.message || 'Verification code resent successfully!');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--ocean-blue)', marginBottom: '1rem' }}>
            <ShieldCheck size={24} />
          </div>
          <h2 className="auth-title">Verify Email</h2>
          <p className="auth-subtitle">We have sent a verification code to your email</p>
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!location.state?.email || loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">6-Digit Verification Code</label>
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={handleResend}
            disabled={resending || loading || !email}
            style={{ fontSize: '0.9rem', color: 'var(--ocean-blue)', fontWeight: 600, textDecoration: 'underline' }}
          >
            {resending ? 'Sending...' : 'Resend Verification Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
