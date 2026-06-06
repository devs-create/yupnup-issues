'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Profile, Ticket, Priority, Platform, TicketStatus } from '@/types';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/lib/utils';

interface Props {
  members: Pick<Profile, 'id' | 'full_name' | 'email'>[];
  ticket?: Ticket;
}

export default function TicketForm({ members, ticket }: Props) {
  const router = useRouter();
  const isEdit = !!ticket;

  const [form, setForm] = useState({
    title: ticket?.title || '',
    description: ticket?.description || '',
    priority: ticket?.priority || 'medium' as Priority,
    platform: ticket?.platform || 'web' as Platform,
    reporter_name: ticket?.reporter_name || '',
    reporter_email: ticket?.reporter_email || '',
    assigned_to: ticket?.assigned_to || '',
    trading_market: ticket?.trading_market || '',
    tags: ticket?.tags?.join(', ') || '',
    status: ticket?.status || 'open' as TicketStatus,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => [...prev, ...accepted].slice(0, 5));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.description || !form.reporter_name || !form.reporter_email) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      files.forEach(f => formData.append('screenshots', f));
      if (isEdit) formData.append('id', ticket!.id);

      const res = await fetch(isEdit ? `/api/tickets/${ticket!.id}` : '/api/tickets', {
        method: isEdit ? 'PATCH' : 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save ticket');

      toast.success(isEdit ? 'Ticket updated!' : 'Ticket created!');
      router.push(`/dashboard/tickets/${data.ticket.id}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 border-b border-[#2d3142] pb-3">Issue Details</h2>

        <div>
          <label className="label">Issue Title *</label>
          <input name="title" value={form.title} onChange={handleChange} className="input" placeholder="Brief description of the issue" required />
        </div>

        <div>
          <label className="label">Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="textarea" rows={5} placeholder="Detailed description, steps to reproduce, expected vs actual behavior..." required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Priority *</label>
            <select name="priority" value={form.priority} onChange={handleChange} className="select">
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Platform *</label>
            <select name="platform" value={form.platform} onChange={handleChange} className="select">
              <option value="web">🌐 Web</option>
              <option value="android">🤖 Android</option>
              <option value="ios">🍎 iOS</option>
            </select>
          </div>
        </div>

        {isEdit && (
          <div>
            <label className="label">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="select">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Reporter */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 border-b border-[#2d3142] pb-3">Reporter Info</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Reporter Name *</label>
            <input name="reporter_name" value={form.reporter_name} onChange={handleChange} className="input" placeholder="John Doe" required />
          </div>
          <div>
            <label className="label">Reporter Email *</label>
            <input name="reporter_email" type="email" value={form.reporter_email} onChange={handleChange} className="input" placeholder="user@example.com" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Assigned To</label>
            <select name="assigned_to" value={form.assigned_to} onChange={handleChange} className="select">
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Trading Market Affected</label>
            <input name="trading_market" value={form.trading_market} onChange={handleChange} className="input" placeholder="e.g. NSE, BSE, Crypto" />
          </div>
        </div>

        <div>
          <label className="label">Tags</label>
          <input name="tags" value={form.tags} onChange={handleChange} className="input" placeholder="login, payment, crash (comma-separated)" />
          <p className="text-xs text-slate-500 mt-1">Separate with commas</p>
        </div>
      </div>

      {/* Screenshots */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-300 border-b border-[#2d3142] pb-3 mb-4">Screenshots</h2>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-sky-500 bg-sky-500/5' : 'border-[#2d3142] hover:border-slate-500 hover:bg-[#1e2130]'
          }`}
        >
          <input {...getInputProps()} />
          <svg className="w-8 h-8 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-slate-400">{isDragActive ? 'Drop screenshots here...' : 'Drag & drop screenshots, or click to select'}</p>
          <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 5MB · Max 5 files</p>
        </div>

        {files.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {files.map((file, i) => (
              <div key={i} className="relative group">
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-20 h-20 object-cover rounded-lg border border-[#2d3142]" />
                <button
                  type="button"
                  onClick={() => setFiles(f => f.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >×</button>
                <p className="text-[10px] text-slate-500 truncate w-20 mt-0.5">{file.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {isEdit ? 'Updating...' : 'Creating...'}
            </span>
          ) : (isEdit ? 'Update Ticket' : 'Create Ticket')}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary px-6">
          Cancel
        </button>
      </div>
    </form>
  );
}
