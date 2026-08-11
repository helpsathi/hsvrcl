import React from 'react';

export default function Custom404() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>404 - Page Not Found</h1>
        <p style={{ marginTop: '12px', color: '#94a3b8' }}>The page you are looking for does not exist or has been moved.</p>
        <a href="/" style={{ marginTop: '20px', display: 'inline-block', padding: '10px 20px', backgroundColor: '#10b981', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          Go Home
        </a>
      </div>
    </div>
  );
}
