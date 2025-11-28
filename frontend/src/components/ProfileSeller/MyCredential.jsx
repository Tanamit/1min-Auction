import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';

export default function MyCredential() {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    user_email: '',
    user_name: '',
    address: '',
    create_date: '',
    verify_img: '' // truthy if already verified
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // NEW: uploader state
  const [verifyFile, setVerifyFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user?.first_name || '',
        lastName:  user?.last_name  || '',
        user_email: user?.user_email || '',
        user_name:  user?.user_name  || '',
        address:    user?.address    || '',
        create_date: user?.create_date || '',
        verify_img:  user?.verify_img  || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((s) => ({ ...s, [field]: !s[field] }));
  };

  // -------- Password submit --------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New password and confirm password do not match!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/seller/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.user_id ?? ''
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          confirm_password: passwordData.confirmPassword
        }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || 'Failed to update password');

      alert('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Password update error:', err);
      alert(err.message);
    }
  };

  // -------- Verify image upload --------
  const handleVerifyFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      setVerifyFile(null);
      setPreviewUrl('');
      return;
    }

    // Basic client-side validation (<= 2MB, only png/jpg)
    const MAX = 2 * 1024 * 1024;
    if (f.size > MAX) {
      alert('File too large (max 2MB).');
      return;
    }
    if (!['image/png', 'image/jpeg'].includes(f.type)) {
      alert('Only PNG or JPG is allowed.');
      return;
    }

    setVerifyFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const uploadVerifyImage = async () => {
    if (!verifyFile) {
      alert('Please choose an image first.');
      return;
    }
    try {
      setIsUploading(true);
      const form = new FormData();
      form.append('file', verifyFile);

      const res = await fetch(`${API_BASE_URL}/api/seller/verify-image`, {
        method: 'PUT',
        headers: {
          'X-User-Id': user?.user_id ?? ''
          // DO NOT set Content-Type for FormData
        },
        body: form,
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || 'Failed to upload image');

      alert('Identity image uploaded!');
      setVerifyFile(null);
      setPreviewUrl('');
      // Optimistically mark verified; if your AuthContext refetches, you can remove this
      setFormData((s) => ({ ...s, verify_img: 'uploaded' }));
    } catch (err) {
      console.error('Verify image upload error:', err);
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const memberSince = (() => {
    const d = formData.create_date ? new Date(formData.create_date) : null;
    return d && !isNaN(d.getTime())
      ? d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : '—';
  })();

  return (
    <div className="bg-white shadow-sm rounded-lg p-8">
      <h2 className="text-2xl font-semibold text-red-500 mb-6">My Credential</h2>

      <div className="max-w-2xl">
        {/* Account Info */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{formData.user_email || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Username:</span>
              <span className="font-medium">{formData.user_name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Member since:</span>
              <span className="font-medium">{memberSince}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Identity:</span>
              <span className="font-medium">
                {formData.verify_img ? '✅ Verified' : '❌ Not Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Verify image (hidden when verify_img exists) */}
        {!formData.verify_img ? (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Verify Your Identity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload ID photo (PNG or JPG, ≤ 2MB)
                </label>

                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleVerifyFileChange}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                             file:rounded-md file:border-0 file:text-sm file:font-semibold
                             file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
                />

                {previewUrl && (
                  <div className="mt-4">
                    <img src={previewUrl} alt="Preview" className="max-h-48 rounded border" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setVerifyFile(null); setPreviewUrl(''); }}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={uploadVerifyImage}
                  disabled={!verifyFile || isUploading}
                  className={`px-6 py-2 rounded-md text-white transition-colors
                              ${!verifyFile || isUploading ? 'bg-red-300' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {isUploading ? 'Uploading…' : 'Upload & Verify'}
                </button>
              </div>

              <p className="text-xs text-gray-500">
                We’ll store your image securely and mark your account as verified.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <span className="font-medium text-green-800">Identity verified.</span>
          </div>
        )}

        {/* Change Password */}
        <form onSubmit={handleSubmit}>
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
                  placeholder="Enter new password (min 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          </div>

          {passwordData.newPassword && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Password Strength:</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      passwordData.newPassword.length < 8
                        ? 'w-1/3 bg-red-500'
                        : passwordData.newPassword.length < 12
                        ? 'w-2/3 bg-yellow-500'
                        : 'w-full bg-green-500'
                    }`}
                  />
                </div>
                <span className="text-sm font-medium">
                  {passwordData.newPassword.length < 8
                    ? 'Weak'
                    : passwordData.newPassword.length < 12
                    ? 'Medium'
                    : 'Strong'}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
              className="px-8 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button type="submit" className="px-8 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
              Update Password
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Security Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use a strong password with a mix of letters, numbers, and symbols</li>
            <li>• Don't reuse passwords across different sites</li>
            <li>• Change your password regularly</li>
            <li>• Never share your password with anyone</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
