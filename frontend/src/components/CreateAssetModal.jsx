import { useState } from 'react';
import { assetsAPI } from '../services/api';

const TYPE_OPTIONS = [
  { value: 'pixel', label: 'Pixel',  desc: '1×1 tracking image',   color: '#8b5cf6' },
  { value: 'link',  label: 'Link',   desc: 'Tracked redirect URL', color: '#6366f1' },
  { value: 'file',  label: 'File',   desc: 'Tracked file download', color: '#22c55e' },
];

export default function CreateAssetModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', type: 'pixel', target_url: '', expires_at: '', max_clicks: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (form.type === 'file') {
        if (!file) { setError('Please select a file'); setLoading(false); return; }
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('file', file);
        if (form.expires_at) fd.append('expires_at', form.expires_at);
        if (form.max_clicks) fd.append('max_clicks', form.max_clicks);
        res = await assetsAPI.upload(fd);
      } else {
        res = await assetsAPI.create({
          name: form.name,
          type: form.type,
          target_url: form.type === 'link' ? form.target_url : undefined,
          expires_at: form.expires_at || undefined,
          max_clicks: form.max_clicks || undefined,
        });
      }
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <h3 style={s.title}>New Asset</h3>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Asset Name</label>
            <input
              style={s.input}
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Email Campaign Pixel"
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Type</label>
            <div style={s.typeRow}>
              {TYPE_OPTIONS.map((t) => {
                const active = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    style={{
                      ...s.typeCard,
                      borderColor: active ? t.color : 'rgba(255,255,255,.09)',
                      background: active ? `${t.color}18` : 'rgba(255,255,255,.03)',
                    }}
                    onClick={() => setForm({ ...form, type: t.value, target_url: '' })}
                  >
                    <span style={{ ...s.typeDot, background: t.color }} />
                    <span style={{ ...s.typeLabel, color: active ? '#f1f5f9' : '#94a3b8' }}>{t.label}</span>
                    <span style={s.typeDesc}>{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {form.type === 'link' && (
            <div style={s.field}>
              <label style={s.label}>Target URL</label>
              <input
                style={s.input}
                type="url"
                value={form.target_url}
                onChange={(e) => setForm({ ...form, target_url: e.target.value })}
                required
                placeholder="https://example.com"
              />
            </div>
          )}

          {form.type === 'file' && (
            <div style={s.field}>
              <label style={s.label}>File</label>
              <label style={s.fileBox}>
                <input type="file" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
                <span style={{ fontSize: 13, color: file ? '#e2e8f0' : '#475569', flex: 1 }}>
                  {file ? file.name : 'Click to choose a file'}
                </span>
                {file
                  ? <span style={s.fileClearBtn} onClick={(e) => { e.preventDefault(); setFile(null); }}>✕</span>
                  : <span style={s.fileBrowseBtn}>Browse</span>
                }
              </label>
            </div>
          )}

          <div style={s.optRow}>
            <div style={s.optField}>
              <label style={s.label}>Expires At <span style={s.optional}>(optional)</span></label>
              <input style={s.input} type="datetime-local" value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
            <div style={s.optField}>
              <label style={s.label}>Max Clicks <span style={s.optional}>(optional)</span></label>
              <input style={s.input} type="number" min="1" value={form.max_clicks}
                onChange={(e) => setForm({ ...form, max_clicks: e.target.value })} placeholder="Unlimited" />
            </div>
          </div>

          <div style={s.footer}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={{ ...s.createBtn, opacity: loading ? .6 : 1 }} disabled={loading}>
              {loading ? 'Creating…' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
  },
  modal: {
    background: '#111318', border: '1px solid rgba(255,255,255,.09)', borderRadius: 14,
    width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
    padding: '22px 22px 18px', boxShadow: '0 24px 80px rgba(0,0,0,.6)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { margin: 0, fontSize: 17, fontWeight: 700, color: '#f1f5f9' },
  closeBtn: {
    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.09)',
    color: '#64748b', borderRadius: 7, width: 30, height: 30, fontSize: 17,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  errorBox: {
    background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)',
    color: '#f87171', padding: '9px 13px', borderRadius: 8, fontSize: 13, marginBottom: 14,
  },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 7 },
  optional: { fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#475569' },
  input: {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)',
    borderRadius: 8, padding: '9px 11px', fontSize: 13, color: '#e2e8f0', outline: 'none',
  },
  typeRow: { display: 'flex', gap: 8 },
  typeCard: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    padding: '13px 8px 11px', borderRadius: 9, cursor: 'pointer',
    border: '1px solid', transition: 'border-color .15s, background .15s',
  },
  typeDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  typeLabel: { fontSize: 13, fontWeight: 600 },
  typeDesc: { fontSize: 11, color: '#475569', textAlign: 'center', lineHeight: 1.35 },
  fileBox: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,.04)', border: '1px dashed rgba(255,255,255,.12)',
    borderRadius: 8, padding: '10px 12px', cursor: 'pointer',
  },
  fileBrowseBtn: {
    fontSize: 12, fontWeight: 600, color: '#818cf8',
    background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.25)',
    borderRadius: 6, padding: '3px 10px', flexShrink: 0,
  },
  fileClearBtn: { fontSize: 12, color: '#64748b', cursor: 'pointer', padding: '3px 8px', flexShrink: 0 },
  optRow: { display: 'flex', gap: 10, marginBottom: 18 },
  optField: { flex: 1, minWidth: 0 },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 9 },
  cancelBtn: {
    padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', color: '#64748b',
  },
  createBtn: {
    padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    background: '#6366f1', border: 'none', color: '#fff',
  },
};
