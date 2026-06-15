import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { api } from '../services/api';
import { 
  ArrowLeft, 
  Search, 
  TrendingDown, 
  AlertCircle,
  FileDown
} from 'lucide-react';

export default function DebitAnalytics() {
  const { user, selectedAccountId } = useContext(UserContext);
  const navigate = useNavigate();

  const [debitTxns, setDebitTxns] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedAccountId) {
      navigate('/accounts');
      return;
    }
    loadDebitData();
  }, [user, selectedAccountId]);

  const loadDebitData = async () => {
    try {
      const response = await api.getHistory(selectedAccountId);
      const history = response.transactions || [];
      const debits = history.filter(t => t.type === 'Debit');
      setDebitTxns(debits);

      // Compute chart data: Group debits by last 7 calendar days
      const days = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        days.push({
          dateStr: d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }),
          rawDate: d.toDateString(),
          amount: 0
        });
      }

      debits.forEach(txn => {
        const t = txn.transaction;
        const txnDate = new Date(t?.createdAt || txn.createdAt).toDateString();
        const match = days.find(day => day.rawDate === txnDate);
        if (match) {
          match.amount += txn.amount;
        }
      });

      setChartData(days);
    } catch (e) {
      setError('Failed to process analytical ledger.');
    }
  };

  // Filter debits based on search query
  const filteredDebits = debitTxns.filter(txn => {
    const q = searchQuery.toLowerCase();
    const t = txn.transaction;
    const txnId = t?._id || txn._id;
    const targetAcc = t?.toAccount || '';
    return (
      txnId.toLowerCase().includes(q) ||
      targetAcc.toLowerCase().includes(q) ||
      txn.amount.toString().includes(q)
    );
  });

  // Calculate totals
  const totalDebitSum = debitTxns.reduce((sum, t) => sum + t.amount, 0);
  const maxBarVal = Math.max(...chartData.map(d => d.amount), 1000); // minimum scale of 1000

  return (
    <div style={{ padding: '3rem 0', flexGrow: 1, backgroundColor: '#0c1222' }}>
      <div className="container">
        
        {/* Back Button */}
        <div style={{ marginBottom: '2rem' }}>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.95rem' }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Header summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '3rem' }}>
          
          {/* Summary Panel */}
          <div style={{ 
            backgroundColor: 'var(--navy-dark)', 
            border: '1px solid var(--navy-medium)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FCA5A5', marginBottom: '0.75rem' }}>
              <TrendingDown size={22} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>DEBIT ANALYTICS</span>
            </div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800 }}>{totalDebitSum.toLocaleString()} INR</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.5rem' }}>Total accumulated debit outflows over active ledger timeline.</p>
          </div>

          {/* SVG Bar Chart */}
          <div style={{ 
            backgroundColor: 'var(--navy-dark)', 
            border: '1px solid var(--navy-medium)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '2rem',
            position: 'relative'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1.5rem' }}>Daily Debit Volume (Last 7 Days)</h3>
            
            <div style={{ width: '100%', height: '140px' }}>
              <svg viewBox="0 0 500 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {/* Horizontal coordinate guidelines */}
                <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="0" y1="45" x2="500" y2="45" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="0"  x2="500" y2="0"  stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                {chartData.map((day, idx) => {
                  const width = 36;
                  const x = idx * 70 + 20;
                  const barHeight = (day.amount / maxBarVal) * 80;
                  const y = 90 - barHeight;

                  return (
                    <g key={idx}>
                      {/* Interactive bar */}
                      <rect 
                        x={x} 
                        y={y} 
                        width={width} 
                        height={barHeight} 
                        fill="url(#debitGradient)" 
                        rx="3"
                        style={{ transition: 'all 0.5s ease-out' }}
                      />
                      
                      {/* Tooltip value */}
                      {day.amount > 0 && (
                        <text 
                          x={x + width / 2} 
                          y={y - 6} 
                          textAnchor="middle" 
                          fill="#FCA5A5" 
                          fontSize="7" 
                          fontWeight="700"
                        >
                          {day.amount >= 1000 ? `${(day.amount / 1000).toFixed(1)}k` : day.amount}
                        </text>
                      )}

                      {/* X-axis labels */}
                      <text 
                        x={x + width / 2} 
                        y="105" 
                        textAnchor="middle" 
                        fill="#64748B" 
                        fontSize="7.5"
                        fontWeight="600"
                      >
                        {day.dateStr}
                      </text>
                    </g>
                  );
                })}

                {/* SVG Color Gradients */}
                <defs>
                  <linearGradient id="debitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#FCA5A5" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

        </div>

        {/* Detailed Transactions List */}
        <div className="statement-section">
          
          <div className="section-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 className="section-title">Chronological Debit Records</h3>
            
            {/* Search Input Box */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
              <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-text)', display: 'flex' }}>
                <Search size={16} />
              </div>
              <input
                type="text"
                className="form-input"
                placeholder="Search recipient, ID, or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem', height: '2.25rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}
              />
            </div>
          </div>

          <div className="table-container">
            {filteredDebits.length > 0 ? (
              <table className="txn-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transaction ID</th>
                    <th>Recipient Account</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDebits.map((txn) => {
                    const t = txn.transaction;
                    const date = t?.createdAt ? new Date(t.createdAt).toLocaleString() : new Date(txn.createdAt).toLocaleString();
                    const txnId = t?._id || txn._id;
                    const toAcc = t?.toAccount || 'N/A';
                    const status = t?.status || txn.status || 'Completed';
                    return (
                      <tr key={txn._id}>
                        <td style={{ fontSize: '0.85rem' }}>{date}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94A3B8' }}>{txnId}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{toAcc}</td>
                        <td>Fund Transfer Sent</td>
                        <td>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 700, 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '4px',
                            backgroundColor: status === 'Completed' ? '#DCFCE7' : '#FEE2E2',
                            color: status === 'Completed' ? '#15803D' : '#991B1B'
                          }}>
                            {status}
                          </span>
                        </td>
                        <td className="amount-debit" style={{ fontWeight: 700 }}>
                          -{txn.amount.toLocaleString()} INR
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-account-card" style={{ padding: '4rem 2rem' }}>
                <AlertCircle size={24} style={{ color: 'var(--slate-text)' }} />
                <h4 style={{ fontWeight: 700, marginTop: '0.5rem' }}>No Matching Debits</h4>
                <p style={{ fontSize: '0.8rem' }}>Check spelling or try a different search phrase.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
