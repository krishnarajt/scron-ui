import { useState, useEffect } from 'react';
import { notifications as notifApi } from '../lib/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Bell, Send, Mail, Loader2, Save } from 'lucide-react';

const NOTIFY_OPTIONS = [
  { value: 'failure_only', label: 'On failure only', desc: 'Notify only when a job fails' },
  { value: 'always', label: 'Always', desc: 'Notify on every execution' },
  { value: 'never', label: 'Never', desc: 'Disable all notifications' },
];

export default function Notifications() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local form state
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [notifyOn, setNotifyOn] = useState('failure_only');

  useEffect(() => {
    notifApi.get().then((data) => {
      setSettings(data);
      setTelegramEnabled(data.telegram_enabled || false);
      setTelegramChatId(data.telegram_chat_id || '');
      setEmailEnabled(data.email_enabled || false);
      setNotifyOn(data.notify_on || 'failure_only');
    }).catch((err) => {
      console.error('Failed to load notification settings', err);
      toast.error('Failed to load settings');
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await notifApi.update({
        telegram_enabled: telegramEnabled,
        telegram_chat_id: telegramChatId || null,
        email_enabled: emailEnabled,
        notify_on: notifyOn,
      });
      setSettings(updated);
      toast.success('Notification settings saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
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
          <span className="gradient-text">Notifications</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--txt-muted)' }}>
          Configure how you get notified about job executions
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-lg space-y-6">
        {/* Notification trigger */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell size={15} style={{ color: 'var(--accent)' }} />
            <h2 className="text-sm font-semibold">When to notify</h2>
          </div>
          <div className="space-y-2">
            {NOTIFY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setNotifyOn(opt.value)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all duration-200"
                style={{
                  background: notifyOn === opt.value ? 'var(--accent-glow)' : 'var(--surface-2)',
                  border: `1px solid ${notifyOn === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: notifyOn === opt.value ? 'var(--accent)' : 'var(--txt-dim)',
                  }}
                >
                  {notifyOn === opt.value && (
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: notifyOn === opt.value ? 'var(--accent)' : 'var(--txt)' }}>
                    {opt.label}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--txt-dim)' }}>{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Telegram */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Send size={15} style={{ color: '#0088cc' }} />
              <h2 className="text-sm font-semibold">Telegram</h2>
            </div>
            <button
              type="button"
              onClick={() => setTelegramEnabled(!telegramEnabled)}
              className="relative w-11 h-6 rounded-full transition-all duration-300"
              style={{
                background: telegramEnabled
                  ? 'linear-gradient(135deg, #0088cc, #0066aa)'
                  : 'var(--surface-4)',
              }}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-transform duration-300"
                style={{ transform: telegramEnabled ? 'translateX(22px)' : 'translateX(4px)' }}
              />
            </button>
          </div>
          {telegramEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden"
            >
              <label className="block text-xs font-medium mb-2 uppercase tracking-wider"
                     style={{ color: 'var(--txt-muted)' }}>
                Chat ID
              </label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="input-field"
                placeholder="Your Telegram chat ID"
              />
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--txt-dim)' }}>
                Message @userinfobot on Telegram to get your chat ID.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail size={15} style={{ color: 'var(--accent)' }} />
              <h2 className="text-sm font-semibold">Email</h2>
            </div>
            <button
              type="button"
              onClick={() => setEmailEnabled(!emailEnabled)}
              className="relative w-11 h-6 rounded-full transition-all duration-300"
              style={{
                background: emailEnabled
                  ? 'linear-gradient(135deg, var(--accent), var(--accent-dim))'
                  : 'var(--surface-4)',
              }}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-transform duration-300"
                style={{ transform: emailEnabled ? 'translateX(22px)' : 'translateX(4px)' }}
              />
            </button>
          </div>
          {emailEnabled && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs"
              style={{ color: 'var(--txt-dim)' }}
            >
              Notifications will be sent to the email address in your profile.
              Make sure you've set it in the Profile page.
            </motion.p>
          )}
        </motion.div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
