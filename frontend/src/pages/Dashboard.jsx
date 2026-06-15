import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { api } from '../services/api';
import { 
  AlertCircle, 
  RefreshCw, 
  FileDown, 
  ArrowUpRight, 
  Copy, 
  Check, 
  CreditCard,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft
} from 'lucide-react';

export default function Dashboard() {
  const { user, selectedAccountId, setSelectedAccountId } = useContext(UserContext);
  const navigate = useNavigate();
  
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [txnCounts, setTxnCounts] = useState({ total: 0, debit: 0, credit: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedAccountId) {
      navigate('/accounts');
      return;
    }
    fetchAccountData();
  }, [user, selectedAccountId]);

  const fetchAccountData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Load accounts from registry
      const storageKey = `accounts_${user._id}`;
      const savedAccounts = localStorage.getItem(storageKey);
      const accountsList = savedAccounts ? JSON.parse(savedAccounts) : [];
      const currentAcc = accountsList.find(acc => acc._id === selectedAccountId);

      if (!currentAcc) {
        // Fallback: clear selection and go to selector
        setSelectedAccountId(null);
        navigate('/accounts');
        return;
      }

      setAccount(currentAcc);

      // 2. Query live balance from API
      const balanceResponse = await api.getBalance(selectedAccountId);
      setBalance(balanceResponse.balance);

      // 3. Load transaction logs from DB history API
      const historyResponse = await api.getHistory(selectedAccountId);
      const history = historyResponse.transactions || [];
      setRecentTxns(history.slice(0, 5)); // top 5 for dashboard summary
      
      const debits = history.filter(t => t.type === 'Debit').length;
      const credits = history.filter(t => t.type === 'Credit').length;
      setTxnCounts({
        total: history.length,
        debit: debits,
        credit: credits
      });

    } catch (err) {
      setError(err.message || 'Failed to fetch account balance.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    if (!selectedAccountId) return;
    try {
      const balanceResponse = await api.getBalance(selectedAccountId);
      setBalance(balanceResponse.balance);

      // Reload transactions log from DB history API
      const historyResponse = await api.getHistory(selectedAccountId);
      const history = historyResponse.transactions || [];
      setRecentTxns(history.slice(0, 5));
      setTxnCounts({
        total: history.length,
        debit: history.filter(t => t.type === 'Debit').length,
        credit: history.filter(t => t.type === 'Credit').length
      });
    } catch (err) {
      setError(err.message || 'Failed to refresh balance.');
    }
  };

  const handleDownloadStatement = async () => {
    if (!selectedAccountId) return;
    setError('');
    try {
      const blob = await api.getStatementBlob(selectedAccountId);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `statement_${selectedAccountId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download Excel statement. Please try again.');
    }
  };

  const copyToClipboard = () => {
    if (!selectedAccountId) return;
    navigator.clipboard.writeText(selectedAccountId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner-large"></div>
        <p>Loading account dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="container">
        
        {/* Welcome Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="welcome-title">
              Hello, <span>{user?.name}</span>
            </h1>
            <p style={{ color: '#94A3B8', marginTop: '0.25rem' }}>Currently managing account ledger.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/accounts')} 
              className="btn btn-secondary" 
              style={{ display: 'inline-flex', gap: '0.5rem', padding: '0.6rem 1rem' }}
            >
              <Layers size={14} /> Switch Accounts
            </button>
            <button 
              onClick={handleRefreshBalance} 
              className="btn btn-secondary" 
              style={{ display: 'inline-flex', gap: '0.5rem', padding: '0.6rem 1rem' }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
          
          {/* Card left: Active Bank Card */}
          {account && (
            <div className="bank-card" style={{ minHeight: '220px', padding: '2.25rem' }}>
              <div className="card-top">
                <div className="bank-logo">
                  <CreditCard size={20} style={{ color: 'var(--ocean-blue)' }} />
                  <span>OCEANIC TRUST</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="card-status-badge">
                    {account.status}
                  </span>
                  <div className="card-chip"></div>
                </div>
              </div>

              <div className="card-number" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
                <span style={{ fontSize: '1.25rem' }}>{account._id}</span>
                <button 
                  onClick={copyToClipboard} 
                  style={{ color: 'var(--slate-text)', display: 'inline-flex' }}
                  title="Copy Account ID"
                >
                  {copied ? <Check size={16} style={{ color: 'var(--teal-accent)' }} /> : <Copy size={16} />}
                </button>
              </div>

              <div className="card-bottom">
                <div>
                  <div className="balance-label">Available Balance</div>
                  <div className="balance-value" style={{ fontSize: '2rem' }}>
                    {balance !== null ? `${balance.toLocaleString()} ${account.currency || 'INR'}` : '---'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card right: Account Statistics Summary */}
          <div style={{ 
            backgroundColor: 'var(--navy-dark)', 
            border: '1px solid var(--navy-medium)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '2.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)' }}>Ledger Summary</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', margin: '1.5rem 0' }}>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Transactions</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{txnCounts.total}</div>
              </div>
              <div 
                onClick={() => navigate('/analytics/debit')}
                style={{ cursor: 'pointer', textAlign: 'center', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.1)' }}
              >
                <div style={{ fontSize: '0.75rem', color: '#FCA5A5', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                  <TrendingDown size={12} /> Debits
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FCA5A5' }}>{txnCounts.debit}</div>
              </div>
              <div 
                onClick={() => navigate('/analytics/credit')}
                style={{ cursor: 'pointer', textAlign: 'center', padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.1)' }}
              >
                <div style={{ fontSize: '0.75rem', color: '#6EE7B7', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                  <TrendingUp size={12} /> Credits
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6EE7B7' }}>{txnCounts.credit}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => navigate('/transfer')} className="btn btn-primary" style={{ flexGrow: 1, fontSize: '0.85rem' }}>
                <ArrowUpRight size={14} /> Send Money
              </button>
              <button onClick={handleDownloadStatement} className="btn btn-secondary" style={{ flexGrow: 1, fontSize: '0.85rem' }}>
                <FileDown size={14} /> Export Statement
              </button>
            </div>
          </div>

        </div>

        {/* Analytics Shortcuts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
          
          <div 
            onClick={() => navigate('/analytics/debit')}
            className="feature-card" 
            style={{ cursor: 'pointer', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <TrendingDown size={18} /> Debit Expenses
              </h4>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Check charts, search transactions, and view all outflows.</p>
            </div>
            <div style={{ color: '#FCA5A5' }}>
              <ArrowRight size={20} />
            </div>
          </div>

          <div 
            onClick={() => navigate('/analytics/credit')}
            className="feature-card" 
            style={{ cursor: 'pointer', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <TrendingUp size={18} /> Credit Inflows
              </h4>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Check charts, search transactions, and view all deposits.</p>
            </div>
            <div style={{ color: '#6EE7B7' }}>
              <ArrowRight size={20} />
            </div>
          </div>

        </div>

        {/* Recent Ledger History table */}
        <div className="statement-section">
          <div className="section-header">
            <h3 className="section-title">Recent Transactions Summary</h3>
          </div>
          
          <div className="table-container">
            {recentTxns.length > 0 ? (
              <table className="txn-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transaction ID</th>
                    <th>Recipient/Source</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTxns.map((txn) => {
                    const isDebit = txn.type === 'Debit';
                    const t = txn.transaction;
                    const date = t?.createdAt ? new Date(t.createdAt).toLocaleDateString() : new Date(txn.createdAt).toLocaleDateString();
                    const txnId = t?._id || txn._id;
                    const counterpart = isDebit ? t?.toAccount : t?.fromAccount;
                    const desc = isDebit ? 'Fund Transfer Sent' : 'Fund Transfer Received';
                    return (
                      <tr key={txn._id}>
                        <td style={{ fontSize: '0.85rem' }}>{date}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94A3B8' }}>{txnId}</td>
                        <td style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{counterpart || 'N/A'}</td>
                        <td>{desc}</td>
                        <td>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px',
                            backgroundColor: isDebit ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: isDebit ? '#FCA5A5' : '#6EE7B7'
                          }}>
                            {txn.type}
                          </span>
                        </td>
                        <td className={isDebit ? 'amount-debit' : 'amount-credit'}>
                          {isDebit ? '-' : '+'}{txn.amount.toLocaleString()} INR
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-account-card" style={{ padding: '3rem 2rem', gap: '0.5rem' }}>
                <ArrowRightLeft size={24} style={{ color: 'var(--ocean-blue)' }} />
                <h4 style={{ fontWeight: 700, marginTop: '0.5rem' }}>No Transactions Yet</h4>
                <p style={{ fontSize: '0.8rem' }}>Transfers you perform or provision dispatches will be listed here.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
