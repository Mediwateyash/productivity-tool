import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { useToast } from '../../store/ToastContext';
import { Settings as SettingsIcon, User, Moon, Sun, ShieldCheck, Download, Trash, Mail } from 'lucide-react';

export const Settings = () => {
  const { user, isDemoMode, logout, updateProfile, apiFetch } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [emailEnabled, setEmailEnabled] = useState(user?.emailPreferences?.emailNotificationsEnabled ?? true);
  const [reminderTiming, setReminderTiming] = useState(user?.emailPreferences?.reminderTiming ?? 30);
  const [digestFreq, setDigestFreq] = useState(user?.emailPreferences?.digestFrequency ?? 'daily');
  const [prefReminders, setPrefReminders] = useState(user?.emailPreferences?.preferenceReminders ?? true);
  const [prefDigest, setPrefDigest] = useState(user?.emailPreferences?.preferenceDigest ?? true);
  const [prefWeekly, setPrefWeekly] = useState(user?.emailPreferences?.preferenceWeeklyReport ?? true);
  
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (user?.emailPreferences) {
      setEmailEnabled(user.emailPreferences.emailNotificationsEnabled ?? true);
      setReminderTiming(user.emailPreferences.reminderTiming ?? 30);
      setDigestFreq(user.emailPreferences.digestFrequency ?? 'daily');
      setPrefReminders(user.emailPreferences.preferenceReminders ?? true);
      setPrefDigest(user.emailPreferences.preferenceDigest ?? true);
      setPrefWeekly(user.emailPreferences.preferenceWeeklyReport ?? true);
    }
  }, [user]);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedPrefs = {
        emailNotificationsEnabled: emailEnabled,
        reminderTiming: parseInt(reminderTiming),
        digestFrequency: digestFreq,
        preferenceReminders: prefReminders,
        preferenceDigest: prefDigest,
        preferenceWeeklyReport: prefWeekly
      };

      await updateProfile({ emailPreferences: updatedPrefs });
      showToast('📬 Notification preferences successfully synchronized!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save preferences.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (isDemoMode) {
      showToast('⚠️ Demo sandbox mode: Email will be recorded in offline logs.', 'info');
    }
    setSendingTest(true);
    try {
      const res = await apiFetch('/auth/test-email', { method: 'POST' });
      if (res && res.success) {
        showToast(res.mock ? '✨ Setup Confirmed! (Mock log recorded offline)' : '🚀 Setup Confirmed! Check your Gmail Inbox.', 'success');
      } else {
        showToast('Email was blocked or failed to send.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('SMTP Setup connection failed. Add EMAIL_USER/EMAIL_PASS to .env', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">System Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Manage user profile settings, customize application themes, and control backup folders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Preference cards (Col span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: User details */}
          <div className="glass-card">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
              <User size={18} className="text-blue-500" />
              <span>User Profile</span>
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Full Name</span>
                  <input
                    type="text"
                    disabled
                    value={user?.name || 'Developer'}
                    className="glass-input cursor-not-allowed opacity-75"
                  />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Email Address</span>
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'name@company.com'}
                    className="glass-input cursor-not-allowed opacity-75"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Themes & Personalization */}
          <div className="glass-card">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
              {theme === 'dark' ? <Moon size={18} className="text-blue-500" /> : <Sun size={18} className="text-blue-500" />}
              <span>Aesthetics & Theme</span>
            </h3>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-brand-800/40 border border-slate-150 dark:border-brand-700/20">
              <div>
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Light / Dark Switcher</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Toggles document CSS style layers and maps background palettes.</p>
              </div>
              <button 
                onClick={toggleTheme}
                className="glass-btn-secondary px-4 py-2 text-xs flex items-center gap-1.5 font-bold shadow border border-slate-300 dark:border-brand-700"
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                <span>Active: {theme === 'dark' ? 'Dark' : 'Light'}</span>
              </button>
            </div>
          </div>

          {/* Section 3: Email & Notification Preferences */}
          <div className="glass-card">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
              <Mail size={18} className="text-blue-500" />
              <span>Email Reminders & Digest Preferences</span>
            </h3>

            <form onSubmit={handleSavePreferences} className="space-y-6">
              
              {/* Enable Master Notifications Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-brand-850/40 border border-slate-150 dark:border-brand-700/20">
                <div>
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Email Notifications Master Status</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Activate Nodemailer background triggers and automated dispatch loops.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailEnabled} 
                    onChange={(e) => setEmailEnabled(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-brand-800 rounded-full peer peer-focus:ring-1 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {emailEnabled && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Slider Timing Section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deadline Reminder Lead Time</span>
                      <span className="text-xs font-extrabold text-blue-500 dark:text-blue-400 font-mono">{reminderTiming} minutes before due</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="120" 
                      step="5" 
                      value={reminderTiming} 
                      onChange={(e) => setReminderTiming(e.target.value)}
                      className="w-full h-1.5 bg-slate-200 dark:bg-brand-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-405 dark:text-slate-400 font-medium font-mono px-1">
                      <span>10m</span>
                      <span>30m</span>
                      <span>60m (1h)</span>
                      <span>120m (2h)</span>
                    </div>
                  </div>

                  {/* Toggle sub-preferences checkboxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    
                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-150 dark:border-brand-800/40 bg-slate-50/50 dark:bg-brand-900/10 cursor-pointer hover:border-blue-500/50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={prefReminders} 
                        onChange={(e) => setPrefReminders(e.target.checked)}
                        className="rounded border-slate-350 dark:border-brand-700 bg-white/70 dark:bg-brand-900/40 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Task Reminders</span>
                        <span className="text-[10px] text-slate-400 font-medium">Receive warning alerts prior to deadline milestones.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-150 dark:border-brand-800/40 bg-slate-50/50 dark:bg-brand-900/10 cursor-pointer hover:border-blue-500/50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={prefDigest} 
                        onChange={(e) => setPrefDigest(e.target.checked)}
                        className="rounded border-slate-350 dark:border-brand-700 bg-white/70 dark:bg-brand-900/40 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Daily Digest Summary</span>
                        <span className="text-[10px] text-slate-400 font-medium">Daily 7 PM score summaries & tomorrow focus items.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-150 dark:border-brand-800/40 bg-slate-50/50 dark:bg-brand-900/10 cursor-pointer hover:border-blue-500/50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={prefWeekly} 
                        onChange={(e) => setPrefWeekly(e.target.checked)}
                        className="rounded border-slate-350 dark:border-brand-700 bg-white/70 dark:bg-brand-900/40 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Weekly Analytics Report</span>
                        <span className="text-[10px] text-slate-400 font-medium">Weekly Mondays 8 AM consistency charts & AI tips.</span>
                      </div>
                    </label>

                    <div className="p-3 rounded-xl border border-slate-150 dark:border-brand-800/40 bg-slate-50/50 dark:bg-brand-900/10 flex flex-col justify-center">
                      <span className="text-[10px] font-extrabold text-blue-500 dark:text-blue-400 uppercase tracking-widest block font-mono">Verify Active Server</span>
                      <button 
                        type="button" 
                        disabled={sendingTest}
                        onClick={handleSendTestEmail}
                        className="mt-1.5 glass-btn-secondary py-1 px-3 text-[10px] font-extrabold uppercase shrink-0 flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50 border border-slate-300 dark:border-brand-700"
                      >
                        <span>{sendingTest ? 'Sending Test...' : 'Send Test Configuration Email'}</span>
                      </button>
                    </div>

                  </div>

                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-200/50 dark:border-brand-800/30 pt-4">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="glass-btn-primary px-6 py-2.5 text-xs font-bold uppercase flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <span>{saving ? 'Syncing Preferences...' : 'Sync Email Preferences'}</span>
                </button>
              </div>

            </form>
          </div>

        </div>

        {/* Right Column: Database Backup panel */}
        <div className="space-y-6">
          <div className="glass-card">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span>Workspace System</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium mb-4">
              Export database collection logs to standard JSON files. Restoring snapshots imports tasks instantly.
            </p>
            <button className="w-full glass-btn-secondary py-2.5 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-brand-700">
              <Download size={14} />
              <span>Export Workspace JSON</span>
            </button>
          </div>

          {isDemoMode && (
            <div className="glass-card bg-yellow-500/5 border border-yellow-500/20">
              <h4 className="font-bold text-sm text-yellow-600 dark:text-yellow-400 mb-2">Sandbox Storage Mode</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
                You are currently working offline using local storage database caches. Registering an online account saves data securely.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default Settings;
