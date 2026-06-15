import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { api } from '../services/api';
import { 
  AlertCircle, 
  Plus, 
  Landmark, 
  ArrowRight, 
  CreditCard,
  Briefcase,
  Users
} from 'lucide-react';

export default function AccountSelector() {
  const { user, selectedAccountId, setSelectedAccountId } = useContext(UserContext);
  const navigate = useNavigate();
  const [accountsList, setAccountsList] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      loadUserAccounts();
    }
  }, [user]);

  const loadUserAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch default account from backend
      const response = await api.getAccounts();
      const defaultAcc = response.accounts;

      // 2. Fetch local accounts registry from localStorage
      const storageKey = `accounts_${user._id}`;
      const savedAccounts = localStorage.getItem(storageKey);
      let localAccounts = savedAccounts ? JSON.parse(savedAccounts) : [];

      // Ensure the default account is in the list
      if (defaultAcc) {
        const hasDefault = localAccounts.some(acc => acc._id === defaultAcc._id);
        if (!hasDefault) {
          localAccounts.unshift(defaultAcc);
          localStorage.setItem(storageKey, JSON.stringify(localAccounts));
        }
      }

      setAccountsList(localAccounts);

      // 3. Query live balances for all accounts in the list
      const balancePromises = localAccounts.map(async (acc) => {
        try {
          const balResponse = await api.getBalance(acc._id);
          return { id: acc._id, balance: balResponse.balance };
        } catch (e) {
          return { id: acc._id, balance: 0 }; // fallback
        }
      });

      const resolvedBalances = await Promise.all(balancePromises);
      const balanceMap = {};
      resolvedBalances.forEach(item => {
        balanceMap[item.id] = item.balance;
      });

      setBalances(balanceMap);
    } catch (err) {
      setError(err.message || 'Failed to load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setActionLoading(true);
    setError('');
    try {
      const response = await api.createAccount();
      const newAcc = response.account;

      if (newAcc) {
        const storageKey = `accounts_${user._id}`;
        const currentAccounts = [...accountsList];
        currentAccounts.push(newAcc);
        localStorage.setItem(storageKey, JSON.stringify(currentAccounts));
        
        // Refresh list
        setAccountsList(currentAccounts);
        setBalances(prev => ({
          ...prev,
          [newAcc._id]: 0 // new account balance defaults to 0
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to create a new account.');
    } finally {
      setActionLoading(false);
    }
  };

  const selectAccount = (id) => {
    setSelectedAccountId(id);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner-large"></div>
        <p>Retrieving your bank accounts...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--ocean-blue)', marginBottom: '1rem' }}>
            <Landmark size={32} />
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Select Bank Account</h1>
          <p style={{ color: '#94A3B8', marginTop: '0.5rem' }}>Choose an active account to manage or open a new checking account.</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '2.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          {accountsList.map((acc, index) => {
            const isSelected = selectedAccountId === acc._id;
            const balance = balances[acc._id] !== undefined ? balances[acc._id] : 0;

            return (
              <div 
                key={acc._id} 
                onClick={() => selectAccount(acc._id)}
                className="feature-card" 
                style={{ 
                  cursor: 'pointer', 
                  border: isSelected ? '2px solid var(--ocean-blue)' : '1px solid var(--navy-medium)',
                  background: isSelected ? 'rgba(37, 99, 235, 0.04)' : 'var(--navy-dark)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '180px',
                  padding: '1.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: '#94A3B8' }}>
                      <CreditCard size={16} />
                      <span>ACCOUNT #{index + 1}</span>
                    </div>
                    <span 
                      className="card-status-badge" 
                      style={{ 
                        fontSize: '0.65rem', 
                        padding: '0.2rem 0.5rem',
                        backgroundColor: acc.status === 'Active' ? '#DCFCE7' : '#FEE2E2',
                        color: acc.status === 'Active' ? '#15803D' : '#991B1B'
                      }}
                    >
                      {acc.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#CBD5E1', wordBreak: 'break-all' }}>
                    {acc._id}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>Live Balance</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--white)' }}>
                      {balance.toLocaleString()} {acc.currency || 'INR'}
                    </div>
                  </div>
                  <div style={{ color: 'var(--ocean-blue)' }}>
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Create New Account Button Card */}
          <div 
            onClick={!actionLoading ? handleCreateAccount : undefined}
            className="no-account-card"
            style={{ 
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              border: '2px dashed var(--navy-medium)', 
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              minHeight: '180px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--ocean-blue)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--navy-medium)'}
          >
            <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--ocean-blue)' }}>
              <Plus size={24} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Open New Account</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', maxWidth: '180px' }}>Create an additional checking ledger instantly</p>
          </div>
        </div>

      </div>
    </div>
  );
}
