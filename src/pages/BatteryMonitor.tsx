import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Battery, BatteryLow, BatteryWarning, Clock, Layers, Cpu, Play, Pause, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface Bridge { id: number; bridge_name: string; bridge_code: string; }
interface Device { id: number; device_id: string; device_name: string; bridge_id: number; status: 'online' | 'offline'; }
interface Reading { device_id: string; timestamp: string; battery_level: number; }

const BATTERY_COLORS = ['#06b6d4','#f59e0b','#a78bfa','#34d399','#f43f5e','#fb923c','#818cf8'];

function batteryColor(level: number) {
  if (level <= 20) return { stroke: '#f43f5e', fill: 'url(#batCrit)', label: 'CRITICAL', labelCls: 'text-rose-500 bg-rose-500/15' };
  if (level <= 40) return { stroke: '#f59e0b', fill: 'url(#batWarn)', label: 'LOW',      labelCls: 'text-amber-500 bg-amber-500/15' };
  return              { stroke: '#22c55e',  fill: 'url(#batOk)',   label: 'GOOD',     labelCls: 'text-emerald-500 bg-emerald-500/15' };
}

function BatteryIcon({ level }: { level: number }) {
  if (level <= 20) return <BatteryLow    className="w-5 h-5 text-rose-500" />;
  if (level <= 40) return <BatteryWarning className="w-5 h-5 text-amber-500" />;
  return                  <Battery        className="w-5 h-5 text-emerald-500" />;
}

