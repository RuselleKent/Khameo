import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [backendData, setBackendData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Axios request directly hitting the local Laravel development API port
    axios.get('http://localhost:8000/api/connection-test')
      .then(response => {
        setBackendData(response.data);
        setErrorMessage(null);
      })
      .catch(error => {
        console.error('API Connection Error:', error);
        setErrorMessage('Failed to connect to the Laravel API. Check if your backend server is running and CORS is configured.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '80px auto', 
      padding: '30px', 
      fontFamily: 'system-ui, sans-serif', 
      textAlign: 'center',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    }}>
      <h1 style={{ color: '#2d3748', marginBottom: '24px' }}>React & Laravel Connection</h1>

      {loading && (
        <p style={{ color: '#4a5568', fontStyle: 'italic' }}>
          Testing API handshakes...
        </p>
      )}

      {errorMessage && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#fff5f5', 
          color: '#c53030', 
          borderRadius: '8px',
          border: '1px solid #feb2b2',
          lineHeight: '1.5'
        }}>
          <strong>🔴 Connection Failed</strong>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>{errorMessage}</p>
        </div>
      )}

      {backendData && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f0fdf4', 
          color: '#166534', 
          borderRadius: '8px',
          border: '1px solid #bbf7d0'
        }}>
          <h3 style={{ margin: '0 0 8px 0' }}>🟢 System Connected Successfully!</h3>
          <p style={{ margin: '0', fontSize: '15px', color: '#1e293b' }}>
            <strong>Server Message:</strong> {backendData.message}
          </p>
          <span style={{ display: 'block', marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
            Fetched at: {new Date(backendData.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}

export default App;
