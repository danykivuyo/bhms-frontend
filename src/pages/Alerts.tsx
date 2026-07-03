import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  AlertTriangle,
  CheckCircle2,
  Bell,
  Layers,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Clock,
  X,
} from 'lucide-react';

interface Alert {
  id: number;
  device_id: string;
  device_name: string;
  bridge_id: number;
  bridge_name: string;
  bridge_code: string;
  sensor_reading_id: number | null;
  timestamp: string;
  level: 'warning' | 'critical';
  sensor_type: 'strain' | 'tilt' | 'vibration';
  value: string;
  threshold: string;
  status: 'active' | 'resolved';
  notes: string;
}

interface Bridge {
  id: number;
  bridge_name: string;
  bridge_code: string;
}

export const Alerts: React.FC = () => {
  const { isEngineer } = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('active');
  const [levelFilter, setLevelFilter] = useState('');
  const [bridgeFilter, setBridgeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [resolveModal, setResolveModal] = useState<Alert | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const [bridges, setBridges] = useState<Bridge[]>([]);

  useEffect(() => {
    api.get('/bridges').then((res) => {
      if (res.data.status === 'success') setBridges(res.data.data);
    });
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['alerts-list', statusFilter, levelFilter, bridgeFilter, page, limit],
    queryFn: async () => {
      const params: any = { page, limit };
      if (statusFilter) params.status = statusFilter;
      if (levelFilter) params.level = levelFilter;
      if (bridgeFilter) params.bridge_id = bridgeFilter;
      const res = await api.get('/alerts', { params });
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  const alerts: Alert[] = data?.alerts || [];
  const pagination = data?.pagination || { total_records: 0, page: 1, total_pages: 0 };

  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      api.put(`/alerts/resolve/${id}`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts-list'] });
      setResolveModal(null);
      setResolveNotes('');
    },
  });

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModal) return;
    resolveMutation.mutate({ id: resolveModal.id, notes: resolveNotes });
  };

  const levelBadge = (level: string) => {
    if (level === 'critical')
      return 'bg-rose-500/15 text-rose-500 border border-rose-500/30';
    if (level === 'warning')
      return 'bg-amber-500/15 text-amber-500 border border-amber-500/30';
    return 'bg-slate-200 text-slate-500';
  };

  const statusBadge = (status: string) => {
    if (status === 'active')
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  };

  const sensorUnit = (type: string) => {
    if (type === 'strain') return 'mm';
    if (type === 'tilt') return '°';
    return 'g';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/30 dark:border-industrial-800/40 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Alarms & Alert Management
          </h2>
          <p className="text-xs font-mono text-slate-400 dark:text-cyan-500/80 uppercase tracking-wider mt-0.5">
            Threshold Breach Events & Structural Anomaly Log
          </p>
        </div>

        {/* Summary Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold text-rose-500 font-mono">
              {alerts.filter((a) => a.status === 'active' && a.level === 'critical').length} Critical
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-500 font-mono">
              {alerts.filter((a) => a.status === 'active' && a.level === 'warning').length} Warning
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-4 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white dark:bg-industrial-950 border border-slate-200 dark:border-industrial-850 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">Level</label>
          <select
            value={levelFilter}
            onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
            className="bg-white dark:bg-industrial-950 border border-slate-200 dark:border-industrial-850 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Levels</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">Bridge</label>
          <select
            value={bridgeFilter}
            onChange={(e) => { setBridgeFilter(e.target.value); setPage(1); }}
            className="bg-white dark:bg-industrial-950 border border-slate-200 dark:border-industrial-850 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Bridges</option>
            {bridges.map((b) => (
              <option key={b.id} value={b.id}>{b.bridge_name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setStatusFilter('active'); setLevelFilter(''); setBridgeFilter(''); setPage(1); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-industrial-800 rounded-lg hover:bg-slate-100 dark:hover:bg-industrial-800 transition-colors"
        >
          <Filter className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Alerts Table */}
      <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-industrial-950/70 border-b border-slate-200 dark:border-industrial-850 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-5 py-4">Level</th>
                <th className="px-5 py-4">Timestamp</th>
                <th className="px-5 py-4">Bridge / Device</th>
                <th className="px-5 py-4">Sensor</th>
                <th className="px-5 py-4">Value</th>
                <th className="px-5 py-4">Threshold</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Notes</th>
                {isEngineer && <th className="px-5 py-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-industrial-850 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-xs font-mono">
                    Loading alarm buffer...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No alerts found</p>
                    <p className="text-xs text-slate-400 mt-1">All systems operating within normal parameters.</p>
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className={`hover:bg-slate-50/50 dark:hover:bg-industrial-900/30 transition-colors ${
                      alert.status === 'active' && alert.level === 'critical'
                        ? 'bg-rose-500/3'
                        : ''
                    }`}
                  >
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-1 rounded ${levelBadge(alert.level)}`}>
                        {alert.level === 'critical' ? (
                          <ShieldAlert className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {alert.level}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{alert.bridge_name}</span>
                        <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{alert.device_id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono font-bold uppercase text-slate-600 dark:text-slate-300">
                        {alert.sensor_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-sm">
                      <span className={alert.level === 'critical' ? 'text-rose-500' : 'text-amber-500'}>
                        {parseFloat(alert.value).toFixed(3)} {sensorUnit(alert.sensor_type)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                      {parseFloat(alert.threshold).toFixed(3)} {sensorUnit(alert.sensor_type)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${statusBadge(alert.status)}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={alert.notes}>
                        {alert.notes || '—'}
                      </p>
                    </td>
                    {isEngineer && (
                      <td className="px-5 py-4 text-right">
                        {alert.status === 'active' && (
                          <button
                            onClick={() => { setResolveModal(alert); setResolveNotes(''); }}
                            className="flex items-center gap-1.5 ml-auto px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-500 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolve
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-industrial-950/20 border-t border-slate-200 dark:border-industrial-850 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500 font-mono">
            Page <strong>{pagination.page}</strong> of <strong>{pagination.total_pages || 1}</strong> ({pagination.total_records} records)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 rounded hover:bg-slate-100 dark:hover:bg-industrial-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= (pagination.total_pages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 rounded hover:bg-slate-100 dark:hover:bg-industrial-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setResolveModal(null)} />
          <div className="glass-panel w-full max-w-md border border-slate-200/50 dark:border-industrial-800 rounded-2xl shadow-2xl relative z-10 fade-in-slide overflow-hidden">
            <div className="px-6 py-4 bg-slate-100 dark:bg-industrial-950/70 border-b border-slate-200/50 dark:border-industrial-800/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Resolve Alert</h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                  {resolveModal.sensor_type} — {resolveModal.bridge_name}
                </p>
              </div>
              <button onClick={() => setResolveModal(null)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-industrial-800 rounded-lg text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolve} className="p-6 space-y-4">
              <div className={`p-3 rounded-lg border text-xs font-mono ${levelBadge(resolveModal.level)}`}>
                <strong className="uppercase">{resolveModal.level}</strong> — {resolveModal.sensor_type} value{' '}
                <strong>{parseFloat(resolveModal.value).toFixed(3)}</strong> exceeded threshold{' '}
                <strong>{parseFloat(resolveModal.threshold).toFixed(3)}</strong>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1.5 font-bold">
                  Resolution Notes (optional)
                </label>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Describe corrective action taken..."
                  rows={3}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModal(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-industrial-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-industrial-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolveMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 shadow shadow-emerald-500/10"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
