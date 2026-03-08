import { useState, useEffect } from 'react';
import { profile as profileApi } from '../lib/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { User, Mail, Save, Loader2 } from 'lucide-react';

export default function Profile() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profileApi.get().then((data) => {
      setDisplayName(data.display_name || '');
      setEmail(data.email || '');
      setUsername(data.username || '');
    }).catch((err) => {
      console.error('Failed to load profile', err);
      toast.error('Failed to load profile');
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await profileApi.update({ display_name: displayName, email: email || null });
      setDisplayName(updated.display_name || '');
      setEmail(updated.email || '');
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="gradient-text">Profile</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--txt-muted)' }}>
          Manage your account details
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg rounded-2xl p-6"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
      >
        {/* Username — read only */}
        <div className="mb-5">
          <label className="block text-xs font-medium mb-2 uppercase tracking-wider"
                 style={{ color: 'var(--txt-muted)' }}>
            <span className="flex items-center gap-1.5"><User size={12} /> Username</span>
          </label>
          <input
            type="text"
            value={username}
            disabled
            className="input-field opacity-60 cursor-not-allowed"
          />
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Display name */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wider"
                   style={{ color: 'var(--txt-muted)' }}>
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field"
              placeholder="Your display name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wider"
                   style={{ color: 'var(--txt-muted)' }}>
              <span className="flex items-center gap-1.5"><Mail size={12} /> Email</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="Required for email notifications"
            />
            <p className="text-[11px] mt-1.5" style={{ color: 'var(--txt-dim)' }}>
              Set your email here to enable email notifications.
            </p>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
