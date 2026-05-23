import React, { Component } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log errors to service trackers (mocked offline)
    console.error('ErrorBoundary intercepted exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-brand-950 px-4 py-12 relative overflow-hidden transition-colors duration-300">
          {/* Background gradients */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

          <div className="w-full max-w-md relative z-10 text-center">
            <div className="glass-card p-8 rounded-3xl">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-5 shadow shadow-red-500/10">
                <ShieldAlert size={24} />
              </div>
              
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight mb-2">
                Workspace Exception Intercepted
              </h2>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-6">
                An unexpected component rendering boundary failure occurred. Don't worry, your productivity records are safely saved.
              </p>

              {/* Show error context in dev mode */}
              <div className="p-3 bg-slate-100 dark:bg-brand-800/40 rounded-xl text-left font-mono text-[10px] text-slate-500 dark:text-slate-400 overflow-x-auto max-h-24 mb-6 leading-normal border border-slate-200/50 dark:border-brand-700/30">
                {this.state.error ? this.state.error.toString() : 'Unknown render exception'}
              </div>

              <button
                onClick={this.handleReset}
                className="w-full glass-btn-primary py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-extrabold"
              >
                <RotateCcw size={14} />
                <span>Re-sync & Refresh Workspace</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
