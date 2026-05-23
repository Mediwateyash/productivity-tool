import React, { createContext, useState, useContext, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />,
          classes: 'border-emerald-500/20 bg-emerald-500/5 text-slate-800 dark:text-slate-100',
        };
      case 'error':
        return {
          icon: <AlertCircle size={16} className="text-rose-500 shrink-0" />,
          classes: 'border-rose-500/20 bg-rose-500/5 text-slate-800 dark:text-slate-100',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
          classes: 'border-amber-500/20 bg-amber-500/5 text-slate-800 dark:text-slate-100',
        };
      case 'info':
      default:
        return {
          icon: <Info size={16} className="text-blue-500 shrink-0" />,
          classes: 'border-blue-500/20 bg-blue-500/5 text-slate-800 dark:text-slate-100',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toasts Portal Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const { icon, classes } = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              className={`
                pointer-events-auto flex items-start gap-3 p-3 px-4 rounded-xl border backdrop-blur-md shadow-lg shadow-black/5 transition-all duration-300 transform translate-y-0 opacity-100 animate-slideIn
                ${classes}
              `}
            >
              {icon}
              <p className="text-xs font-semibold leading-relaxed flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
