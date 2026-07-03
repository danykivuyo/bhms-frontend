import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Ruler, 
  Calendar, 
  Search, 
  Info, 
  X, 
  Check, 
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

interface Bridge {
  id: number;
  bridge_name: string;
  bridge_code: string;
  region: string;
  district: string;
  latitude: number;
  longitude: number;
  construction_year: number;
  bridge_type: string;
  length: number;
  width: number;
  notes: string;
  total_devices: number;
  online_devices: number;
}

export const Bridges: React.FC = () => {
  const { isEngineer, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBridge, setEditingBridge] = useState<Bridge | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [notes, setNotes] = useState('');
  
  const [formError, setFormError] = useState<string | null>(null);

  // Query: Fetch all bridges
  const { data: bridges = [], isLoading, error } = useQuery<Bridge[]>({
    queryKey: ['bridges-list'],
    queryFn: async () => {
      const res = await api.get('/bridges');
      return res.data.data;
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newBridge: any) => api.post('/bridges', newBridge),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bridges-list'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to create bridge.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updated }: { id: number, updated: any }) => api.put(`/bridges/${id}`, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bridges-list'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to update bridge.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/bridges/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bridges-list'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to delete bridge.");
    }
  });

  const handleOpenModal = (bridge: Bridge | null = null) => {
    setFormError(null);
    if (bridge) {
      setEditingBridge(bridge);
      setName(bridge.bridge_name);
      setCode(bridge.bridge_code);
      setRegion(bridge.region);
      setDistrict(bridge.district);
      setLatitude(bridge.latitude.toString());
      setLongitude(bridge.longitude.toString());
      setYear(bridge.construction_year.toString());
      setType(bridge.bridge_type);
      setLength(bridge.length.toString());
      setWidth(bridge.width.toString());
      setNotes(bridge.notes || '');
    } else {
      setEditingBridge(null);
      setName('');
      setCode('');
      setRegion('');
      setDistrict('');
      setLatitude('');
      setLongitude('');
      setYear('');
      setType('Suspension');
      setLength('');
      setWidth('');
      setNotes('');
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingBridge(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      bridge_name: name,
      bridge_code: code,
      region,
      district,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      construction_year: parseInt(year),
      bridge_type: type,
      length: parseFloat(length),
      width: parseFloat(width),
      notes
    };

    // Validation
    if (isNaN(payload.latitude) || isNaN(payload.longitude)) {
      setFormError("GPS Coordinates must be valid numbers.");
      return;
    }
    if (isNaN(payload.construction_year) || isNaN(payload.length) || isNaN(payload.width)) {
      setFormError("Dimensions and Year must be valid numbers.");
      return;
    }

    if (editingBridge) {
      updateMutation.mutate({ id: editingBridge.id, updated: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to permanently delete this bridge and all assigned devices?")) {
      deleteMutation.mutate(id);
    }
  };

  // Filter bridges list based on search bar queries
  const filteredBridges = bridges.filter(b => 
    b.bridge_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bridge_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/30 dark:border-industrial-800/40 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Bridge Assets Registry
          </h2>
          <p className="text-xs font-mono text-slate-400 dark:text-cyan-500/80 uppercase tracking-wider mt-0.5">
            Geospatial Infrastructure Inventory & Dimensions
          </p>
        </div>

        {isEngineer && (
          <button
            onClick={() => handleOpenModal(null)}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-all shadow-md shadow-cyan-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Bridge</span>
          </button>
        )}
      </div>

      {/* Search Filter input */}
      <div className="w-full max-w-md relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter bridges by name, code or region..."
          className="w-full bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel border border-slate-200/50 dark:border-industrial-800/70 p-6 rounded-xl animate-pulse space-y-4">
              <div className="h-4 bg-slate-300 dark:bg-industrial-800 rounded w-2/3" />
              <div className="h-3 bg-slate-300 dark:bg-industrial-800 rounded w-1/2" />
              <div className="space-y-2 pt-4">
                <div className="h-3 bg-slate-300 dark:bg-industrial-800 rounded" />
                <div className="h-3 bg-slate-300 dark:bg-industrial-800 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredBridges.length === 0 && (
        <div className="glass-panel p-12 text-center border border-slate-200/40 dark:border-industrial-800/60 rounded-xl max-w-xl mx-auto">
          <FolderOpen className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-md font-bold text-slate-700 dark:text-slate-300">No Bridge Entries Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Try adjusting your search criteria or register a new physical bridge structure.
          </p>
        </div>
      )}

      {/* Grid of Bridge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBridges.map((bridge) => (
          <div 
            key={bridge.id}
            className="glass-panel border border-slate-200/50 dark:border-industrial-800/70 rounded-xl p-5 flex flex-col justify-between hover:border-cyan-500/35 transition-all duration-200 group relative"
          >
            {/* Top header */}
            <div>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-cyan-500 transition-colors">
                    {bridge.bridge_name}
                  </h3>
                  <span className="inline-block text-[10px] font-mono font-bold bg-slate-100 dark:bg-industrial-950 px-2 py-0.5 rounded text-slate-500 dark:text-cyan-400/80 uppercase tracking-widest border border-slate-200/20 dark:border-slate-800/20 mt-1">
                    {bridge.bridge_code}
                  </span>
                </div>
                
                {/* Connection bubble status */}
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">TELEMETRY</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${bridge.online_devices > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                      {bridge.online_devices}/{bridge.total_devices} Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Geographic details */}
              <div className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-industrial-800/50 pt-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{bridge.district}, {bridge.region}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Built: <strong className="text-slate-700 dark:text-slate-200">{bridge.construction_year}</strong> ({bridge.bridge_type})</span>
                </div>

                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Length: <strong className="text-slate-700 dark:text-slate-200">{bridge.length}m</strong>, Width: <strong className="text-slate-700 dark:text-slate-200">{bridge.width}m</strong></span>
                </div>

                {bridge.notes && (
                  <div className="flex items-start gap-2 bg-slate-100/30 dark:bg-industrial-950/20 p-2.5 rounded border border-slate-200/10 dark:border-slate-800/10">
                    <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-slate-500 truncate" title={bridge.notes}>
                      {bridge.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            {isEngineer && (
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-industrial-800/50 flex justify-end gap-2">
                <button
                  onClick={() => handleOpenModal(bridge)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-industrial-800 rounded text-slate-500 hover:text-cyan-500 transition-colors"
                  title="Modify Bridge Parameters"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(bridge.id)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-industrial-855 rounded text-slate-500 hover:text-rose-500 transition-colors"
                    title="Remove Bridge Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Create / Edit Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCloseModal} />

          {/* Dialog Panel */}
          <div className="glass-panel w-full max-w-2xl border border-slate-200/50 dark:border-industrial-800 rounded-2xl shadow-2xl relative z-10 overflow-hidden fade-in-slide">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-100 dark:bg-industrial-950/70 border-b border-slate-200/50 dark:border-industrial-800/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                  {editingBridge ? 'Edit Bridge Parameters' : 'Register New Bridge structure'}
                </h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                  Static details database entry
                </p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-industrial-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {formError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-500 text-xs flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Bridge Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Golden Gate Bridge"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Unique Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. GGB-001"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Region *</label>
                  <input
                    type="text"
                    required
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. West Coast"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">District *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Marin County"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Latitude *</label>
                  <input
                    type="text"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g. 37.819928"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Longitude *</label>
                  <input
                    type="text"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g. -122.47825"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Construction Year *</label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g. 1937"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Bridge Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Suspension">Suspension</option>
                    <option value="Cable-stayed">Cable-stayed</option>
                    <option value="Arch">Arch</option>
                    <option value="Truss">Truss</option>
                    <option value="Beam">Beam</option>
                    <option value="Cantilever">Cantilever</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Length (meters) *</label>
                  <input
                    type="text"
                    required
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="e.g. 2737.40"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Width (meters) *</label>
                  <input
                    type="text"
                    required
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="e.g. 27.40"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Engineering Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record structural materials, concrete quality, anchor notes..."
                  rows={3}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/30 dark:border-industrial-800/40">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-200 dark:border-industrial-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-industrial-800 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 shadow shadow-cyan-500/10"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBridge ? 'Save Updates' : 'Register Entry'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default Bridges;
