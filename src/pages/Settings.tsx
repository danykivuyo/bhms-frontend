import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  Settings as SettingsIcon,
  Save,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Building2,
  Sliders,
  Activity,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SettingsMap {
  [key: string]: string;
}

export const Settings: React.FC = () => {
  const { user } = useAuth();

  // Settings state
  const [companyName, setCompanyName] = useState('');
  const [theme, setTheme] = useState('dark');
  const [units, setUnits] = useState('metric');
  const [samplingInterval, setSamplingInterval] = useState('5');

  // Thresholds
  const [strainWarn, setStrainWarn] = useState('0.50');
  const [strainCrit, setStrainCrit] = useState('1.00');
  const [tiltWarn, setTiltWarn] = useState('1.00');
  const [tiltCrit, setTiltCrit] = useState('2.00');
  const [vibWarn, setVibWarn] = useState('0.10');
  const [vibCrit, setVibCrit] = useState('0.25');

  // Change password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Load settings
  const { data: settings } = useQuery<SettingsMap>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name || '');
      setTheme(settings.theme || 'dark');
      setUnits(settings.units || 'metric');
      setSamplingInterval(settings.sampling_interval || '5');
      setStrainWarn(settings.strain_warning_threshold || '0.50');
      setStrainCrit(settings.strain_critical_threshold || '1.00');
      setTiltWarn(settings.tilt_warning_threshold || '1.00');
      setTiltCrit(settings.tilt_critical_threshold || '2.00');
      setVibWarn(settings.vibration_warning_threshold || '0.10');
      setVibCrit(settings.vibration_critical_threshold || '0.25');
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: SettingsMap) => api.post('/settings/update', payload),
    onSuccess: () => {
      setSettingsSuccess('System settings updated successfully.');
      setSettingsError(null);
      setTimeout(() => setSettingsSuccess(null), 4000);
    },
    onError: (err: any) => {
      setSettingsError(err.response?.data?.message || 'Failed to update settings.');
      setSettingsSuccess(null);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: any) => api.post('/auth/change-password', payload),
    onSuccess: () => {
      setPwSuccess('Password changed successfully.');
      setPwError(null);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccess(null), 4000);
    },
    onError: (err: any) => {
      setPwError(err.response?.data?.message || 'Failed to change password.');
      setPwSuccess(null);
    },
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      company_name: companyName,
      theme,
      units,
      sampling_interval: samplingInterval,
      strain_warning_threshold: strainWarn,
      strain_critical_threshold: strainCrit,
      tilt_warning_threshold: tiltWarn,
      tilt_critical_threshold: tiltCrit,
      vibration_warning_threshold: vibWarn,
      vibration_critical_threshold: vibCrit,
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    changePasswordMutation.mutate({ oldPassword, newPassword });
  };

  const inputClass =
    'w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors';

  const labelClass = 'block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1.5 font-bold';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200/30 dark:border-industrial-800/40 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">System Settings</h2>
        <p className="text-xs font-mono text-slate-400 dark:text-cyan-500/80 uppercase tracking-wider mt-0.5">
          Platform Configuration, Thresholds & Security
        </p>
      </div>

      {/* System Configuration Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">

        {/* Company Info */}
        <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-200/30 dark:border-industrial-800/40 pb-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Company Information</h3>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Branding & Identity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. BridgeSense Solutions Ltd."
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Sampling Interval (sec)</label>
              <input
                type="number"
                min="1"
                max="3600"
                value={samplingInterval}
                onChange={(e) => setSamplingInterval(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Default Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className={inputClass}
              >
                <option value="dark">Dark Mode (SCADA)</option>
                <option value="light">Light Mode</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Measurement Units</label>
              <select
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className={inputClass}
              >
                <option value="metric">Metric (mm, °, g)</option>
                <option value="imperial">Imperial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sensor Thresholds */}
        <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-200/30 dark:border-industrial-800/40 pb-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Alert Thresholds</h3>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Warning & Critical Limits for Automatic Alert Generation
              </p>
            </div>
          </div>

          {/* Strain */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Strain (mm)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <span className="text-amber-500">⚠</span> Warning Threshold
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={strainWarn}
                  onChange={(e) => setStrainWarn(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <span className="text-rose-500">🔴</span> Critical Threshold
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={strainCrit}
                  onChange={(e) => setStrainCrit(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Tilt */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Tilt (degrees)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <span className="text-amber-500">⚠</span> Warning Threshold
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tiltWarn}
                  onChange={(e) => setTiltWarn(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <span className="text-rose-500">🔴</span> Critical Threshold
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tiltCrit}
                  onChange={(e) => setTiltCrit(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Vibration */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Vibration (g)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <span className="text-amber-500">⚠</span> Warning Threshold
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={vibWarn}
                  onChange={(e) => setVibWarn(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <span className="text-rose-500">🔴</span> Critical Threshold
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={vibCrit}
                  onChange={(e) => setVibCrit(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {settingsSuccess && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-500 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {settingsSuccess}
          </div>
        )}
        {settingsError && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-500 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {settingsError}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-all shadow-md shadow-cyan-500/10 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200/30 dark:border-industrial-800/40 pb-3">
          <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Change Password</h3>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Account: <span className="text-cyan-400">{user?.username}</span>
            </p>
          </div>
        </div>

        {pwError && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-500 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {pwError}
          </div>
        )}
        {pwSuccess && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-500 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {pwSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Current Password</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Current password"
                className={inputClass + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className={inputClass + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-all shadow-md shadow-rose-500/10 disabled:opacity-60"
          >
            <Lock className="w-4 h-4" />
            {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>

      {/* API Info Card */}
      <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-3 border-b border-slate-200/30 dark:border-industrial-800/40 pb-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
            <SettingsIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">IoT Device API Endpoint</h3>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              HTTP POST for ESP32 / MQTT Bridge
            </p>
          </div>
        </div>

        <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs overflow-x-auto">
          <p className="text-emerald-400 mb-2">POST /api/readings/store</p>
          <pre className="text-slate-300 whitespace-pre-wrap">{`{
  "device_id": "BR001",
  "timestamp": "2026-07-03T15:00:00Z",
  "strain": 0.32,
  "tilt": 1.25,
  "vibration": 0.08,
  "battery_level": 98.5,
  "signal_strength": -65
}`}</pre>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          No authentication required for IoT device data ingestion. Devices must be pre-registered in the Devices panel.
        </p>
      </div>
    </div>
  );
};

export default Settings;
