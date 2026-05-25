import React, { useState } from 'react';
import { Mail, Sparkles } from 'lucide-react';

export const Footer = () => {
  const [showContact, setShowContact] = useState(false);

  return (
    <footer className="mt-16 pt-6 border-t border-slate-200/50 dark:border-brand-800/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs relative z-10">
      <div className="text-slate-400 dark:text-slate-500 font-medium">
        Designed & Developed by <span className="font-extrabold text-slate-650 dark:text-slate-300">Diwate Yash</span>
      </div>

      <div 
        className="relative"
        onMouseEnter={() => setShowContact(true)}
        onMouseLeave={() => setShowContact(false)}
      >
        <button className="px-3.5 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white dark:text-blue-400 dark:hover:text-white font-extrabold uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-1.5 active:scale-95 shadow-sm">
          <Sparkles size={12} />
          <span>Contact</span>
        </button>

        {/* Hover Dropdown Menu */}
        <div className={`
          absolute bottom-full right-0 mb-3 bg-white dark:bg-brand-900 border border-slate-200/50 dark:border-brand-800/80 rounded-2xl p-3 shadow-xl shadow-blue-500/5 backdrop-blur-md min-w-[200px] flex flex-col gap-1.5 transition-all duration-200 z-50 origin-bottom-right
          ${showContact ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}
        `}>
          <div className="px-2 pb-1.5 border-b border-slate-200/50 dark:border-brand-800/30 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Connect With Me
          </div>

          <a 
            href="https://www.linkedin.com/in/diwateyash2004/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-blue-600/10 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 rounded-xl transition-colors font-semibold"
          >
            <svg className="w-3.5 h-3.5 text-[#0a66c2] fill-current" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            <span>LinkedIn</span>
          </a>

          <a 
            href="https://github.com/Mediwateyash" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-brand-800/60 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl transition-colors font-semibold"
          >
            <svg className="w-3.5 h-3.5 text-slate-800 dark:text-white fill-current" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>GitHub</span>
          </a>

          <a 
            href="mailto:Diwateyash2004@gmail.com"
            className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-red-500/10 text-slate-600 hover:text-red-500 dark:text-slate-300 dark:hover:text-red-400 rounded-xl transition-colors font-semibold"
          >
            <Mail size={14} className="text-red-500" />
            <span>Gmail</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
