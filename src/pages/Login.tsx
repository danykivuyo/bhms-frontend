import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Activity, ShieldAlert, Key, User, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(usernameOrEmail, password);
      navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        "Failed to sign in. Please verify your credentials or server connection."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper shortcut for developers/testers to quickly populate login fields
  const handleQuickLogin = (role: 'admin' | 'engineer' | 'viewer') => {
    setUsernameOrEmail(role);
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 scada-grid">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl" />

        {/* Branding header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3.5 bg-cyan-500/10 text-cyan-500 rounded-xl mb-4 border border-cyan-500/25 animate-pulse-cyan">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
            BridgeSense <span className="text-cyan-400">AI</span>
          </h2>
          <p className="text-xs uppercase font-mono text-cyan-500/80 tracking-widest mt-1 font-semibold">
            SHM Portal Authenticator
          </p>
        </div>

        {/* Alert feedback */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-lg flex gap-3 text-rose-400 text-xs">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-mono text-slate-400 tracking-wider mb-1.5 font-bold">
              Username or Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="e.g. admin"
                className="w-full bg-slate-950 border border-slate-700/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs uppercase font-mono text-slate-400 tracking-wider font-bold">
                Access Password
              </label>
              <Link 
                to="/forgot-password" 
                className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg py-2.5 font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Verifying Credentials...' : 'Sign In System'}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Demo profiles quick-select */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[10px] font-mono uppercase text-slate-500 text-center tracking-widest font-bold mb-3">
            Demo Portal Gateways
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(['admin', 'engineer', 'viewer'] as const).map((role) => (
              <button
                key={role}
                onClick={() => handleQuickLogin(role)}
                type="button"
                className="px-2 py-1.5 bg-slate-800/40 hover:bg-slate-800 text-[10px] font-mono text-cyan-400 border border-slate-700/50 hover:border-cyan-500/40 rounded text-center transition-colors uppercase font-bold"
              >
                {role}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-center text-slate-500 mt-2 font-mono">
            Password: <span className="text-slate-400 font-bold">admin123</span>
          </p>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 hover:underline">
              Register here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
export default Login;
