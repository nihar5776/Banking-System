import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, FileSpreadsheet, ArrowRight, Landmark, Mail, Server, Layers } from 'lucide-react';

export default function Landing() {
  return (
    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--ocean-blue)' }}>
              <Landmark size={48} />
            </div>
          </div>
          <h1 className="hero-title">
            Welcome to <span>Oceanic Trust Bank</span>
          </h1>
          <p className="hero-subtitle">
            An advanced, secure banking application engineered with atomic ledger technology, multi-factor email verification, and spreadsheet analytics.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary">
              Open An Account <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Access Account
            </Link>
          </div>
        </div>
      </section>

      {/* Detailed System Information Section */}
      <section style={{ padding: '4rem 0 6rem 0', backgroundColor: '#0c1222' }}>
        <div className="container">
          
          {/* Main system introduction */}
          <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem' }}>How Our Application Works</h2>
            <p style={{ color: '#94A3B8', maxWidth: '720px', margin: '0 auto', fontSize: '1.05rem', lineHeight: '1.6' }}>
              Oceanic Trust is a secure digital banking ledger. We implement strict double-entry bookkeeping rules to ensure ledger consistency and absolute safety of user assets.
            </p>
          </div>

          {/* 4 Core pillars explaining the app */}
          <div className="features-grid" style={{ marginBottom: '5rem' }}>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Mail size={24} />
              </div>
              <h3>MFA OTP Email Security</h3>
              <p>
                All account creations and password recovery workflows are secured with a 6-Digit One-Time Passcode (OTP). Passcodes are dispatched via secure SMTP email delivery and feature automatic expiration counters.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Layers size={24} />
              </div>
              <h3>Double-Entry Bookkeeping</h3>
              <p>
                Every transaction generates synchronized, balanced Debit and Credit entries in our ledger model. Money is never directly added or subtracted from an account field; rather, the balance is derived dynamically by aggregating all ledger records.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Zap size={24} />
              </div>
              <h3>Atomic Transaction Commit</h3>
              <p>
                Transfers utilize MongoDB session transactions with a 15-second simulation window. If any step (like insufficient balance or connection dropout) fails, the entire transaction is rolled back safely, preventing partial deposits.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <FileSpreadsheet size={24} />
              </div>
              <h3>Excel Auditable Statements</h3>
              <p>
                Need records? Download fully styled Excel spreadsheets (`.xlsx`) dynamically generated on the server showing complete transaction IDs, dates, debits/credits, and final statuses directly.
              </p>
            </div>

          </div>

          {/* Technical Specifications Section */}
          <div style={{ 
            backgroundColor: 'var(--navy-dark)', 
            border: '1px solid var(--navy-medium)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '3rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Server size={22} style={{ color: 'var(--teal-accent)' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>System Specifications</h3>
            </div>
            
            <p style={{ color: '#94A3B8', marginBottom: '2rem', fontSize: '0.95rem' }}>
              Oceanic Trust's architecture is separated into a secure Express backend and a decoupled React frontend:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--white)', marginBottom: '0.5rem' }}>Backend Stack</h4>
                <ul style={{ color: '#94A3B8', fontSize: '0.9rem', listStyleType: 'disc', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>Node.js & Express</li>
                  <li>MongoDB (Mongoose Schemas)</li>
                  <li>Nodemailer (SMTP mailers)</li>
                  <li>ExcelJS (spreadsheet compilation)</li>
                  <li>bcrypt password hashing</li>
                </ul>
              </div>

              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--white)', marginBottom: '0.5rem' }}>Frontend Stack</h4>
                <ul style={{ color: '#94A3B8', fontSize: '0.9rem', listStyleType: 'disc', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>React 18 & Vite</li>
                  <li>React Router DOM (SPA Routing)</li>
                  <li>Vanilla CSS Variables</li>
                  <li>Lucide React Vector Graphics</li>
                  <li>Local Server Proxying</li>
                </ul>
              </div>

              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--white)', marginBottom: '0.5rem' }}>Security Protocol</h4>
                <ul style={{ color: '#94A3B8', fontSize: '0.9rem', listStyleType: 'disc', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>JWT authorization tokens</li>
                  <li>HTTPOnly Secure Session Cookies</li>
                  <li>Transaction Idempotency Guards</li>
                  <li>MFA OTP validations</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
