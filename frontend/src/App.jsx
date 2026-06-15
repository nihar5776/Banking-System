import React, { createContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Landmark, LogOut, User, Layers, ArrowLeftRight } from 'lucide-react';
import { api } from './services/api';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import AccountSelector from './pages/AccountSelector';
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import DebitAnalytics from './pages/DebitAnalytics';
import CreditAnalytics from './pages/CreditAnalytics';
import AdminDashboard from './pages/AdminDashboard';

export const UserContext = createContext(null);

function Navigation() {
  const { user, setUser, selectedAccountId, setSelectedAccountId } = React.useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout API failed:', err);
    } finally {
      sessionStorage.clear();
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setUser(null);
      setSelectedAccountId(null);
      navigate('/');
    }
  };

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || 'nihar3611@gmail.com,admin@oceanic.com,niharni02@gmail.com').split(',');
  const isAdmin = user && adminEmails.includes(user.email);

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">
          <Landmark size={26} />
          <span>Oceanic Trust</span>
        </Link>
        <div className="nav-links">
          {user ? (
            <>
              {isAdmin ? (
                <>
                  <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Admin Console</Link>
                </>
              ) : (
                <>
                  <Link to="/accounts" className={`nav-link ${location.pathname === '/accounts' ? 'active' : ''}`}>
                    <Layers size={14} style={{ marginRight: '0.2rem', verticalAlign: 'middle' }} /> Switch Accounts
                  </Link>
                  {selectedAccountId && (
                    <>
                      <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
                      <Link to="/transfer" className={`nav-link ${location.pathname === '/transfer' ? 'active' : ''}`}>
                        <ArrowLeftRight size={14} style={{ marginRight: '0.2rem', verticalAlign: 'middle' }} /> Transfer
                      </Link>
                    </>
                  )}
                </>
              )}
              
              <span style={{ color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', fontWeight: 600 }}>
                <User size={15} /> {user.name}
              </span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                <LogOut size={13} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// Router guard components
function DashboardRoute() {
  const { user, selectedAccountId } = React.useContext(UserContext);
  if (!user) return <Login />;
  
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || 'nihar3611@gmail.com,admin@oceanic.com,niharni02@gmail.com').split(',');
  const isAdmin = user && adminEmails.includes(user.email);
  
  if (isAdmin) return <AdminDashboard />;
  if (!selectedAccountId) return <AccountSelector />;
  
  return <Dashboard />;
}

function ProtectedRoute({ children }) {
  const { user, selectedAccountId } = React.useContext(UserContext);
  if (!user) return <Login />;
  
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || 'nihar3611@gmail.com,admin@oceanic.com,niharni02@gmail.com').split(',');
  const isAdmin = user && adminEmails.includes(user.email);
  
  if (isAdmin) return <AdminDashboard />;
  if (!selectedAccountId) return <AccountSelector />;
  
  return children;
}

function AppContent() {
  return (
    <div className="app-layout">
      <Navigation />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Customer Routes */}
        <Route path="/accounts" element={<ProtectedRoute><AccountSelector /></ProtectedRoute>} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
        <Route path="/analytics/debit" element={<ProtectedRoute><DebitAnalytics /></ProtectedRoute>} />
        <Route path="/analytics/credit" element={<ProtectedRoute><CreditAnalytics /></ProtectedRoute>} />
      </Routes>
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Oceanic Trust Bank. All rights reserved. Secured by standard 256-bit encryption.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    return sessionStorage.getItem('selectedAccountId') || null;
  });

  const handleSetSelectedAccountId = (id) => {
    if (id) {
      sessionStorage.setItem('selectedAccountId', id);
    } else {
      sessionStorage.removeItem('selectedAccountId');
    }
    setSelectedAccountId(id);
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      selectedAccountId, 
      setSelectedAccountId: handleSetSelectedAccountId 
    }}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </UserContext.Provider>
  );
}
