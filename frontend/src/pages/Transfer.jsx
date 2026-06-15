import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { api } from '../services/api';

import { 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft, 
  DollarSign, 
  Send,
  HelpCircle
} from 'lucide-react';

export default function Transfer() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // Steps 1-5

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (location.state?.fromAccountId) {
      setFromAccount(location.state.fromAccountId);
    } else {
      // Fetch user's account ID if not passed from dashboard
      api.getAccounts()
        .then(response => {
          if (response.accounts) {
            setFromAccount(response.accounts._id);
          } else {
            setError('Please open a bank account first before transferring funds.');
          }
        })
        .catch(() => {
          setError('Failed to fetch your account details.');
        });
    }
  }, [user, location]);

  const steps = [
    { title: 'Validation & Balance Check', desc: 'Verifying account active states and confirming sufficient funds.' },
    { title: 'Database Session Locking', desc: 'Establishing secure isolation and beginning atomic ledger session.' },
    { title: 'Debit Entry Processing', desc: 'Debiting sender balance (incorporates intentional database latency simulation).' },
    { title: 'Credit Entry Processing', desc: 'Crediting recipient balance and synchronizing records.' },
    { title: 'Committal & Receipts', desc: 'Committing transaction records and emailing transaction receipts.' }
  ];

  // Visual simulation timer for the steps during the 15-second API wait
  useEffect(() => {
    if (!loading) return;

    let timer1, timer2, timer3;

    // Start with Step 1 (index 0) active immediately
    setCurrentStep(1);

    // Step 2 (index 1) active after 2.5 seconds
    timer1 = setTimeout(() => {
      setCurrentStep(2);
    }, 2500);

    // Step 3 (index 2) active after 5.5 seconds
    timer2 = setTimeout(() => {
      setCurrentStep(3);
    }, 5500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const parsedAmount = parseFloat(amount);
    if (!fromAccount) {
      setError('Sender account is missing. Please open a bank account first.');
      return;
    }
    if (!toAccount.trim()) {
      setError('Recipient account ID is required.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive transfer amount.');
      return;
    }
    if (fromAccount === toAccount.trim()) {
      setError('Sender and Recipient accounts cannot be the same.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.createTransaction(fromAccount, toAccount.trim(), parsedAmount);
      
      // When request resolves successfully, set all steps to completed (Step 5)
      setCurrentStep(5);
      setSuccess(response.message || 'Transaction processed successfully!');
      
      // Clear inputs
      setToAccount('');
      setAmount('');

      // Redirect back to dashboard after 3.5 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3500);
    } catch (err) {
      setError(err.message || 'Transaction failed. Please check details.');
      setLoading(false);
      setCurrentStep(0);
    }
  };

  return (
    <div style={{ padding: '3rem 0', flexGrow: 1, backgroundColor: '#0c1222' }}>
      <div className="container">
        
        <div style={{ marginBottom: '2rem' }}>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.95rem' }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>

        {error && !loading && (
          <div className="alert alert-error" style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* If loading is true, display the transaction progress tracker instead of form */}
        {loading ? (
          <div className="transfer-card" style={{ border: '1px solid rgba(37, 99, 235, 0.25)' }}>
            <div className="transfer-header">
              <h2 className="welcome-title">Processing <span>Transfer</span></h2>
              <p style={{ color: '#94A3B8', marginTop: '0.5rem' }}>Executing ledger transaction... please do not close or refresh this page.</p>
            </div>

            <div className="steps-container">
              {steps.map((step, index) => {
                const stepNum = index + 1;
                let statusClass = '';
                
                if (currentStep > stepNum) {
                  statusClass = 'completed';
                } else if (currentStep === stepNum) {
                  statusClass = 'active';
                }

                return (
                  <div key={index} className={`step-row ${statusClass}`}>
                    <div className="step-icon">
                      {statusClass === 'completed' ? '✓' : stepNum}
                    </div>
                    <div className="step-details">
                      <div className="step-title">{step.title}</div>
                      <div className="step-desc">{step.desc}</div>
                    </div>
                    {statusClass === 'active' && <div className="spinner"></div>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Transfer Form */
          <div className="transfer-card">
            <div className="transfer-header">
              <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--ocean-blue)', marginBottom: '1rem' }}>
                <Send size={24} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Fund Transfer</h2>
              <p style={{ color: '#94A3B8', fontSize: '0.95rem' }}>Send money to another Oceanic Trust Account instantly</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Source Account (Sender)</label>
                <input
                  type="text"
                  className="form-input"
                  value={fromAccount}
                  disabled
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94A3B8' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Recipient Account ID</span>
                  <HelpCircle size={14} style={{ color: 'var(--slate-text)' }} title="Enter the target account Mongo ID of the recipient" />
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 646a78cde4..."
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount (INR)</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-text)', display: 'flex' }}>
                    <DollarSign size={16} />
                  </div>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
                <Send size={16} /> Initiate Transfer
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
