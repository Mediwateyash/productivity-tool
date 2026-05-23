import React from 'react';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { Settings as SettingsIcon, User, Moon, Sun, ShieldCheck, Download, Trash } from 'lucide-react';

export const Settings = () => {
  const { user, isDemoMode, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
