import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [info, setInfo] = useState(null);
  const [visits, setVisits] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchInfo();
    fetchHistory();
  }, []);

  const fetchInfo = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/info`);
      const data = await response.json();
      setInfo(data);
    } catch (err) {
      console.error('Failed to fetch info:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/history`);
      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const recordVisit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/visits`);
      const data = await response.json();
      setVisits(data);
      await fetchHistory();
    } catch (err) {
      setError('Failed to record visit: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const testDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/db-test`);
      const data = await response.json();
      alert(`Database Status: ${data.status}\nTimestamp: ${data.timestamp || 'N/A'}`);
    } catch (err) {
      alert('Database test failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const testRedis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/redis-test`);
      const data = await response.json();
      alert(`Redis Status: ${data.status}\nTest Value: ${data.test || 'N/A'}`);
    } catch (err) {
      alert('Redis test failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 GitOps Application</h1>
        <p>Microservices Architecture Demo</p>
      </header>

      <div className="content">
        {info && (
          <div className="info-card">
            <h2>Backend Info</h2>
            <p><strong>Name:</strong> {info.name}</p>
            <p><strong>Version:</strong> {info.version}</p>
            <p><strong>Environment:</strong> <span className="badge">{info.environment}</span></p>
            <p><strong>Log Level:</strong> {info.logLevel}</p>
          </div>
        )}

        <div className="actions-card">
          <h2>Actions</h2>
          <div className="button-group">
            <button onClick={recordVisit} disabled={loading}>
              {loading ? 'Processing...' : '📊 Record Visit'}
            </button>
            <button onClick={testDatabase} disabled={loading}>
              🗄️ Test Database
            </button>
            <button onClick={testRedis} disabled={loading}>
              🔴 Test Redis
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </div>

        {visits && (
          <div className="visits-card">
            <h2>Latest Visit</h2>
            <p className="visit-count">{visits.visits}</p>
            <p className="visit-message">{visits.message}</p>
            <p><strong>Cached:</strong> {visits.cached ? '✅ Yes' : '❌ No'}</p>
          </div>
        )}

        {history.length > 0 && (
          <div className="history-card">
            <h2>Visit History</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Count</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id}>
                    <td>{record.id}</td>
                    <td>{record.visitor_count}</td>
                    <td>{new Date(record.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="architecture-card">
          <h2>Architecture</h2>
          <div className="architecture-diagram">
            <div className="service">Frontend (React)</div>
            <div className="arrow">↓</div>
            <div className="service">Backend (Node.js/Express)</div>
            <div className="arrow-split">
              <div className="arrow-left">↙</div>
              <div className="arrow-right">↘</div>
            </div>
            <div className="services-row">
              <div className="service">PostgreSQL</div>
              <div className="service">Redis</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
