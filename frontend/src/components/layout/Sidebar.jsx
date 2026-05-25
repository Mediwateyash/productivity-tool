import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  CalendarDays, 
  Calendar, 
  Lightbulb, 
  Award, 
  Settings as SettingsIcon, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Sparkles,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';

export const Sidebar = () => {
  const { user, logout, isDemoMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Daily Tasks', path: '/tasks', icon: CheckSquare },
    { name: '60-Day Streak', path: '/tracker', icon: CalendarDays },
    { name: 'Weekly Planner', path: '/planner', icon: Calendar },
    { name: 'Ideas Dump', path: '/ideas', icon: Lightbulb },
    { name: 'Achievements', path: '/achievements', icon: Award },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden w-full h-16 bg-white dark:bg-brand-900/90 backdrop-blur-md border-b border-slate-200/50 dark:border-brand-800/50 px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Productivity Logo" className="w-8 h-8 object-contain" />
          <span className="font-extrabold text-slate-800 dark:text-white font-sans text-lg tracking-tight">
            Productivity
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-brand-800 dark:hover:bg-brand-700 text-slate-600 dark:text-slate-200 transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Main Sidebar Wrapper */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-brand-900/95 border-r border-slate-200/50 dark:border-brand-800/40 p-5 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:fixed lg:h-screen
      `}>
        <div>
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <img src="/logo.png" alt="Productivity Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-extrabold text-slate-950 dark:text-white font-sans leading-none text-lg tracking-tight">
                Productivity
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">
                EXECUTE SMARTER
              </p>
            </div>
          </div>

          {/* User Gamification Card */}
          {user && (
            <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-brand-800/40 border border-slate-150 dark:border-brand-700/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-brand-700/50 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <UserIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{user.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded">
                    Lvl {user.level || 1}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {user.xp || 0} XP
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Nav Navigation Lists */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brand-800/50 hover:text-slate-900 dark:hover:text-white'}
                  `}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions (Theme & Logout) */}
        <div className="space-y-3 pt-4 border-t border-slate-200/50 dark:border-brand-800/40">
          {isDemoMode && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs">
              <Sparkles size={14} className="shrink-0 animate-pulse" />
              <span className="font-medium truncate">Demo Mode Active</span>
            </div>
          )}
          
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brand-800/50 transition-all duration-150"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-150"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Sidebar background overlay for mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
        />
      )}
    </>
  );
};
