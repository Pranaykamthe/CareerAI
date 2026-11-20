import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const InterviewHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get('/interviews/sessions/');
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setSessions(list);
      } catch (err) {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredSessions = sessions.filter((s) => {
    const cat = s.category || s.session_type || 'Technical';
    const matchesCat =
      categoryFilter === 'All' || cat.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      (s.role_target || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const scoredSessions = sessions.filter((s) => Number(s.overall_score || 0) > 0);
  const avgScore =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce((acc, s) => acc + Number(s.overall_score || 0), 0) /
            scoredSessions.length
        )
      : 0;
  const highestScore =
    scoredSessions.length > 0
      ? Math.max(...scoredSessions.map((s) => Math.round(Number(s.overall_score || 0))))
      : 0;

  // Chronological Trend Chart Data
  const chronological = [...scoredSessions].reverse();
  const chartData = {
    labels:
      chronological.length > 0
        ? chronological.map((s) => new Date(s.created_at).toLocaleDateString())
        : ['No Data'],
    datasets: [
      {
        label: 'Session Score (%)',
        data:
          chronological.length > 0
            ? chronological.map((s) => Math.round(Number(s.overall_score || 0)))
            : [0],
        fill: true,
        backgroundColor: 'rgba(79, 70, 229, 0.12)',
        borderColor: '#4F46E5',
        borderWidth: 2.5,
        tension: 0.35,
        pointRadius: 5,
        pointBackgroundColor: '#4F46E5',
        pointBorderColor: '#FFFFFF',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 100, ticks: { stepSize: 25, color: '#64748B' }, grid: { color: '#F1F5F9' } },
      x: { ticks: { color: '#64748B' }, grid: { display: false } },
    },
    plugins: { legend: { display: false } },
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return { bg: '#ECFDF5', color: '#059669', label: 'Great' };
    if (score >= 60) return { bg: '#EEF2FF', color: '#4F46E5', label: 'Good' };
    return { bg: '#FFFBEB', color: '#D97706', label: 'Needs Practice' };
  };

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="container">
        {/* Top Header */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <span
              className="badge rounded-pill px-3 py-1 fw-semibold mb-1"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
            >
              <i className="bi bi-clock-history me-1"></i> Progress Analytics
            </span>
            <h2 className="fw-bold mb-1" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
              Interview History &amp; Trends
            </h2>
            <p className="text-muted small mb-0">
              Review past AI mock interview transcripts, compare session scores, and track improvement over time.
            </p>
          </div>

          <Link
            to="/mock-interview"
            className="btn btn-sm text-white fw-semibold px-4 py-2 shadow-sm"
            style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
          >
            <i className="bi bi-plus-lg me-1"></i> New Mock Interview
          </Link>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="row g-3 mb-4">
          {[
            {
              label: 'Total Sessions',
              value: sessions.length,
              icon: 'bi-mic-fill',
              bg: '#EEF2FF',
              color: '#4F46E5',
            },
            {
              label: 'Average Score',
              value: `${avgScore}%`,
              icon: 'bi-graph-up-arrow',
              bg: '#ECFDF5',
              color: '#10B981',
            },
            {
              label: 'Highest Score',
              value: `${highestScore}%`,
              icon: 'bi-trophy-fill',
              bg: '#FFFBEB',
              color: '#D97706',
            },
            {
              label: 'Completed Rounds',
              value: scoredSessions.length,
              icon: 'bi-check2-circle',
              bg: '#EFF6FF',
              color: '#2563EB',
            },
          ].map((kpi, idx) => (
            <div key={idx} className="col-6 col-lg-3">
              <div className="card bg-white p-3 p-md-4 h-100 hover-card" style={cardStyle}>
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                    style={{ width: '44px', height: '44px', backgroundColor: kpi.bg, color: kpi.color }}
                  >
                    <i className={`bi ${kpi.icon} fs-5`}></i>
                  </div>
                  <div>
                    <div className="small text-muted fw-semibold">{kpi.label}</div>
                    <div className="fw-bold fs-3 lh-sm" style={{ color: '#0F172A' }}>
                      {kpi.value}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Score Trend Line Chart */}
        <div className="card bg-white p-4 mb-4" style={cardStyle}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-0">Performance Trend Over Time</h5>
              <small className="text-muted">Progression across evaluated mock interview sessions</small>
            </div>
            <span
              className="badge rounded-pill px-3 py-1 fw-semibold"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px' }}
            >
              Score Trajectory
            </span>
          </div>

          {chronological.length > 0 ? (
            <div style={{ height: '240px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div
              className="text-center py-5 rounded-4"
              style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}
            >
              <p className="text-muted small mb-0">
                Complete at least one mock interview session to plot your progress curve.
              </p>
            </div>
          )}
        </div>

        {/* Filter & Sessions Table Card */}
        <div className="card bg-white overflow-hidden" style={cardStyle}>
          <div className="p-3 p-md-4 border-bottom">
            <div className="row g-3 align-items-center">
              <div className="col-md-5">
                <div className="input-group">
                  <span
                    className="input-group-text border-end-0"
                    style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
                  >
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', fontSize: '13.5px' }}
                    placeholder="Filter by target role or track..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-7 d-flex flex-wrap justify-content-md-end gap-1">
                {['All', 'Technical', 'Behavioral', 'HR', 'Mixed'].map((cat) => {
                  const active = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className="btn btn-sm fw-semibold px-3 py-1"
                      style={{
                        borderRadius: '8px',
                        fontSize: '12px',
                        backgroundColor: active ? '#4F46E5' : '#F8FAFC',
                        color: active ? '#FFFFFF' : '#475569',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: '#4F46E5' }} role="status"></div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-chat-square-dots fs-1 text-muted"></i>
              <h6 className="fw-bold text-dark mt-3">No Interview Sessions Found</h6>
              <p className="text-muted small mb-3">
                Launch a new mock interview to start building your performance history.
              </p>
              <Link
                to="/mock-interview"
                className="btn btn-sm text-white fw-semibold px-4"
                style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
              >
                Start Mock Interview
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <tr className="small text-muted text-uppercase" style={{ fontSize: '11.5px' }}>
                    <th className="py-3 ps-4">Session Track</th>
                    <th className="py-3">Target Role</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Score</th>
                    <th className="py-3">Performance</th>
                    <th className="py-3 pe-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((sess) => {
                    const score = Math.round(Number(sess.overall_score || 0));
                    const badge = getScoreBadge(score);
                    const track = sess.category || sess.session_type || 'Technical';

                    return (
                      <tr key={sess.id}>
                        <td className="ps-4 py-3">
                          <span
                            className="badge rounded-pill px-3 py-1 fw-semibold"
                            style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
                          >
                            {track} Round
                          </span>
                        </td>
                        <td className="fw-bold text-dark small">
                          {sess.role_target || 'Software Developer'}
                        </td>
                        <td className="small text-muted">
                          {new Date(sess.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <span className="fw-bold text-dark">{score}%</span>
                        </td>
                        <td>
                          <span
                            className="badge rounded-pill px-2.5 py-1 fw-semibold"
                            style={{ backgroundColor: badge.bg, color: badge.color, fontSize: '11px' }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="pe-4 text-end">
                          <Link
                            to={`/interview-report/${sess.id}`}
                            className="btn btn-sm fw-semibold px-3"
                            style={{
                              backgroundColor: '#EEF2FF',
                              color: '#4F46E5',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          >
                            View Report <i className="bi bi-arrow-right ms-1"></i>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewHistory;