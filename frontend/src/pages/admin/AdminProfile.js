import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ProfilePhotoUploader from '../../components/common/ProfilePhotoUploader';

const AdminProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [adminData, setAdminData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    profile_photo_url: '',
    headline: '',
    location: '',
    bio: '',
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const loadAdminProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get('/auth/profile/');
        const data = res.data || {};
        const userObj = data.user || {};
        const pObj = data.profile || {};

        const fullName =
          [userObj.first_name, userObj.last_name].filter(Boolean).join(' ') ||
          userObj.username ||
          '';

        setAdminData({
          username: userObj.username || '',
          full_name: fullName,
          email: userObj.email || '',
          phone: userObj.phone || '',
          profile_photo_url: pObj.profile_photo_url || userObj.profile_photo_url || '',
          headline: pObj.headline || 'Platform Administrator',
          location: pObj.location || '',
          bio: pObj.bio || '',
        });
      } catch (err) {
        showToast('danger', 'Failed to load administrator profile.');
      } finally {
        setLoading(false);
      }
    };

    loadAdminProfile();
  }, []);

  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile/', {
        full_name: adminData.full_name,
        phone: adminData.phone,
        headline: adminData.headline,
        location: adminData.location,
        bio: adminData.bio,
        user: {
          username: adminData.username,
          phone: adminData.phone,
        },
      });
      showToast('success', 'Administrator profile updated successfully!');
    } catch (err) {
      showToast('danger', 'Unable to save administrator profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  if (loading) {
    return (
      <div
        className="min-vh-100 d-flex justify-content-center align-items-center"
        style={{ backgroundColor: '#F8FAFC' }}
      >
        <div className="spinner-border" style={{ color: '#4F46E5' }} role="status"></div>
      </div>
    );
  }

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        {/* Top Bar */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Link
            to="/admin"
            className="btn btn-sm btn-light border text-dark d-inline-flex align-items-center gap-2 px-3 py-2 fw-medium shadow-sm"
            style={{ borderRadius: '10px', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
          >
            <i className="bi bi-arrow-left" style={{ color: '#4F46E5' }}></i> Back to Admin Console
          </Link>

          <span
            className="badge rounded-pill px-3 py-2 fw-semibold"
            style={{ backgroundColor: '#1E1B4B', color: '#A5B4FC', fontSize: '12px' }}
          >
            <i className="bi bi-shield-lock-fill me-1"></i> Administrator Account
          </span>
        </div>

        {/* Inline Toast Alert */}
        {toast && (
          <div
            className={`alert alert-${toast.type} d-flex align-items-center justify-content-between rounded-4 shadow-sm mb-4`}
          >
            <div className="d-flex align-items-center gap-2 small fw-semibold">
              <i
                className={`bi ${
                  toast.type === 'success'
                    ? 'bi-check-circle-fill'
                    : 'bi-exclamation-triangle-fill'
                }`}
              ></i>
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              className="btn-close btn-sm"
              onClick={() => setToast(null)}
            ></button>
          </div>
        )}

        {/* Admin Avatar Header Card */}
        <div className="card bg-white p-4 mb-4" style={cardStyle}>
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">
            <ProfilePhotoUploader
              photoUrl={adminData.profile_photo_url}
              fullName={adminData.full_name || adminData.username}
              email={adminData.email}
              role="admin"
              size={92}
              onPhotoUpdated={(newUrl) =>
                setAdminData((prev) => ({ ...prev, profile_photo_url: newUrl }))
              }
              onNotify={showToast}
            />

            <div className="text-md-end">
              <h4 className="fw-bold text-dark mb-1">
                {adminData.full_name || adminData.username || 'Administrator'}
              </h4>
              <div className="text-muted small mb-1">{adminData.email}</div>
              <span
                className="badge rounded-pill px-3 py-1 fw-medium"
                style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
              >
                {adminData.headline || 'Platform Administrator'}
              </span>
            </div>
          </div>
        </div>

        {/* Admin Account Form */}
        <form onSubmit={handleSaveAdminProfile}>
          <div className="card bg-white p-4" style={cardStyle}>
            <h5 className="fw-bold text-dark mb-3">
              <i className="bi bi-person-gear me-2" style={{ color: '#4F46E5' }}></i>
              Administrator Details
            </h5>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={adminData.full_name}
                  onChange={(e) =>
                    setAdminData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Admin Full Name"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={adminData.username}
                  onChange={(e) =>
                    setAdminData((prev) => ({ ...prev, username: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Email Address</label>
                <input
                  type="email"
                  className="form-control bg-light"
                  value={adminData.email}
                  disabled
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={adminData.phone}
                  onChange={(e) =>
                    setAdminData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Admin Title / Role</label>
                <input
                  type="text"
                  className="form-control"
                  value={adminData.headline}
                  onChange={(e) =>
                    setAdminData((prev) => ({ ...prev, headline: e.target.value }))
                  }
                  placeholder="Platform Administrator"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Location</label>
                <input
                  type="text"
                  className="form-control"
                  value={adminData.location}
                  onChange={(e) =>
                    setAdminData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="City, Country"
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold text-dark">Notes / Bio</label>
                <textarea
                  rows="3"
                  className="form-control"
                  value={adminData.bio}
                  onChange={(e) =>
                    setAdminData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Administrator responsibilities or contact notes..."
                ></textarea>
              </div>
            </div>

            <div className="d-flex justify-content-end mt-4 pt-3 border-top">
              <button
                type="submit"
                disabled={saving}
                className="btn px-4 py-2 fw-semibold text-white d-inline-flex align-items-center gap-2"
                style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle"></i> Save Admin Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;