export const BatteryMonitor: React.FC = () => {
  const [selectedBridge, setSelectedBridge] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [timeRange, setTimeRange]           = useState<number>(6);
  const [liveMode, setLiveMode]             = useState<boolean>(true);

  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [rb, rd] = await Promise.all([api.get('/bridges'), api.get('/devices')]);
        if (rb.data.status === 'success') {
          const list: Bridge[] = rb.data.data;
          setBridges(list);
          if (list.length > 0) setSelectedBridge(String(list[0].id));
        }
        if (rd.data.status === 'success') setDevices(rd.data.data);
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const filteredDevices = devices.filter(d => d.bridge_id === parseInt(selectedBridge));

  const { data: readings = [], refetch } = useQuery<Reading[]>({
    queryKey: ['battery-trends', selectedBridge, selectedDevice, timeRange],
    queryFn: async () => {
      const params: any = { limit: 500, hours: timeRange };
      if (selectedBridge && selectedBridge !== 'all') params.bridge_id = selectedBridge;
      if (selectedDevice && selectedDevice !== 'all') params.device_id = selectedDevice;
      const res = await api.get('/readings/trends', { params });
      return (res.data.data as any[]).map(r => ({
        device_id:     r.device_id,
        timestamp:     r.timestamp,
        battery_level: parseFloat(r.battery_level),
      }));
    },
    refetchInterval: liveMode ? 10000 : false,
  });

  // Group readings by device_id
  const deviceIds = Array.from(new Set(readings.map(r => r.device_id)));

  // Build per-device chart data: [{ts, battery_level}]
  const perDevice: Record<string, { ts: number; battery_level: number }[]> = {};
  for (const did of deviceIds) {
    perDevice[did] = readings
      .filter(r => r.device_id === did)
      .map(r => ({ ts: new Date(r.timestamp).getTime(), battery_level: r.battery_level }));
  }

  // Latest battery per device
  const latestBattery: Record<string, number> = {};
  for (const did of deviceIds) {
    const arr = perDevice[did];
    latestBattery[did] = arr[arr.length - 1]?.battery_level ?? 0;
  }

  // Combined chart data (all devices on one chart, keyed by ts)
  const combinedMap: Record<number, any> = {};
  for (const did of deviceIds) {
    for (const pt of perDevice[did]) {
      if (!combinedMap[pt.ts]) combinedMap[pt.ts] = { ts: pt.ts };
      combinedMap[pt.ts][did] = pt.battery_level;
    }
  }
  const combinedData = Object.values(combinedMap).sort((a, b) => a.ts - b.ts);

  const xDomainEnd   = Date.now();
  const xDomainStart = xDomainEnd - timeRange * 3600000;

  const xTickFmt = (ms: number) => {
    const d = new Date(ms);
    if (timeRange > 24) return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (timeRange > 1)  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  const xTipFmt = (ms: number) => new Date(ms).toLocaleString();

  const deviceName = (did: string) =>
    devices.find(d => d.device_id === did)?.device_name ?? did;

  return (
    <div className="space-y-6">

      {/* Header + Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between border-b border-slate-200/30 dark:border-industrial-800/40 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Battery Monitor</h2>
          <p className="text-xs font-mono text-slate-400 dark:text-cyan-500/80 uppercase tracking-wider mt-0.5">
            Node Power Health & Discharge Trends
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Bridge */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <select value={selectedBridge} onChange={e => { setSelectedBridge(e.target.value); setSelectedDevice('all'); }}
              className="bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 text-sm rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500">
              {bridges.map(b => <option key={b.id} value={b.id}>{b.bridge_name} ({b.bridge_code})</option>)}
            </select>
          </div>

          {/* Device */}
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-400" />
            <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}
              className="bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 text-sm rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500">
              <option value="all">All Devices</option>
              {filteredDevices.map(d => <option key={d.id} value={d.device_id}>{d.device_name} ({d.device_id})</option>)}
            </select>
          </div>

          {/* Time Range */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <select value={timeRange} onChange={e => setTimeRange(Number(e.target.value))}
              className="bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 text-sm rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500">
              <option value={1}>Last 1 Hour</option>
              <option value={3}>Last 3 Hours</option>
              <option value={6}>Last 6 Hours</option>
              <option value={12}>Last 12 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={48}>Last 48 Hours</option>
              <option value={168}>Last 7 Days</option>
            </select>
          </div>

          {/* Live toggle */}
          <button onClick={() => setLiveMode(!liveMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border duration-150 ${
              liveMode ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500 animate-pulse-cyan'
                       : 'bg-slate-200 dark:bg-industrial-800 border-transparent text-slate-500 dark:text-slate-400'}`}>
            {liveMode ? <><Play className="w-3.5 h-3.5" /><span>LIVE ON</span></>
                      : <><Pause className="w-3.5 h-3.5" /><span>PAUSED</span></>}
          </button>

          <button onClick={() => refetch()}
            className="p-2 bg-slate-100 dark:bg-industrial-800 border border-slate-200 dark:border-industrial-850 hover:bg-slate-200 dark:hover:bg-industrial-700 text-slate-500 dark:text-slate-300 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Per-device battery gauge cards */}
      {deviceIds.length === 0 ? (
        <div className="glass-panel p-12 text-center border border-slate-200/40 dark:border-industrial-800/60 rounded-xl">
          <Battery className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No battery data for the selected filters and time range.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {deviceIds.map(did => {
            const level = latestBattery[did];
            const { stroke, label, labelCls } = batteryColor(level);
            const pct = Math.min(100, Math.max(0, level));
            const radius = 40;
            const circ = 2 * Math.PI * radius;
            const offset = circ - (pct / 100) * circ;
            return (
              <div key={did} className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-4 flex flex-col items-center gap-3">
                <div className="flex items-center justify-between w-full">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold truncate">{deviceName(did)}</span>
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${labelCls}`}>{label}</span>
                </div>
                <div className="relative flex items-center justify-center">
                  <svg className="w-24 h-24 -rotate-90">
                    <circle cx="48" cy="48" r={radius} className="stroke-slate-200 dark:stroke-industrial-800" strokeWidth="8" fill="transparent" />
                    <circle cx="48" cy="48" r={radius} stroke={stroke} strokeWidth="8"
                      strokeDasharray={circ} strokeDashoffset={offset}
                      strokeLinecap="round" fill="transparent"
                      className="transition-all duration-500" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <BatteryIcon level={level} />
                    <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 leading-none mt-1">{level.toFixed(0)}%</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">{did}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Per-device trend charts */}
      {deviceIds.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {deviceIds.map((did, i) => {
            const { stroke } = batteryColor(latestBattery[did]);
            const gradId = `batGrad_${i}`;
            return (
              <div key={did} className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-5">
                <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-slate-800/40 pb-3 mb-4">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{deviceName(did)}</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{did} · Battery %</span>
                </div>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={perDevice[did]} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={stroke} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={stroke} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                      <XAxis dataKey="ts" type="number" scale="time"
                        domain={[xDomainStart, xDomainEnd]} allowDataOverflow
                        tickFormatter={xTickFmt} tick={{ fontSize: 10, fill: '#64748b' }} tickCount={5} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                      <Tooltip labelFormatter={xTipFmt} formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Battery']} />
                      <Area type="monotone" dataKey="battery_level" stroke={stroke} strokeWidth={2.5}
                        fillOpacity={1} fill={`url(#${gradId})`} name="Battery %" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Combined overlay chart */}
      {deviceIds.length > 1 && (
        <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between border-b border-slate-200/20 dark:border-slate-800/40 pb-3 mb-4">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">All Devices — Battery Overlay</span>
            <span className="text-[10px] font-mono text-purple-500 uppercase tracking-widest">Unified Comparison</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {deviceIds.map((did, i) => (
                    <linearGradient key={did} id={`combGrad_${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={BATTERY_COLORS[i % BATTERY_COLORS.length]} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={BATTERY_COLORS[i % BATTERY_COLORS.length]} stopOpacity={0.0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="ts" type="number" scale="time"
                  domain={[xDomainStart, xDomainEnd]} allowDataOverflow
                  tickFormatter={xTickFmt} tick={{ fontSize: 10, fill: '#64748b' }} tickCount={6} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <Tooltip labelFormatter={xTipFmt} formatter={(v: any, name: string) => [`${Number(v).toFixed(1)}%`, deviceName(name)]} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }}
                  formatter={(value) => deviceName(value)} />
                {deviceIds.map((did, i) => (
                  <Area key={did} type="monotone" dataKey={did}
                    stroke={BATTERY_COLORS[i % BATTERY_COLORS.length]} strokeWidth={2}
                    fill={`url(#combGrad_${i})`} fillOpacity={1} dot={false} name={did} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};

export default BatteryMonitor;
