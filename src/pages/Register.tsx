import React, { useState } from 'react';
import { api } from '../services/api';
import { UserPlus, ShieldCheck, Mail, User, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const Register: React.FC = () => {
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
      setSuccess(`User "${username}" registered successfully as ${role}.`);
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('viewer');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors';
  const labelClass = 'block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1.5 font-bold';

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div className="border-b border-slate-200/30 dark:border-industrial-800/40 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Register New User</h2>
        <p className="text-xs font-mono text-slate-400 dark:text-cyan-500/80 uppercase tracking-wider mt-0.5">
          Admin Portal — Create User Accounts
        </p>
      </div>

      <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-6">
        <div className="flex items-center gap-3 border-b border-slate-200/30 dark:border-industrial-800/40 pb-4 mb-5">
          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">New User Account</h3>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Only administrators can create accounts
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-500 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-500 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Username *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. jdoe"
                  className={inputClass + ' pl-10'}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jdoe@example.com"
                  className={inputClass + ' pl-10'}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className={inputClass + ' pl-10'}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className={inputClass}
              >
                <option value="viewer">Viewer — Read-only access</option>
                <option value="engineer">Engineer — Configure & Resolve</option>
                <option value="admin">Administrator — Full Control</option>
              </select>
            </div>
          </div>

          {/* Role description */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { r: 'viewer',   color: 'slate',  desc: 'View dashboards, logs, alerts. Cannot modify anything.' },
              { r: 'engineer', color: 'cyan',   desc: 'Add/edit bridges & devices, resolve alerts, generate reports.' },
              { r: 'admin',    color: 'rose',   desc: 'Full access including settings, user management, and deletions.' },
            ].map(({ r, color, desc }) => (
              <div
                key={r}
                onClick={() => setRole(r as any)}
                className={`cursor-pointer p-3 rounded-lg border text-xs transition-all ${
                  role === r
                    ? `border-${color}-500/50 bg-${color}-500/10`
                    : 'border-slate-200 dark:border-industrial-800 hover:border-slate-300 dark:hover:border-industrial-700'
                }`}
              >
                <p className={`font-bold uppercase font-mono mb-1 ${role === r ? `text-${color}-500` : 'text-slate-500'}`}>{r}</p>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-all shadow-md shadow-cyan-500/10 disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Creating Account...' : 'Create User Account'}
            </button>
          </div>
        </form>
      </div>

      {/* Access Matrix Reference */}
      <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-5">
        <h4 className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 mb-3 tracking-wider">
          Role Access Matrix
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-industrial-800">
                <th className="text-left py-2 pr-4 font-mono text-slate-400 uppercase">Feature</th>
                <th className="text-center py-2 px-3 font-mono text-slate-400 uppercase">Viewer</th>
                <th className="text-center py-2 px-3 font-mono text-cyan-500 uppercase">Engineer</th>
                <th className="text-center py-2 px-3 font-mono text-rose-500 uppercase">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-industrial-850 text-slate-600 dark:text-slate-400">
              {[
                ['Dashboard & Charts',    '✅ View',    '✅ View',          '✅ View'],
                ['Bridges',               '✅ View',    '✅ Add / Edit',    '✅ Add / Edit / Delete'],
                ['IoT Devices',           '✅ View',    '✅ Add / Edit',    '✅ Add / Edit / Delete'],
                ['Historical Logs',       '✅ Export',  '✅ Export',        '✅ Export'],
                ['Alerts',                '✅ View',    '✅ View + Resolve','✅ Full'],
                ['PDF Reports',           '❌ No',      '✅ Generate',      '✅ Generate'],
                ['System Settings',       '❌ No',      '❌ No',            '✅ Full'],
                ['Register Users',        '❌ No',      '❌ No',            '✅ Full'],
              ].map(([feature, viewer, engineer, admin]) => (
                <tr key={feature}>
                  <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300">{feature}</td>
                  <td className="py-2 px-3 text-center">{viewer}</td>
                  <td className="py-2 px-3 text-center">{engineer}</td>
                  <td className="py-2 px-3 text-center">{admin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Register;
