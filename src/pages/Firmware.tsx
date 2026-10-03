import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, RefreshCw, Upload, X } from 'lucide-react';
import api from '../services/api';

type Release = {
  id: number; device_model: string; version: string; minimum_firmware: string;
  image_size: number; image_sha256: string; release_notes: string | null;
  status: string; created_by_name?: string; published_by_name?: string;
  created_at: string; published_at: string | null;
};
type Device = { device_id: string; device_name: string };
const MAX_BYTES = 1310720;

export default function Firmware() {
  const qc = useQueryClient();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState('');
  const [version, setVersion] = useState('');
  const [minimum, setMinimum] = useState('');
  const [notes, setNotes] = useState('');
  const releases = useQuery({ queryKey: ['firmware-releases'], queryFn: async () => (await api.get('/firmware')).data.data as Release[] });
  const devices = useQuery({ queryKey: ['firmware-devices'], queryFn: async () => (await api.get('/devices')).data.data as Device[] });
  const refresh = () => qc.invalidateQueries({ queryKey: ['firmware-releases'] });
  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Choose a .bin file first.');
      const data = new FormData(); data.append('file', file); data.append('device_model', model);
      data.append('version', version); data.append('minimum_firmware', minimum); data.append('release_notes', notes);
      return api.post('/firmware/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }, onSuccess: () => { setMessage('Artifact uploaded as a draft.'); setError(''); setFile(null); refresh(); },
    onError: (e: any) => { setError(e.response?.data?.message || e.message || 'Upload failed.'); setMessage(''); },
  });
  const action = useMutation({
    mutationFn: ({ id, name }: { id: number; name: 'publish' | 'unpublish' | 'delete' }) =>
      name === 'delete' ? api.delete(`/firmware/${id}`) : api.post(`/firmware/${id}/${name}`),
    onSuccess: () => { setMessage('Release updated.'); setError(''); refresh(); },
    onError: (e: any) => { setError(e.response?.data?.message || 'Release action failed.'); setMessage(''); },
  });
  const submit = (e: React.FormEvent) => { e.preventDefault(); setMessage(''); setError(''); upload.mutate(); };
  const className = 'w-full rounded-lg border border-slate-300 dark:border-industrial-800 bg-white dark:bg-industrial-950 px-3 py-2 text-sm text-slate-800 dark:text-slate-100';

  return <div className="space-y-6">
    <header><h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Firmware Releases</h2><p className="mt-1 text-sm text-slate-500">Upload, publish, and inspect ESP32 firmware artifacts.</p></header>
    {(message || error) && <div role="status" className={`rounded-lg border p-3 text-sm ${error ? 'border-rose-500/30 bg-rose-500/10 text-rose-500' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'}`}>{error || message}</div>}
    <form onSubmit={submit} className="glass-panel grid grid-cols-1 gap-4 rounded-xl border border-slate-200/50 p-5 dark:border-industrial-800/80 md:grid-cols-2">
      <h3 className="md:col-span-2 text-lg font-semibold">Upload release draft</h3>
      <label className="space-y-1 text-xs font-semibold">Device / model
        <select required value={model} onChange={e => setModel(e.target.value)} className={className}><option value="">Select registered device</option>{(devices.data || []).map(d => <option key={d.device_id} value={d.device_id}>{d.device_id} â€” {d.device_name}</option>)}</select>
      </label>
      <label className="space-y-1 text-xs font-semibold">Firmware .bin (max 1,310,720 bytes)
        <input required type="file" accept=".bin,application/octet-stream" onChange={e => setFile(e.target.files?.[0] || null)} className={className} />
        {file && <span className="block text-slate-500">{file.name} Â· {file.size.toLocaleString()} bytes</span>}
      </label>
      <label className="space-y-1 text-xs font-semibold">Version (MAJOR.MINOR.PATCH)<input required pattern="(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)" value={version} onChange={e => setVersion(e.target.value)} placeholder="1.4.2" className={className} /></label>
      <label className="space-y-1 text-xs font-semibold">Minimum supported firmware<input required pattern="(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)" value={minimum} onChange={e => setMinimum(e.target.value)} placeholder="1.0.0" className={className} /></label>
      <label className="space-y-1 text-xs font-semibold md:col-span-2">Release notes<textarea rows={3} maxLength={5000} value={notes} onChange={e => setNotes(e.target.value)} className={className} /></label>
      <div className="md:col-span-2 flex items-center justify-between"><span className="text-xs text-slate-500">{file && file.size > MAX_BYTES ? 'Selected file exceeds the server limit.' : 'SHA-256 and size are computed from stored bytes.'}</span><button disabled={upload.isPending || !file || file.size < 1 || file.size > MAX_BYTES} className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Upload size={16} />{upload.isPending ? 'Uploadingâ€¦' : 'Upload draft'}</button></div>
    </form>
    <section className="overflow-x-auto rounded-xl border border-slate-200/50 dark:border-industrial-800/80"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase dark:bg-industrial-950"><tr>{['Model', 'Version', 'Minimum', 'Image', 'Status', 'Audit', 'Actions'].map(h => <th key={h} className="whitespace-nowrap px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-200 dark:divide-industrial-800">{(releases.data || []).map(r => <tr key={r.id} className="align-top"><td className="px-4 py-3 font-mono">{r.device_model}</td><td className="px-4 py-3">{r.version}</td><td className="px-4 py-3">{r.minimum_firmware}</td><td className="px-4 py-3"><div>{Number(r.image_size).toLocaleString()} bytes</div><code className="text-[10px] text-slate-500">{r.image_sha256}</code></td><td className="px-4 py-3 capitalize">{r.status}</td><td className="px-4 py-3 text-xs">Created by {r.created_by_name || 'account'}<br />{new Date(r.created_at).toLocaleString()}{r.published_at && <><br />Published by {r.published_by_name || 'account'}<br />{new Date(r.published_at).toLocaleString()}</>}</td><td className="px-4 py-3"><div className="flex gap-2">{r.status !== 'published' ? <button title="Publish release" onClick={() => action.mutate({ id: r.id, name: 'publish' })} className="rounded p-1 text-emerald-600"><Check size={16} /></button> : <button title="Unpublish" onClick={() => action.mutate({ id: r.id, name: 'unpublish' })} className="rounded p-1 text-amber-600"><RefreshCw size={16} /></button>}{r.status !== 'published' && <button title="Delete draft" onClick={() => { if (confirm('Delete this release and its stored artifact?')) action.mutate({ id: r.id, name: 'delete' }); }} className="rounded p-1 text-rose-500"><X size={16} /></button>}</div></td></tr>)}{!releases.isLoading && releases.data?.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No releases yet.</td></tr>}</tbody></table></section>
  </div>;
}
