import React, { useState, useEffect } from 'react';
import api from './services/api';

function App() {
  const [serverStatus, setServerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/health/')
      .then((response) => {
        setServerStatus(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to connect to backend server');
        setLoading(false);
      });
  }, []);

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-7">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 text-center">
              <h2 className="card-title text-primary fw-bold mb-3">
                <i className="bi bi-briefcase me-2"></i>CareerAI Workspace
              </h2>
              <p className="text-muted mb-4">Phase 1: Project Initialization & Connectivity Verification</p>

              {loading && (
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Connecting...</span>
                </div>
              )}

              {error && (
                <div className="alert alert-danger d-flex align-items-center justify-content-center" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <div>{error} (Ensure Django server is running on port 8000)</div>
                </div>
              )}

              {serverStatus && (
                <div className="alert alert-success text-start" role="alert">
                  <h5 className="alert-heading fw-bold mb-2">
                    <i className="bi bi-check-circle-fill me-2"></i>Backend Connected
                  </h5>
                  <hr />
                  <p className="mb-1"><strong>Status:</strong> {serverStatus.status}</p>
                  <p className="mb-1"><strong>Service:</strong> {serverStatus.system}</p>
                  <p className="mb-0"><strong>Database:</strong> {serverStatus.database}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;