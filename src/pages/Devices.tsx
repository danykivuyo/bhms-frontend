import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Cpu, 
  Layers, 
  Search, 
  MapPin, 
  Info, 
  X, 
  Check, 
  AlertTriangle,
  FolderSync
} from 'lucide-react';

interface Device {
  id: number;
  device_id: string;
  device_name: string;
  bridge_id: number;
  bridge_name: string;
  bridge_code: string;
  location: string;
  latitude: number;
  longitude: number;
  installation_date: string;
  firmware_version: string;
  status: 'online' | 'offline';
}

interface Bridge {
  id: number;
  bridge_name: string;
  bridge_code: string;
}

export const Devices: React.FC = () => {
  const { isEngineer, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Lists
  const [bridges, setBridges] = useState<Bridge[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  // Form fields
  const [devId, setDevId] = useState('');
  const [name, setName] = useState('');
  const [bridgeId, setBridgeId] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [installDate, setInstallDate] = useState('');
  const [firmware, setFirmware] = useState('');
  const [status, setStatus] = useState<'online' | 'offline'>('offline');

  const [formError, setFormError] = useState<string | null>(null);

  // Query: Fetch all devices
  const { data: devices = [], isLoading } = useQuery<Device[]>({
    queryKey: ['devices-list'],
    queryFn: async () => {
      const res = await api.get('/devices');
      return res.data.data;
    }
  });

  // Fetch bridges list for form dropdown selection
  useEffect(() => {
    const fetchBridges = async () => {
      try {
        const res = await api.get('/bridges');
        if (res.data.status === 'success') {
          setBridges(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load bridges options", err);
      }
    };
    fetchBridges();
  }, []);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newDevice: any) => api.post('/devices', newDevice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices-list'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to register device.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updated }: { id: number, updated: any }) => api.put(`/devices/${id}`, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices-list'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || "Failed to update device.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/devices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices-list'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to delete device.");
    }
  });

  const handleOpenModal = (device: Device | null = null) => {
    setFormError(null);
    if (device) {
      setEditingDevice(device);
      setDevId(device.device_id);
      setName(device.device_name);
      setBridgeId(device.bridge_id.toString());
      setLocation(device.location || '');
      setLatitude(device.latitude.toString());
      setLongitude(device.longitude.toString());
      setInstallDate(device.installation_date);
      setFirmware(device.firmware_version);
      setStatus(device.status);
    } else {
      setEditingDevice(null);
      setDevId('');
      setName('');
      setBridgeId(bridges[0]?.id.toString() || '');
      setLocation('');
      setLatitude('');
      setLongitude('');
      setInstallDate(new Date().toISOString().split('T')[0]);
      setFirmware('v1.0.0');
      setStatus('offline');
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingDevice(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      device_id: devId,
      device_name: name,
      bridge_id: parseInt(bridgeId),
      location,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      installation_date: installDate,
      firmware_version: firmware,
      status
    };

    // Validations
    if (isNaN(payload.bridge_id)) {
      setFormError("You must select a valid structural bridge destination.");
      return;
    }
    if (isNaN(payload.latitude) || isNaN(payload.longitude)) {
      setFormError("GPS Coordinates must be valid numeric values.");
      return;
    }

    if (editingDevice) {
      updateMutation.mutate({ id: editingDevice.id, updated: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to permanently delete this device? This will erase its diagnostic readings.")) {
      deleteMutation.mutate(id);
    }
  };

  // Filter device records based on search keywords
  const filteredDevices = devices.filter(d => 
    d.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.device_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.bridge_name && d.bridge_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/30 dark:border-industrial-800/40 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            IoT Monitoring Devices
          </h2>
          <p className="text-xs font-mono text-slate-400 dark:text-cyan-500/80 uppercase tracking-wider mt-0.5">
            Hardware Nodes Registry, Installation Mapping & Status
          </p>
        </div>

        {isEngineer && (
          <button
            onClick={() => handleOpenModal(null)}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-all shadow-md shadow-cyan-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add IoT Device</span>
          </button>
        )}
      </div>

      {/* Filter and search tools */}
      <div className="w-full max-w-md relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter devices by ID, name or bridge name..."
          className="w-full bg-white dark:bg-industrial-900 border border-slate-200 dark:border-industrial-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Loading animation */}
      {isLoading && (
        <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl overflow-hidden animate-pulse">
          <div className="h-10 bg-slate-200 dark:bg-industrial-900 border-b border-slate-200/50 dark:border-industrial-800" />
          <div className="p-4 space-y-4">
            <div className="h-4 bg-slate-300 dark:bg-industrial-800 rounded w-1/4" />
            <div className="h-4 bg-slate-300 dark:bg-industrial-800 rounded w-1/3" />
            <div className="h-4 bg-slate-300 dark:bg-industrial-800 rounded w-1/2" />
          </div>
        </div>
      )}

      {/* Empty states */}
      {!isLoading && filteredDevices.length === 0 && (
        <div className="glass-panel p-12 text-center border border-slate-200/40 dark:border-industrial-800/60 rounded-xl max-w-xl mx-auto">
          <FolderSync className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-md font-bold text-slate-700 dark:text-slate-300">No IoT Hardware Listed</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Create an entry to hook telemetry payloads or register active microcontrollers.
          </p>
        </div>
      )}

      {/* Device Table Grid */}
      {!isLoading && filteredDevices.length > 0 && (
        <div className="glass-panel border border-slate-200/50 dark:border-industrial-800/80 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-industrial-950/70 border-b border-slate-200 dark:border-industrial-850 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Device ID</th>
                  <th className="px-6 py-4">Device Name</th>
                  <th className="px-6 py-4">Assigned Bridge</th>
                  <th className="px-6 py-4">Location Context</th>
                  <th className="px-6 py-4">Firmware</th>
                  <th className="px-6 py-4">Install Date</th>
                  {isEngineer && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-industrial-850 text-slate-700 dark:text-slate-300 font-sans">
                {filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-100/30 dark:hover:bg-industrial-900/30 transition-colors duration-100">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${device.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`} />
                        <span className="text-xs font-semibold capitalize">{device.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/5 dark:bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/10">
                        {device.device_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                      {device.device_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{device.bridge_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{device.bridge_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{device.location || 'Not Specified'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                      {device.firmware_version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      {new Date(device.installation_date).toLocaleDateString()}
                    </td>
                    {isEngineer && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleOpenModal(device)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-industrial-800 rounded text-slate-500 hover:text-cyan-500 transition-colors"
                            title="Edit Device Params"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(device.id)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-industrial-855 rounded text-slate-500 hover:text-rose-500 transition-colors"
                              title="Delete Device"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCloseModal} />
          
          <div className="glass-panel w-full max-w-xl border border-slate-200/50 dark:border-industrial-800 rounded-2xl shadow-2xl relative z-10 overflow-hidden fade-in-slide">
            
            <div className="px-6 py-4 bg-slate-100 dark:bg-industrial-950/70 border-b border-slate-200/50 dark:border-industrial-800/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                  {editingDevice ? 'Modify IoT Device Params' : 'Register New IoT Device'}
                </h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                  Static properties definition
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-1.5 hover:bg-slate-200 dark:hover:bg-industrial-800 text-slate-500 dark:text-slate-400 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-500 text-xs flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Device ID / MAC *</label>
                  <input
                    type="text"
                    required
                    value={devId}
                    onChange={(e) => setDevId(e.target.value)}
                    placeholder="e.g. BR004"
                    disabled={!!editingDevice} // Prevent editing identifier once created
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Device Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mid-span vibration meter"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Assigned Bridge structure *</label>
                <select
                  required
                  value={bridgeId}
                  onChange={(e) => setBridgeId(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3 py-2 text-sm text-slate-750 dark:text-slate-250 focus:outline-none focus:border-cyan-500"
                >
                  <option value="" disabled>Choose a structural bridge...</option>
                  {bridges.map((b) => (
                    <option key={b.id} value={b.id}>{b.bridge_name} ({b.bridge_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Location Context (e.g. Pillar 3, Arch base)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Tower deck level 2"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Latitude *</label>
                  <input
                    type="text"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g. 37.81992"
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
                    placeholder="e.g. -122.4782"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Firmware Version *</label>
                  <input
                    type="text"
                    required
                    value={firmware}
                    onChange={(e) => setFirmware(e.target.value)}
                    placeholder="e.g. v1.2.0"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Install Date *</label>
                  <input
                    type="date"
                    required
                    value={installDate}
                    onChange={(e) => setInstallDate(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 tracking-wider mb-1 font-bold">Gateway Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>

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
                  <span>{editingDevice ? 'Save Updates' : 'Register Entry'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default Devices;
