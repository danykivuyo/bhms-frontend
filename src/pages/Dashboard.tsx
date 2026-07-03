import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Cpu, 
  Database, 
  AlertOctagon, 
  Calendar, 
  Layers, 
  TrendingUp, 
  Play, 
  Pause,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface Stats {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  active_alerts: number;
  total_readings: number;
  total_bridges: number;
  database_size_mb: number;
}

interface Bridge {
  id: number;
  bridge_name: string;
  bridge_code: string;
}

interface Device {
  id: number;
  device_id: string;
  device_name: string;
  bridge_id: number;
  status: 'online' | 'offline';
}

interface Reading {
  id: number;
  timestamp: string;
  strain: number;
  tilt: number;
  vibration: number;
  battery_level: number;
  signal_strength: number;
}

interface Thresholds {
  strain_warning_threshold: number;
  strain_critical_threshold: number;
  tilt_warning_threshold: number;
  tilt_critical_threshold: number;
  vibration_warning_threshold: number;
  vibration_critical_threshold: number;
}

export const Dashboard: React.FC = () => {
  // Filter and Polling States
  const [selectedBridge, setSelectedBridge] = useState<string>('1'); // Default to GGB (Bridge 1)
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [liveMode, setLiveMode] = useState<boolean>(true);
  const [limit, setLimit] = useState<number>(50);

  // Lists
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  // Thresholds loaded from settings
  const [thresholds, setThresholds] = useState<Thresholds>({
    strain_warning_threshold: 0.50,
    strain_critical_threshold: 1.00,
    tilt_warning_threshold: 1.00,
    tilt_critical_threshold: 2.00,
    vibration_warning_threshold: 0.10,
    vibration_critical_threshold: 0.25,
  });

  // Fetch initial list of bridges and devices
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const resBridges = await api.get('/bridges');
        if (resBridges.data.status === 'success') {
          setBridges(resBridges.data.data);
        }
        const resDevices = await api.get('/devices');
        if (resDevices.data.status === 'success') {
          setDevices(resDevices.data.data);
        }
        const resSettings = await api.get('/settings');
        if (resSettings.data.status === 'success') {
          const s = resSettings.data.data;
          setThresholds({
            strain_warning_threshold: parseFloat(s.strain_warning_threshold || '0.50'),
            strain_critical_threshold: parseFloat(s.strain_critical_threshold || '1.00'),
            tilt_warning_threshold: parseFloat(s.tilt_warning_threshold || '1.00'),
            tilt_critical_threshold: parseFloat(s.tilt_critical_threshold || '2.00'),
            vibration_warning_threshold: parseFloat(s.vibration_warning_threshold || '0.10'),
            vibration_critical_threshold: parseFloat(s.vibration_critical_threshold || '0.25'),
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard structure.", err);
      }
    };
    fetchMeta();
  }, []);

  // Filter device list based on selected bridge
  const filteredDevices = devices.filter(d => d.bridge_id === parseInt(selectedBridge));

  // Query: Dashboard statistics
  const { data: stats, refetch: refetchStats } = useQuery<Stats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/stats');
      return res.data.data;
    },
    refetchInterval: liveMode ? 5000 : false,
  });

  // Query: Time-series readings for trends and gauges
  const { data: readings = [], refetch: refetchReadings } = useQuery<Reading[]>({
    queryKey: ['dashboard-trends', selectedBridge, selectedDevice, limit],
    queryFn: async () => {
      const params: any = { limit };
      if (selectedBridge && selectedBridge !== 'all') {
        params.bridge_id = selectedBridge;
      }
      if (selectedDevice && selectedDevice !== 'all') {
        params.device_id = selectedDevice;
      }
      const res = await api.get('/readings/trends', { params });
      // MySQL returns DECIMAL columns as strings — coerce to numbers
      return (res.data.data as any[]).map((r) => ({
        ...r,
        strain: parseFloat(r.strain),
        tilt: parseFloat(r.tilt),
        vibration: parseFloat(r.vibration),
        battery_level: parseFloat(r.battery_level),
        signal_strength: parseInt(r.signal_strength),
      }));
    },
    refetchInterval: liveMode ? 5000 : false,
  });

  // Get current active metrics (most recent reading) — always numbers
  const lastRaw = readings[readings.length - 1];
  const currentReading = {
    strain: parseFloat(lastRaw?.strain as any) || 0,
    tilt: parseFloat(lastRaw?.tilt as any) || 0,
    vibration: parseFloat(lastRaw?.vibration as any) || 0,
    battery_level: parseFloat(lastRaw?.battery_level as any) || 0,
    signal_strength: parseInt(lastRaw?.signal_strength as any) || 0,
    timestamp: lastRaw?.timestamp ?? new Date().toISOString(),
  };

  // Helper: circular SVG indicator calculations
  const renderCircularGauge = (
    label: string, 
    value: number, 
    units: string, 
    warningThresh: number, 
    criticalThresh: number,
    maxValue: number,
    pulseClass: string
  ) => {
    // Map value to percent of maximum expected gauge scale
    const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Determine status color based on thresholds
    let colorClass = 'text-cyan-500 stroke-cyan-500';
    let ringBg = 'bg-cyan-500/10 dark:bg-cyan-500/20';
    let labelBg = 'bg-cyan-500/20 dark:bg-cyan-500/30 text-cyan-600 dark:text-cyan-400';
    let alertLabel = 'NORMAL';

    if (value >= criticalThresh) {
      colorClass = 'text-rose-500 stroke-rose-500 animate-pulse';
      ringBg = 'bg-rose-500/15 dark:bg-rose-500/25';
      labelBg = 'bg-rose-500/25 dark:bg-rose-500/35 text-rose-600 dark:text-rose-400 font-extrabold';
      alertLabel = 'CRITICAL ALARM';
    } else if (value >= warningThresh) {
      colorClass = 'text-amber-500 stroke-amber-500';
      ringBg = 'bg-amber-500/15 dark:bg-amber-500/25';
      labelBg = 'bg-amber-500/25 dark:bg-amber-500/35 text-amber-600 dark:text-amber-400';
      alertLabel = 'WARNING';
    }

    return (
      <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-5 flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-150">
        
        {/* Flashing grid background on warning/critical */}
        {value >= warningThresh && (
          <div className={`absolute inset-0 z-0 opacity-[0.04] ${value >= criticalThresh ? 'bg-rose-500 animate-blink' : 'bg-amber-500 animate-pulse'}`} />
        )}

        <div className="z-10 flex items-center justify-between w-full border-b border-slate-200/30 dark:border-slate-800/40 pb-2">
          <span className="text-xs uppercase font-mono tracking-wider font-bold text-slate-500 dark:text-slate-400">
            {label} Monitor
          </span>
          <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded font-extrabold ${labelBg} ${value >= criticalThresh ? 'animate-blink' : ''}`}>
            {alertLabel}
          </span>
        </div>

        {/* Circular SVG Gauge */}
        <div className="my-5 relative z-10 flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="stroke-slate-200 dark:stroke-industrial-800"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Progress Circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              className={`transition-all duration-500 ${colorClass}`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-800 dark:text-slate-100 leading-none">
              {value.toFixed(2)}
            </span>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1 uppercase">
              {units}
            </span>
          </div>
        </div>

        {/* Diagnostic details */}
        <div className="w-full z-10 grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/30 dark:border-slate-800/40">
          <div className="text-left bg-slate-100/40 dark:bg-industrial-950/20 p-2 rounded">
            <span className="text-[9px] font-mono text-slate-400 block">WARN LIMIT:</span>
            <span className="text-xs font-mono font-bold text-amber-500">{warningThresh.toFixed(2)} {units}</span>
          </div>
          <div className="text-left bg-slate-100/40 dark:bg-industrial-950/20 p-2 rounded">
            <span className="text-[9px] font-mono text-slate-400 block">CRIT LIMIT:</span>
            <span className="text-xs font-mono font-bold text-rose-500">{criticalThresh.toFixed(2)} {units}</span>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Top Bar: Header and Real-time controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between border-b border-slate-200/30 dark:border-industrial-800/40 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Industrial SCADA Monitor
          </h2>
          <p className="text-xs font-mono text-slate-400 dark:text-cyan-500/80 uppercase tracking-wider mt-0.5">
            Real-Time Telemetry Link & Actuators Console
          </p>
        </div>

        {/* Filters Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Bridge Selector */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <select
              value={selectedBridge}
              onChange={(e) => {
                setSelectedBridge(e.target.value);
                setSelectedDevice('all'); // reset device filter on bridge change
              }}
              className="bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 text-sm rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {bridges.map(b => (
                <option key={b.id} value={b.id}>{b.bridge_name} ({b.bridge_code})</option>
              ))}
            </select>
          </div>

          {/* Device Selector */}
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 text-sm rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Devices</option>
              {filteredDevices.map(d => (
                <option key={d.id} value={d.device_id}>{d.device_name} ({d.device_id})</option>
              ))}
            </select>
          </div>

          {/* Live Updating Link Button */}
          <button
            onClick={() => setLiveMode(!liveMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border duration-150 ${
              liveMode
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500 animate-pulse-cyan'
                : 'bg-slate-200 dark:bg-industrial-800 border-transparent text-slate-500 dark:text-slate-400'
            }`}
          >
            {liveMode ? (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>LIVE LINK ON</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>LINK SUSPENDED</span>
              </>
            )}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => {
              refetchStats();
              refetchReadings();
            }}
            className="p-2 bg-slate-100 dark:bg-industrial-800 border border-slate-200 dark:border-industrial-850 hover:bg-slate-200 dark:hover:bg-industrial-700 text-slate-500 dark:text-slate-300 rounded-lg transition-colors"
            title="Manual refresh telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. SCADA Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Total Devices */}
        <div className="glass-panel p-4 border border-slate-200/40 dark:border-industrial-800/80 rounded-xl">
          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Total Devices</span>
          <p className="text-xl font-bold font-mono text-slate-700 dark:text-slate-200 mt-1">{stats?.total_devices ?? '0'}</p>
        </div>

        {/* Online Devices */}
        <div className="glass-panel p-4 border border-slate-200/40 dark:border-industrial-800/80 rounded-xl border-l-4 border-l-emerald-500">
          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Online</span>
          <p className="text-xl font-bold font-mono text-emerald-500 mt-1">{stats?.online_devices ?? '0'}</p>
        </div>

        {/* Offline Devices */}
        <div className="glass-panel p-4 border border-slate-200/40 dark:border-industrial-800/80 rounded-xl border-l-4 border-l-slate-400">
          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Offline</span>
          <p className="text-xl font-bold font-mono text-slate-400 dark:text-slate-500 mt-1">{stats?.offline_devices ?? '0'}</p>
        </div>

        {/* Active Alarms */}
        <div className={`glass-panel p-4 border rounded-xl border-l-4 transition-colors ${
          stats && stats.active_alerts > 0 
            ? 'bg-rose-500/10 border-rose-500/30 border-l-rose-500 animate-pulse-rose' 
            : 'border-slate-200/40 dark:border-industrial-800/80 border-l-cyan-500'
        }`}>
          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Alarms Buffer</span>
          <p className={`text-xl font-bold font-mono mt-1 ${stats && stats.active_alerts > 0 ? 'text-rose-500 font-black' : 'text-slate-700 dark:text-slate-200'}`}>
            {stats?.active_alerts ?? '0'}
          </p>
        </div>

        {/* Total Sensor Readings */}
        <div className="glass-panel p-4 border border-slate-200/40 dark:border-industrial-800/80 rounded-xl">
          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Readings Log</span>
          <p className="text-xl font-bold font-mono text-slate-700 dark:text-slate-200 mt-1">{stats?.total_readings ?? '0'}</p>
        </div>

        {/* Database Size */}
        <div className="glass-panel p-4 border border-slate-200/40 dark:border-industrial-800/80 rounded-xl">
          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block font-bold">DB Size</span>
          <p className="text-xl font-bold font-mono text-slate-700 dark:text-slate-200 mt-1">{(stats?.database_size_mb ?? 0.05).toFixed(2)} MB</p>
        </div>

        {/* Active Bridges */}
        <div className="glass-panel p-4 border border-slate-200/40 dark:border-industrial-800/80 rounded-xl">
          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Bridges</span>
          <p className="text-xl font-bold font-mono text-slate-700 dark:text-slate-200 mt-1">{stats?.total_bridges ?? '0'}</p>
        </div>
      </div>

      {/* 3. Live Monitoring circular gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strain Gauge (Max expected scale: 1.5mm) */}
        {renderCircularGauge(
          'Strain (Stretch)', 
          currentReading.strain, 
          'mm', 
          thresholds.strain_warning_threshold, 
          thresholds.strain_critical_threshold,
          1.5,
          'animate-pulse-cyan'
        )}

        {/* Tilt Gauge (Max expected scale: 3.0 degrees) */}
        {renderCircularGauge(
          'Tilt (Rotation)', 
          currentReading.tilt, 
          'deg', 
          thresholds.tilt_warning_threshold, 
          thresholds.tilt_critical_threshold,
          3.0,
          'animate-pulse-amber'
        )}

        {/* Vibration Gauge (Max expected scale: 0.5g) */}
        {renderCircularGauge(
          'Vibration (Accel)', 
          currentReading.vibration, 
          'g', 
          thresholds.vibration_warning_threshold, 
          thresholds.vibration_critical_threshold,
          0.5,
          'animate-pulse-rose'
        )}
      </div>

      {/* 4. Real-Time Charts with Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Strain Trend */}
        <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-slate-800/40 pb-3 mb-4">
            <span className="text-sm font-bold font-sans text-slate-700 dark:text-slate-200">Strain vs Time (mm)</span>
            <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">Gauging Flex</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={readings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStrain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip />
                <Area type="monotone" dataKey="strain" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStrain)" name="Strain (mm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Tilt Trend */}
        <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-slate-800/40 pb-3 mb-4">
            <span className="text-sm font-bold font-sans text-slate-700 dark:text-slate-200">Tilt vs Time (Degrees)</span>
            <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest">Angular Inclination</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={readings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTilt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip />
                <Area type="monotone" dataKey="tilt" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTilt)" name="Tilt (Deg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Vibration Trend */}
        <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-slate-800/40 pb-3 mb-4">
            <span className="text-sm font-bold font-sans text-slate-700 dark:text-slate-200">Vibration vs Time (g)</span>
            <span className="text-[10px] font-mono text-rose-500 uppercase tracking-widest">Acceleration Spectral</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={readings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVib" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip />
                <Area type="monotone" dataKey="vibration" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVib)" name="Vibration (g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Combined Trends overlay */}
        <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-slate-800/40 pb-3 mb-4">
            <span className="text-sm font-bold font-sans text-slate-700 dark:text-slate-200">Combined Sensor Trends (Normalized)</span>
            <span className="text-[10px] font-mono text-purple-500 uppercase tracking-widest">Unified Overlay</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="strain" stroke="#06b6d4" strokeWidth={2} dot={false} name="Strain (mm)" />
                <Line type="monotone" dataKey="tilt" stroke="#f59e0b" strokeWidth={2} dot={false} name="Tilt (Deg)" />
                <Line type="monotone" dataKey="vibration" stroke="#f43f5e" strokeWidth={2} dot={false} name="Vibration (g)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
export default Dashboard;
