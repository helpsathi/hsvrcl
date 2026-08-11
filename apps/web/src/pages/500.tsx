import React from 'react';

export default function Custom500() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>500 - Server-side error occurred</h1>
        <p style={{ marginTop: '12px', color: '#94a3b8' }}>Our team has been notified. Please try again later.</p>
      </div>
    </div>
  );
}
