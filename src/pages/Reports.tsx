import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  FileSpreadsheet,
  Plus,
  Download,
  Calendar,
  Layers,
  X,
  Check,
  AlertTriangle,
  FileText,
  Clock,
  User,
} from 'lucide-react';
import jsPDF from 'jspdf';

interface Report {
  id: number;
  bridge_id: number;
  bridge_name: string;
  bridge_code: string;
  title: string;
  generated_by: number;
  generated_by_name: string;
  start_date: string;
  end_date: string;
  file_path: string;
  created_at: string;
}

interface Bridge {
  id: number;
  bridge_name: string;
  bridge_code: string;
  region: string;
  district: string;
  bridge_type: string;
  length: number;
  width: number;
  construction_year: number;
}

interface SensorStats {
  max_strain: number;
  min_strain: number;
  avg_strain: number;
  max_tilt: number;
  min_tilt: number;
  avg_tilt: number;
  max_vibration: number;
  min_vibration: number;
  avg_vibration: number;
  total_readings: number;
}

export const Reports: React.FC = () => {
  const { isEngineer, user } = useAuth();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [bridgeId, setBridgeId] = useState('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const [bridges, setBridges] = useState<Bridge[]>([]);

  useEffect(() => {
    api.get('/bridges').then((res) => {
      if (res.data.status === 'success') setBridges(res.data.data);
    });
  }, []);

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['reports-list'],
    queryFn: async () => {
      const res = await api.get('/reports');
      return res.data.data;
    },
  });

  const logReportMutation = useMutation({
    mutationFn: (payload: any) => api.post('/reports', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports-list'] });
    },
  });

  const handleOpenModal = () => {
    setFormError(null);
    setBridgeId(bridges[0]?.id.toString() || '');
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    setStartDate(weekAgo);
    setEndDate(today);
    setTitle('');
    setModalOpen(true);
  };

  const generatePDF = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!bridgeId || !startDate || !endDate) {
      setFormError('Bridge, start date, and end date are required.');
      return;
    }

    const selectedBridge = bridges.find((b) => b.id === parseInt(bridgeId));
    if (!selectedBridge) {
      setFormError('Selected bridge not found.');
      return;
    }

    const reportTitle = title || `SHM Report — ${selectedBridge.bridge_name} (${startDate} to ${endDate})`;
    setGenerating(true);

    try {
      // Fetch readings for the period
      const readingsRes = await api.get('/readings', {
        params: { bridge_id: bridgeId, start_date: startDate, end_date: endDate, limit: 1000 },
      });
      const readings = readingsRes.data.data?.readings || [];

      // Fetch alerts for the period
      const alertsRes = await api.get('/alerts', {
        params: { bridge_id: bridgeId, limit: 100 },
      });
      const alerts = alertsRes.data.data?.alerts || [];

      // Compute stats
      const stats: SensorStats = readings.reduce(
        (acc: any, r: any) => {
          const s = parseFloat(r.strain);
          const t = parseFloat(r.tilt);
          const v = parseFloat(r.vibration);
          return {
            max_strain: Math.max(acc.max_strain, s),
            min_strain: Math.min(acc.min_strain, s),
            avg_strain: acc.avg_strain + s,
            max_tilt: Math.max(acc.max_tilt, t),
            min_tilt: Math.min(acc.min_tilt, t),
            avg_tilt: acc.avg_tilt + t,
            max_vibration: Math.max(acc.max_vibration, v),
            min_vibration: Math.min(acc.min_vibration, v),
            avg_vibration: acc.avg_vibration + v,
            total_readings: acc.total_readings + 1,
          };
        },
        {
          max_strain: -Infinity, min_strain: Infinity, avg_strain: 0,
          max_tilt: -Infinity, min_tilt: Infinity, avg_tilt: 0,
          max_vibration: -Infinity, min_vibration: Infinity, avg_vibration: 0,
          total_readings: 0,
        }
      );

      if (stats.total_readings > 0) {
        stats.avg_strain /= stats.total_readings;
        stats.avg_tilt /= stats.total_readings;
        stats.avg_vibration /= stats.total_readings;
      }

      // Build PDF
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header bar
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 35, 'F');

      doc.setTextColor(6, 182, 212);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('BridgeSense AI', 15, 15);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('BRIDGE STRUCTURAL HEALTH MONITORING PLATFORM', 15, 22);
      doc.text(`Generated: ${new Date().toLocaleString()}  |  By: ${user?.username || 'System'}`, 15, 28);

      y = 48;

      // Report Title
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(reportTitle, 15, y);
      y += 8;

      doc.setDrawColor(6, 182, 212);
      doc.setLineWidth(0.5);
      doc.line(15, y, pageW - 15, y);
      y += 8;

      // Bridge Details Section
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Bridge Information', 15, y);
      y += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);

      const bridgeDetails = [
        ['Bridge Name:', selectedBridge.bridge_name],
        ['Bridge Code:', selectedBridge.bridge_code],
        ['Type:', selectedBridge.bridge_type],
        ['Region / District:', `${selectedBridge.region} / ${selectedBridge.district}`],
        ['Dimensions:', `${selectedBridge.length}m × ${selectedBridge.width}m`],
        ['Construction Year:', selectedBridge.construction_year.toString()],
        ['Report Period:', `${startDate} to ${endDate}`],
      ];

      bridgeDetails.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text(label, 15, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(value, 65, y);
        y += 6;
      });

      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, y, pageW - 15, y);
      y += 8;

      // Sensor Statistics
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Sensor Statistics', 15, y);
      y += 6;

      if (stats.total_readings === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184);
        doc.text('No sensor readings found for the selected period.', 15, y);
        y += 8;
      } else {
        // Stats table header
        doc.setFillColor(241, 245, 249);
        doc.rect(15, y - 4, pageW - 30, 8, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('SENSOR', 18, y);
        doc.text('MAX', 70, y);
        doc.text('MIN', 100, y);
        doc.text('AVG', 130, y);
        doc.text('UNIT', 160, y);
        y += 7;

        const sensorRows = [
          ['Strain', stats.max_strain, stats.min_strain, stats.avg_strain, 'mm'],
          ['Tilt', stats.max_tilt, stats.min_tilt, stats.avg_tilt, '°'],
          ['Vibration', stats.max_vibration, stats.min_vibration, stats.avg_vibration, 'g'],
        ];

        sensorRows.forEach(([name, max, min, avg, unit], i) => {
          if (i % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, y - 4, pageW - 30, 7, 'F');
          }
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(name as string, 18, y);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text((max as number).toFixed(4), 70, y);
          doc.text((min as number).toFixed(4), 100, y);
          doc.text((avg as number).toFixed(4), 130, y);
          doc.text(unit as string, 160, y);
          y += 7;
        });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184);
        doc.text(`Total readings analyzed: ${stats.total_readings}`, 15, y + 2);
        y += 10;
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(15, y, pageW - 15, y);
      y += 8;

      // Alert Summary
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Alert Summary', 15, y);
      y += 6;

      const criticalAlerts = alerts.filter((a: any) => a.level === 'critical');
      const warningAlerts = alerts.filter((a: any) => a.level === 'warning');
      const activeAlerts = alerts.filter((a: any) => a.status === 'active');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Total Alerts: ${alerts.length}`, 15, y); y += 6;
      doc.setTextColor(244, 63, 94);
      doc.text(`Critical: ${criticalAlerts.length}`, 15, y); y += 6;
      doc.setTextColor(245, 158, 11);
      doc.text(`Warning: ${warningAlerts.length}`, 15, y); y += 6;
      doc.setTextColor(239, 68, 68);
      doc.text(`Still Active: ${activeAlerts.length}`, 15, y); y += 10;

      // Recent alerts list (up to 10)
      if (alerts.length > 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(15, y - 4, pageW - 30, 8, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('TIMESTAMP', 18, y);
        doc.text('SENSOR', 65, y);
        doc.text('LEVEL', 95, y);
        doc.text('VALUE', 120, y);
        doc.text('STATUS', 150, y);
        y += 7;

        alerts.slice(0, 10).forEach((alert: any, i: number) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }
          if (i % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, y - 4, pageW - 30, 7, 'F');
          }
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(new Date(alert.timestamp).toLocaleDateString(), 18, y);
          doc.text(alert.sensor_type, 65, y);
          if (alert.level === 'critical') doc.setTextColor(244, 63, 94);
          else doc.setTextColor(245, 158, 11);
          doc.text(alert.level.toUpperCase(), 95, y);
          doc.setTextColor(71, 85, 105);
          doc.text(parseFloat(alert.value).toFixed(3), 120, y);
          if (alert.status === 'active') doc.setTextColor(239, 68, 68);
          else doc.setTextColor(16, 185, 129);
          doc.text(alert.status.toUpperCase(), 150, y);
          y += 7;
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 285, pageW, 12, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('BridgeSense AI — Confidential Structural Health Monitoring Report', 15, 292);
        doc.text(`Page ${i} of ${pageCount}`, pageW - 30, 292);
      }

      // Engineer signature line on last page
      doc.setPage(pageCount);
      if (y < 260) {
        y += 15;
        doc.setDrawColor(100, 116, 139);
        doc.line(15, y, 80, y);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Engineer Signature', 15, y + 5);
        doc.line(pageW - 80, y, pageW - 15, y);
        doc.text('Date', pageW - 80, y + 5);
      }

      // Save PDF
      const filename = `BridgeSense_Report_${selectedBridge.bridge_code}_${startDate}_${endDate}.pdf`;
      doc.save(filename);

      // Log report to backend
      await logReportMutation.mutateAsync({
        bridge_id: parseInt(bridgeId),
        title: reportTitle,
        start_date: startDate,
        end_date: endDate,
        file_path: filename,
      });

      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/30 dark:border-industrial-800/40 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            PDF Reports Generator
          </h2>
          <p className="text-xs font-mono text-slate-400 dark:text-cyan-500/80 uppercase tracking-wider mt-0.5">
            Structural Analysis Reports with Sensor Statistics & Alert Summary
          </p>
        </div>

        {isEngineer && (
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-all shadow-md shadow-cyan-500/10"
          >
            <Plus className="w-4 h-4" />
            Generate Report
          </button>
        )}
      </div>

      {/* Reports History */}
      {isLoading ? (
        <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-8 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-slate-200 dark:bg-industrial-800 rounded-lg" />
            ))}
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-panel p-16 text-center border border-slate-200/40 dark:border-industrial-800/60 rounded-xl">
          <FileSpreadsheet className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-md font-bold text-slate-700 dark:text-slate-300">No Reports Generated Yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Generate your first structural health monitoring PDF report.
          </p>
        </div>
      ) : (
        <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-industrial-950/70 border-b border-slate-200 dark:border-industrial-850 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-4">Report Title</th>
                  <th className="px-6 py-4">Bridge</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Generated By</th>
                  <th className="px-6 py-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-industrial-850 text-slate-700 dark:text-slate-300">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-industrial-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{report.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">{report.bridge_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{report.bridge_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {report.start_date} → {report.end_date}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {report.generated_by_name || 'System'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(report.created_at).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !generating && setModalOpen(false)} />
          <div className="glass-panel w-full max-w-lg border border-slate-200/50 dark:border-industrial-800 rounded-2xl shadow-2xl relative z-10 fade-in-slide overflow-hidden">
            <div className="px-6 py-4 bg-slate-100 dark:bg-industrial-950/70 border-b border-slate-200/50 dark:border-industrial-800/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Generate PDF Report</h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                  Structural Health Analysis Document
                </p>
              </div>
              {!generating && (
                <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-industrial-800 rounded-lg text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <form onSubmit={generatePDF} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-500 text-xs flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1.5 font-bold">
                  Bridge Structure *
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    required
                    value={bridgeId}
                    onChange={(e) => setBridgeId(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="" disabled>Select a bridge...</option>
                    {bridges.map((b) => (
                      <option key={b.id} value={b.id}>{b.bridge_name} ({b.bridge_code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1.5 font-bold">
                  Report Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Auto-generated if left blank"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1.5 font-bold">
                    Start Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1.5 font-bold">
                    End Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/30 dark:border-industrial-800/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={generating}
                  className="px-4 py-2 border border-slate-200 dark:border-industrial-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-industrial-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 shadow shadow-cyan-500/10 disabled:opacity-70"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Generate & Download
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
