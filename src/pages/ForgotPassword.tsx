import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Activity, ShieldAlert, KeyRound, ArrowLeft, ClipboardCopy, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetTokenReceived, setResetTokenReceived] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data.data && response.data.data.reset_token) {
        setResetTokenReceived(response.data.data.reset_token);
        setToken(response.data.data.reset_token); // auto populate
        setSuccess("Reset token generated! For demo convenience, copy the token below.");
      } else {
        setSuccess(response.data.message || "Reset request initiated.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to request reset token.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(response.data.message || "Password reset successfully! You can now log in.");
      setResetTokenReceived(null);
      setToken('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || "Password reset failed. Verify your token.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (resetTokenReceived) {
      navigator.clipboard.writeText(resetTokenReceived);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 scada-grid">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-700 shadow-2xl relative">
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3.5 bg-cyan-500/10 text-cyan-500 rounded-xl mb-4 border border-cyan-500/25">
            <KeyRound className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Reset Gateway</h2>
          <p className="text-xs uppercase font-mono text-cyan-500/80 tracking-widest mt-1">
            Access Recovery
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-400 text-xs text-center flex gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-400 text-xs text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Phase 1: Request Token Form */}
        {!resetTokenReceived ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              Enter your email address. In our sandbox environment, the system will output a copyable token instantly.
            </p>
            <div>
              <label className="block text-xs uppercase font-mono text-slate-400 tracking-wider mb-1">
                Portal Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="registered@bridgesense.ai"
                className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg py-2.5 font-semibold text-sm transition-all duration-150 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Request Reset Token'}
            </button>
          </form>
        ) : (
          /* Phase 2: Copy Token & Perform Password Reset */
          <div className="space-y-5">
            {/* Token display box */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-3">
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Copy Token:</span>
                <span className="text-xs font-mono text-cyan-400 font-bold truncate block">{resetTokenReceived}</span>
              </div>
              <button
                onClick={handleCopy}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors flex-shrink-0 flex items-center gap-1.5"
                title="Copy token to clipboard"
              >
                <ClipboardCopy className="w-4 h-4" />
                <span className="text-[10px] font-mono">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono text-slate-400 tracking-wider mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste reset token here"
                  className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-slate-400 tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2.5 font-semibold text-sm transition-all duration-150 shadow-lg disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>

              <button
                type="button"
                onClick={() => setResetTokenReceived(null)}
                className="w-full text-xs text-slate-500 hover:text-slate-400 hover:underline"
              >
                Cancel reset
              </button>
            </form>
          </div>
        )}

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
export default ForgotPassword;
