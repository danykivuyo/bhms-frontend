import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Activity, ShieldCheck, Mail, User, Lock, ArrowLeft } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'engineer' | 'viewer'>('viewer');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/register', { username, email, password, role });
      setSuccess(response.data.message || "Registration successful! Redirecting...");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 scada-grid">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-700 shadow-2xl relative">
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3.5 bg-cyan-500/10 text-cyan-500 rounded-xl mb-4 border border-cyan-500/25">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create Portal ID</h2>
          <p className="text-xs uppercase font-mono text-cyan-500/80 tracking-widest mt-1">
            SHM Portal Access Setup
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-400 text-xs text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-400 text-xs text-center flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-mono text-slate-400 tracking-wider mb-1">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. jdoe"
                className="w-full bg-slate-950 border border-slate-700/60 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-mono text-slate-400 tracking-wider mb-1">
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jdoe@example.com"
                className="w-full bg-slate-950 border border-slate-700/60 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-mono text-slate-400 tracking-wider mb-1">
              Access Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-slate-950 border border-slate-700/60 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-mono text-slate-400 tracking-wider mb-1 font-bold">
              Gateway Role Access
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="viewer">Viewer (Read-only access)</option>
              <option value="engineer">Engineer (Configure & Resolve)</option>
              <option value="admin">Administrator (Full Control)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg py-2.5 font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Registering Access...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6 flex justify-center">
          <Link to="/login" className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
export default Register;
