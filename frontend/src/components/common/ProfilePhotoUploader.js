import React, { useState, useRef } from 'react';
import api from '../../services/api';

const BACKEND_ORIGIN = 'http://127.0.0.1:8000';

export const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `${BACKEND_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
};

const ProfilePhotoUploader = ({
  photoUrl,
  fullName = '',
  email = '',
  role = 'candidate',
  size = 88,
  onPhotoUpdated,
  onNotify,
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  const displayUrl = previewUrl || resolveMediaUrl(photoUrl);

  const getInitials = () => {
    const source = (fullName || email || 'U').trim();
    const parts = source.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  };

  const syncLocalStorageUser = (newPhotoUrl) => {
    try {
      const raw = localStorage.getItem('careerai_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.profile_photo_url = newPhotoUrl;
        localStorage.setItem('careerai_user', JSON.stringify(parsed));
        window.dispatchEvent(new Event('careerai-user-updated'));
      }
    } catch {
      // Ignore storage parse issues
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      if (onNotify) onNotify('danger', 'Please select a valid JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      if (onNotify) onNotify('danger', 'Image size must be 5MB or less.');
      return;
    }

    const localBlobUrl = URL.createObjectURL(file);
    setPreviewUrl(localBlobUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/auth/profile/photo/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const savedUrl = response.data?.profile_photo_url || '';
      setPreviewUrl('');
      syncLocalStorageUser(savedUrl);
      if (onPhotoUpdated) onPhotoUpdated(savedUrl);
      if (onNotify) onNotify('success', 'Profile photo updated successfully!');
    } catch (err) {
      setPreviewUrl('');
      if (onNotify) {
        onNotify(
          'danger',
          err.response?.data?.error || 'Failed to upload profile photo. Please try again.'
        );
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    try {
      await api.delete('/auth/profile/photo/');
      setPreviewUrl('');
      syncLocalStorageUser(null);
      if (onPhotoUpdated) onPhotoUpdated('');
      if (onNotify) onNotify('success', 'Profile photo removed.');
    } catch (err) {
      if (onNotify) onNotify('danger', 'Could not remove profile photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="d-flex align-items-center gap-3">
      {/* Circular Avatar Preview */}
      <div className="position-relative flex-shrink-0" style={{ width: `${size}px`, height: `${size}px` }}>
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={fullName || 'Profile Avatar'}
            className="rounded-circle object-fit-cover shadow-sm"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              border: '3px solid #EEF2FF',
            }}
          />
        ) : (
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              background:
                role === 'admin'
                  ? 'linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)'
                  : 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
              color: role === 'admin' ? '#FFFFFF' : '#4F46E5',
              fontSize: `${Math.round(size * 0.34)}px`,
              border: '3px solid #E2E8F0',
            }}
          >
            {getInitials()}
          </div>
        )}

        {/* Camera Quick-Trigger Badge */}
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          title="Change Profile Photo"
          className="btn btn-sm position-absolute bottom-0 end-0 rounded-circle d-flex align-items-center justify-content-center shadow-sm p-0"
          style={{
            width: '30px',
            height: '30px',
            backgroundColor: '#4F46E5',
            color: '#FFFFFF',
            border: '2px solid #FFFFFF',
          }}
        >
          {uploading ? (
            <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span>
          ) : (
            <i className="bi bi-camera-fill" style={{ fontSize: '12px' }}></i>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="d-none"
          onChange={handleFileChange}
        />
      </div>

      {/* Upload / Remove Action Controls */}
      <div className="d-flex flex-column gap-1">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-sm fw-semibold px-3 py-1.5"
            style={{
              backgroundColor: '#EEF2FF',
              color: '#4F46E5',
              borderRadius: '8px',
              fontSize: '12.5px',
            }}
          >
            <i className="bi bi-upload me-1"></i>
            {displayUrl ? 'Change Photo' : 'Upload Photo'}
          </button>

          {displayUrl && (
            <button
              type="button"
              disabled={uploading}
              onClick={handleRemovePhoto}
              className="btn btn-sm btn-outline-danger px-2.5 py-1.5"
              style={{ borderRadius: '8px', fontSize: '12.5px' }}
            >
              <i className="bi bi-trash"></i>
            </button>
          )}
        </div>
        <span className="text-muted" style={{ fontSize: '11.5px' }}>
          JPG, PNG, or WEBP (Max 5MB)
        </span>
      </div>
    </div>
  );
};

export default ProfilePhotoUploader;