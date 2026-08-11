import React from 'react';

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
          {statusCode ? `${statusCode} - An error occurred on server` : 'An error occurred on client'}
        </h1>
        <p style={{ marginTop: '12px', color: '#94a3b8' }}>Please refresh the page or return home.</p>
        <a href="/" style={{ marginTop: '20px', display: 'inline-block', padding: '10px 20px', backgroundColor: '#10b981', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          Go Home
        </a>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
