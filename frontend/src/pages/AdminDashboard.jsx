import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { api } from '../services/api';
import { 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  RefreshCw, 
  Send, 
  Copy, 
  Check, 
  ShieldAlert, 
  Coins,
  Search,
  BookOpen
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [systemAccount, setSystemAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  // Form states for dispatching initial funds
  const [recipientAccount, setRecipientAccount] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || 'nihar3611@gmail.com,admin@bankingledger.com').split(',');
    const isAdmin = user && adminEmails.includes(user.email);

    if (!user) {
      navigate('/login');
    } else if (!isAdmin) {
      navigate('/dashboard'); // Normal users redirected
    } else {
      fetchSystemAccountDetails();
    }
  }, [user]);

  const fetchSystemAccountDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getAccounts();
      if (response.accounts) {
        setSystemAccount(response.accounts);
        const balanceResponse = await api.getBalance(response.accounts._id);
        setBalance(balanceResponse.balance);
      } else {
        setSystemAccount(null);
        setBalance(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load system treasury account.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    if (!systemAccount) return;
    try {
      const balanceResponse = await api.getBalance(systemAccount._id);
      setBalance(balanceResponse.balance);
    } catch (err) {
      setError(err.message || 'Failed to refresh treasury balance.');
    }
  };

  const handleCreateSystemAccount = async () => {
    setActionLoading(true);
    setError('');
    try {
      const response = await api.createAccount();
      setSystemAccount(response.account);
      setBalance(0);
    } catch (err) {
      setError(err.message || 'Failed to create system treasury account.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!systemAccount) return;
    navigator.clipboard.writeText(systemAccount._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDispatchFunds = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setActionLoading(true);

    const parsedAmount = parseFloat(amount);
    if (!systemAccount) {
      setError('System treasury account is missing. Please create one first.');
      setActionLoading(false);
      return;
    }
    if (!recipientAccount.trim()) {
      setError('Recipient account ID is required.');
      setActionLoading(false);
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid transfer amount.');
      setActionLoading(false);
      return;
    }

    try {
      const response = await api.createInitialFunds(recipientAccount.trim(), parsedAmount);
      setSuccess(response.message || `Successfully dispatched ${parsedAmount} INR of initial funds!`);
      setRecipientAccount('');
      setAmount('');
      
      // Refresh treasury balance
      await handleRefreshBalance();
    } catch (err) {
      setError(err.message || 'Failed to dispatch initial funds.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner-large"></div>
        <p>Loading Admin Workspace...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper" style={{ backgroundColor: '#090d16' }}>
      <div className="container">
        
        {/* Admin Welcome Header */}
        <div className="dashboard-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--teal-accent)', marginBottom: '0.25rem' }}>
              <ShieldAlert size={18} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>SYSTEM ADMINISTRATOR WORKSPACE</span>
            </div>
            <h1 className="welcome-title">
              Control Panel: <span>{user?.name}</span>
            </h1>
          </div>
          {systemAccount && (
            <button 
              onClick={fetchSystemAccountDetails} 
              className="btn btn-secondary" 
              style={{ display: 'inline-flex', gap: '0.5rem', padding: '0.6rem 1rem' }}
            >
              <RefreshCw size={14} /> Refresh Panel
            </button>
          )}
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Left Column: System Treasury Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {systemAccount ? (
              <div className="bank-card" style={{ background: 'linear-gradient(135deg, #0A0F1D, #1E293B)', border: '1px solid rgba(13, 148, 136, 0.25)', color: 'var(--white)' }}>
                <div className="card-top">
                  <div className="bank-logo" style={{ color: 'var(--teal-accent)' }}>
                    <Coins size={20} />
                    <span>SYSTEM TREASURY</span>
                  </div>
                  <span className="card-status-badge" style={{ backgroundColor: 'rgba(13, 148, 136, 0.2)', color: 'var(--teal-accent)' }}>
                    SYS_ACTIVE
                  </span>
                </div>

                <div className="card-number" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#CBD5E1' }}>
                  <span>{systemAccount._id}</span>
                  <button 
                    onClick={copyToClipboard} 
                    style={{ color: 'var(--slate-text)', display: 'inline-flex' }}
                    title="Copy Treasury ID"
                  >
                    {copied ? <Check size={16} style={{ color: 'var(--teal-accent)' }} /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="card-bottom">
                  <div>
                    <div className="balance-label" style={{ color: '#94A3B8' }}>Treasury Ledger Pool</div>
                    <div className="balance-value" style={{ color: 'var(--white)' }}>
                      {balance !== null ? `${balance.toLocaleString()} ${systemAccount.currency || 'INR'}` : '0 INR'}
                    </div>
                  </div>
                  <button 
                    onClick={handleRefreshBalance} 
                    style={{ color: 'var(--teal-accent)', display: 'inline-flex' }} 
                    title="Refresh Balance"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-account-card" style={{ border: '2px dashed rgba(13, 148, 136, 0.3)' }}>
                <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(13, 148, 136, 0.1)', color: 'var(--teal-accent)' }}>
                  <Coins size={36} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No Treasury Account Opened</h3>
                <p>The system user needs a treasury bank account to back initial fund provisions to clients.</p>
                <button 
                  onClick={handleCreateSystemAccount} 
                  className="btn btn-primary" 
                  disabled={actionLoading}
                  style={{ background: 'linear-gradient(135deg, var(--teal-accent), var(--ocean-blue))' }}
                >
                  <Plus size={18} /> {actionLoading ? 'Initializing Treasury...' : 'Initialize Treasury Account'}
                </button>
              </div>
            )}

            {/* Audit log explanation */}
            <div className="feature-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--ocean-blue)' }}>
                <BookOpen size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Auditing Operations</h3>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.875rem', lineHeight: '1.6' }}>
                All provisions are logged directly in the ledger schema. As an administrator, your treasury account performs matching Debit operations to supply credit balances to client accounts. Ensure the treasury pool remains funded.
              </p>
            </div>
            
          </div>

          {/* Right Column: Dispatch Initial Funds */}
          <div className="transfer-card" style={{ margin: 0, maxWidth: 'none', height: 'fit-content' }}>
            <div className="transfer-header" style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Dispatch Initial Funds</h2>
              <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.25rem' }}>Inject capital into client user bank accounts securely.</p>
            </div>

            <form onSubmit={handleDispatchFunds}>
              <div className="form-group">
                <label className="form-label">Client Account ID (Recipient)</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-text)', display: 'flex' }}>
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter user account Mongo ID..."
                    value={recipientAccount}
                    onChange={(e) => setRecipientAccount(e.target.value)}
                    required
                    style={{ paddingLeft: '2.5rem' }}
                    disabled={actionLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Amount (INR)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  disabled={actionLoading}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1.5rem', background: 'linear-gradient(135deg, var(--teal-accent), var(--ocean-blue))' }}
                disabled={actionLoading || !systemAccount}
              >
                <Send size={16} /> {actionLoading ? 'Dispatching...' : 'Dispatch Capital'}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
