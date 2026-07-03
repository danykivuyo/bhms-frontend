import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  Search, 
  Calendar, 
  Layers, 
  Cpu, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  FileText,
  ArrowUpDown,
  Filter
} from 'lucide-react';

interface Reading {
  id: number;
  device_id: string;
  device_name: string;
  bridge_id: number;
  bridge_name: string;
  bridge_code: string;
  timestamp: string;
  strain: number;
  tilt: number;
  vibration: number;
  battery_level: number;
  signal_strength: number;
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
}

export const HistoricalData: React.FC = () => {
  // Query Filters & Paging state
  const [bridgeFilter, setBridgeFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Lists for dropdown filters
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  // Fetch filters metadata
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const resB = await api.get('/bridges');
        if (resB.data.status === 'success') setBridges(resB.data.data);
        const resD = await api.get('/devices');
        if (resD.data.status === 'success') setDevices(resD.data.data);
      } catch (err) {
        console.error("Failed to load filters list", err);
      }
    };
    fetchMeta();
  }, []);

  // Fetch readings paginated query
  const { data, isLoading } = useQuery({
    queryKey: ['readings-log', page, limit, bridgeFilter, deviceFilter, startDate, endDate, search, sortBy, sortOrder],
    queryFn: async () => {
      const params = {
        page,
        limit,
        bridge_id: bridgeFilter,
        device_id: deviceFilter,
        start_date: startDate,
        end_date: endDate,
        search,
        sort_by: sortBy,
        sort_order: sortOrder
      };
      const res = await api.get('/readings', { params });
      return res.data.data;
    }
  });

  const readings: Reading[] = data?.readings || [];
  const pagination = data?.pagination || { total_records: 0, page: 1, limit: 20, total_pages: 0 };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('DESC');
    }
    setPage(1); // reset to first page on sort
  };

  // Helper: Trigger CSV file download
  const handleExportCSV = () => {
    if (readings.length === 0) return;
    
    // Header
    const headers = ['ID', 'Device ID', 'Device Name', 'Bridge Code', 'Bridge Name', 'Timestamp', 'Strain (mm)', 'Tilt (deg)', 'Vibration (g)', 'Battery (%)', 'Signal (dBm)'];
    
    // Rows
    const rows = readings.map(r => [
      r.id,
      r.device_id,
      `"${r.device_name}"`,
      r.bridge_code,
      `"${r.bridge_name}"`,
      r.timestamp,
      r.strain,
      r.tilt,
      r.vibration,
      r.battery_level,
      r.signal_strength
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bridgesense_dataset_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  // Helper: Trigger JSON file download
  const handleExportJSON = () => {
    if (readings.length === 0) return;
    
    const jsonContent = JSON.stringify(readings, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bridgesense_dataset_${new Date().toISOString().split('T')[0]}.json`);
    link.click();
  };

  // Helper: Trigger Excel file download (HTML table method)
  const handleExportExcel = () => {
    if (readings.length === 0) return;
    
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>SHM Dataset</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body><table>
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold;">
            <th>ID</th><th>Device ID</th><th>Device Name</th><th>Bridge Code</th><th>Bridge Name</th><th>Timestamp</th><th>Strain (mm)</th><th>Tilt (deg)</th><th>Vibration (g)</th><th>Battery (%)</th><th>Signal (dBm)</th>
          </tr>
        </thead>
        <tbody>`;
    
    readings.forEach(r => {
      html += `<tr>
        <td>${r.id}</td><td>${r.device_id}</td><td>${r.device_name}</td><td>${r.bridge_code}</td><td>${r.bridge_name}</td><td>${r.timestamp}</td><td>${r.strain}</td><td>${r.tilt}</td><td>${r.vibration}</td><td>${r.battery_level}</td><td>${r.signal_strength}</td>
      </tr>`;
    });

    html += `</tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bridgesense_dataset_${new Date().toISOString().split('T')[0]}.xls`);
    link.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/30 dark:border-industrial-800/40 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Historical Telemetry Logs
          </h2>
          <p className="text-xs font-mono text-slate-400 dark:text-cyan-500/80 uppercase tracking-wider mt-0.5">
            Query, Filter & Export ML Training Datasets
          </p>
        </div>

        {/* Dataset Export Suite */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={readings.length === 0}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-industrial-800 disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            disabled={readings.length === 0}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-industrial-800 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportJSON}
            disabled={readings.length === 0}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-industrial-800 disabled:opacity-50"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Search */}
        <div className="flex flex-col">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">Search Device/Bridge</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Type keyword..."
              className="w-full bg-white dark:bg-industrial-950 border border-slate-200 dark:border-industrial-850 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Bridge Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">Filter Bridge</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Layers className="w-4 h-4" />
            </span>
            <select
              value={bridgeFilter}
              onChange={(e) => { setBridgeFilter(e.target.value); setDeviceFilter(''); setPage(1); }}
              className="w-full bg-white dark:bg-industrial-950 border border-slate-200 dark:border-industrial-850 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Bridges</option>
              {bridges.map(b => (
                <option key={b.id} value={b.id}>{b.bridge_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Device Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">Filter Device</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Cpu className="w-4 h-4" />
            </span>
            <select
              value={deviceFilter}
              disabled={!bridgeFilter}
              onChange={(e) => { setDeviceFilter(e.target.value); setPage(1); }}
              className="w-full bg-white dark:bg-industrial-950 border border-slate-200 dark:border-industrial-850 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            >
              <option value="">All Devices</option>
              {devices
                .filter(d => !bridgeFilter || d.bridge_id === parseInt(bridgeFilter))
                .map(d => (
                  <option key={d.id} value={d.device_id}>{d.device_name} ({d.device_id})</option>
                ))}
            </select>
          </div>
        </div>

        {/* Start Date */}
        <div className="flex flex-col">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">Start Date</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Calendar className="w-4 h-4" />
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full bg-white dark:bg-industrial-950 border border-slate-200 dark:border-industrial-850 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* End Date */}
        <div className="flex flex-col">
          <label className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">End Date</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Calendar className="w-4 h-4" />
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full bg-white dark:bg-industrial-950 border border-slate-200 dark:border-industrial-850 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

      </div>

      {/* Main Table Panel */}
      <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-industrial-950/70 border-b border-slate-200 dark:border-industrial-850 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                
                <th className="px-6 py-4 cursor-pointer hover:text-cyan-500" onClick={() => handleSort('timestamp')}>
                  <div className="flex items-center gap-1.5">
                    <span>Timestamp</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                
                <th className="px-6 py-4">Bridge</th>
                
                <th className="px-6 py-4">Device ID</th>
                
                <th className="px-6 py-4 cursor-pointer hover:text-cyan-500" onClick={() => handleSort('strain')}>
                  <div className="flex items-center gap-1.5">
                    <span>Strain (mm)</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                
                <th className="px-6 py-4 cursor-pointer hover:text-cyan-500" onClick={() => handleSort('tilt')}>
                  <div className="flex items-center gap-1.5">
                    <span>Tilt (deg)</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                
                <th className="px-6 py-4 cursor-pointer hover:text-cyan-500" onClick={() => handleSort('vibration')}>
                  <div className="flex items-center gap-1.5">
                    <span>Vibration (g)</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                
                <th className="px-6 py-4 cursor-pointer hover:text-cyan-500" onClick={() => handleSort('battery_level')}>
                  <div className="flex items-center gap-1.5">
                    <span>Battery</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                
                <th className="px-6 py-4 cursor-pointer hover:text-cyan-500" onClick={() => handleSort('signal_strength')}>
                  <div className="flex items-center gap-1.5">
                    <span>Signal</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>

              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-industrial-850 text-slate-700 dark:text-slate-300 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Loading logs buffer...
                  </td>
                </tr>
              ) : readings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No matching telemetry logs found.
                  </td>
                </tr>
              ) : (
                readings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-slate-100/30 dark:hover:bg-industrial-900/30 transition-colors duration-100">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">
                      {new Date(reading.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{reading.bridge_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{reading.bridge_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-500/5 dark:bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/10">
                        {reading.device_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold">
                      {parseFloat(reading.strain.toString()).toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold">
                      {parseFloat(reading.tilt.toString()).toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold">
                      {parseFloat(reading.vibration.toString()).toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                      {parseFloat(reading.battery_level.toString()).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                      {reading.signal_strength} dBm
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-industrial-950/20 border-t border-slate-200 dark:border-industrial-850 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-mono">
            Showing Page <span className="font-bold text-slate-700 dark:text-slate-350">{pagination.page}</span> of{' '}
            <span className="font-bold text-slate-700 dark:text-slate-350">{pagination.total_pages}</span> ({pagination.total_records} logs)
          </div>

          <div className="flex items-center gap-3">
            {/* Page Size Select */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Show</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                className="bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 rounded px-1.5 py-0.5 focus:outline-none focus:border-cyan-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            {/* Pagination Nav */}
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 rounded hover:bg-slate-100 dark:hover:bg-industrial-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.total_pages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 rounded hover:bg-slate-100 dark:hover:bg-industrial-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
export default HistoricalData;
