import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { analyticsAPI, assetsAPI, BACKEND_URL } from '../services/api';
import Layout from '../components/Layout';
import { useEventStream } from '../hooks/useEventStream';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const MAX_FEED = 50;
const DEVICE_COLORS = { mobile: '#6366f1', desktop: '#22c55e', tablet: '#f59e0b', unknown: '#94a3b8' };

// ─── small helpers ────────────────────────────────────────────────────────────
function CopyField({ value, copyKey, copied, onCopy }) {
  return (
    <div style={styles.copyBox}>
      <code style={styles.copyCode}>{value}</code>
      <button
        style={copied === copyKey ? { ...styles.copyBtn, ...styles.copyBtnDone } : styles.copyBtn}
        onClick={() => onCopy(value, copyKey)}
      >
        {copied === copyKey ? '✓' : 'Copy'}
      </button>
    </div>
  );
}

function StatCard({ label, value, accent, live }) {
  return (
    <div style={{ ...styles.statCard, ...(accent ? styles.statCardAccent : {}) }}>
      <span style={styles.statLabel}>{label}</span>
      <span style={styles.statValue}>
        {value}
        {live && <span style={styles.livePulse} />}
      </span>
    </div>
  );
}

function SectionCard({ title, icon, children, style, headerRight }) {
  return (
    <div style={{ ...styles.card, ...style }}>
      <div style={styles.cardHeader}>
        {icon && <span style={styles.cardIcon}>{icon}</span>}
        <h3 style={styles.cardTitle}>{title}</h3>
        {headerRight && <div style={{ marginLeft: 'auto' }}>{headerRight}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function AssetDetail() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveCount, setLiveCount] = useState(null);
  const [feed, setFeed] = useState([]);
  const [copied, setCopied] = useState('');

  const handleEvent = useCallback((data) => {
    if (data.asset_id !== id) return;
    setLiveCount(data.total_views);
    setFeed((prev) => [data, ...prev].slice(0, MAX_FEED));
  }, [id]);
  useEventStream(handleEvent);

  useEffect(() => {
    async function load() {
      try {
        const [assetRes, statsRes] = await Promise.all([
          assetsAPI.get(id),
          analyticsAPI.get(id),
        ]);
        setAsset(assetRes.data);
        setStats(statsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load asset');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function copy(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  async function togglePublicAnalytics() {
    try {
      const res = await assetsAPI.togglePublicAnalytics(id);
      setAsset((prev) => ({ ...prev, public_analytics_enabled: res.data.public_analytics_enabled }));
    } catch (err) {
      console.error('Toggle failed', err);
    }
  }

  function trackingUrl() {
    if (!asset) return '';
    if (asset.type === 'pixel') return `${BACKEND_URL}/p/${asset.tracking_id}.png`;
    if (asset.type === 'link') return `${BACKEND_URL}/l/${asset.tracking_id}`;
    return `${BACKEND_URL}/d/${asset.tracking_id}`;
  }

  function pixelEmbed() {
    return `<img src="${BACKEND_URL}/p/${asset.tracking_id}.png" width="1" height="1" />`;
  }

  function badgeEmbed() {
    return `<img src="${BACKEND_URL}/badge/${asset.tracking_id}" alt="Views" />`;
  }

  function publicUrl() {
    return `${window.location.origin}/public/${asset.tracking_id}`;
  }

  function qrUrl() {
    return `${BACKEND_URL}/qr/${asset.tracking_id}`;
  }

  async function downloadQR() {
    const res = await fetch(qrUrl());
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${asset.tracking_id}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const deviceData = stats?.device_breakdown?.map((d) => ({
    name: d.device || 'unknown',
    value: d.count,
  })) || [];

  const typeColor = { pixel: '#8b5cf6', link: '#6366f1', file: '#22c55e' };

  return (
    <Layout>
      <Helmet>
        <title>{asset ? `${asset.name} — TrackLayer` : 'Asset — TrackLayer'}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* ── Page header ── */}
      <div style={styles.pageHeader}>
        <div style={styles.pageHeaderLeft}>
          <Link to="/assets" style={styles.backBtn}>← Back</Link>
          <div>
            <div style={styles.pageTitleRow}>
              <h1 style={styles.pageTitle}>{asset ? asset.name : 'Asset'}</h1>
              {asset && (
                <span style={{ ...styles.typePill, background: (typeColor[asset.type] || '#6366f1') + '22', color: typeColor[asset.type] || '#6366f1' }}>
                  {asset.type}
                </span>
              )}
            </div>
            {asset && (
              <p style={styles.pageSubtitle}>
                ID: <code style={styles.inlineCode}>{asset.tracking_id}</code>
                {asset.expires_at && (
                  <span style={styles.expiryBadge}>⏱ Expires {new Date(asset.expires_at).toLocaleDateString()}</span>
                )}
                {asset.max_clicks != null && (
                  <span style={styles.expiryBadge}>🔒 Max {asset.max_clicks} clicks</span>
                )}
              </p>
            )}
          </div>
        </div>
        <div style={styles.livePill}>
          <span style={styles.liveDot} />
          Live
        </div>
      </div>

      {loading && <div style={styles.loading}>Loading…</div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      {!loading && !error && asset && (
        <>
          {/* ── Top grid: embed tools left, QR right ── */}
          <div style={styles.topGrid}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <SectionCard
                title={
                  asset.type === 'pixel' ? 'Pixel URL' :
                  asset.type === 'link'  ? 'Tracking Link' :
                                          'Download Link'
                }
                icon="🔗"
              >
                <CopyField value={trackingUrl()} copyKey="link" copied={copied} onCopy={copy} />
                <p style={styles.metaLine}>
                  {asset.type === 'pixel' && 'Direct URL for the 1×1 tracking pixel image.'}
                  {asset.type === 'link'  && 'Share this link — every click is tracked and redirected to your target.'}
                  {asset.type === 'file'  && 'Share this link — every download is logged with device & location.'}
                </p>
                {asset.type === 'link' && (
                  <p style={styles.metaLine}>Target → <a href={asset.target_url} target="_blank" rel="noreferrer" style={styles.metaLink}>{asset.target_url}</a></p>
                )}
                {asset.type === 'file' && (
                  <p style={styles.metaLine}>
                    File →{' '}
                    <a href={asset.file_url} target="_blank" rel="noreferrer" style={styles.metaLinkBlock}>
                      {asset.file_url}
                    </a>
                  </p>
                )}
              </SectionCard>

              {asset.type === 'pixel' && (
                <SectionCard title="Pixel Embed" icon="📌">
                  <CopyField value={pixelEmbed()} copyKey="pixel" copied={copied} onCopy={copy} />
                  <p style={styles.metaLine}>Invisible 1×1 pixel — paste in any HTML email or page.</p>
                </SectionCard>
              )}

              <SectionCard title="Badge Embed" icon="🏷️">
                <div style={styles.badgePreviewRow}>
                  <img
                    src={`${BACKEND_URL}/badge/${asset.tracking_id}?t=${Date.now()}`}
                    alt="Views badge"
                    style={styles.badgeImg}
                  />
                  <span style={styles.badgeHint}>Live count — updates on every view</span>
                </div>
                <CopyField value={badgeEmbed()} copyKey="badge" copied={copied} onCopy={copy} />
              </SectionCard>

              <SectionCard
                title="Public Analytics Page"
                icon="📊"
                headerRight={
                  <label style={styles.switchLabel} title={asset.public_analytics_enabled ? 'Disable public analytics' : 'Enable public analytics'}>
                    <input
                      type="checkbox"
                      checked={!!asset.public_analytics_enabled}
                      onChange={togglePublicAnalytics}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      ...styles.switchTrack,
                      background: asset.public_analytics_enabled ? '#22c55e' : 'rgba(255,255,255,.12)',
                    }}>
                      <span style={{
                        ...styles.switchThumb,
                        transform: asset.public_analytics_enabled ? 'translateX(18px)' : 'translateX(2px)',
                      }} />
                    </span>
                    <span style={{ fontSize: 11, color: asset.public_analytics_enabled ? '#4ade80' : '#64748b', fontWeight: 600 }}>
                      {asset.public_analytics_enabled ? 'On' : 'Off'}
                    </span>
                  </label>
                }
              >
                {asset.public_analytics_enabled ? (
                  <>
                    <CopyField value={publicUrl()} copyKey="public" copied={copied} onCopy={copy} />
                    <a href={publicUrl()} target="_blank" rel="noreferrer" style={styles.openLink}>Open public page →</a>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>Public analytics page is disabled. Enable it to share a public view of your stats.</p>
                )}
              </SectionCard>

            </div>

            {/* QR card */}
            <SectionCard title="QR Code" icon="◼" style={styles.qrCard}>
              <div style={styles.qrWrapper}>
                <img src={qrUrl()} alt="QR code" style={styles.qrImage} />
              </div>
              <p style={{ ...styles.metaLine, textAlign: 'center', marginTop: 10 }}>Scans to tracking URL</p>
              <button style={styles.downloadBtn} onClick={downloadQR}>↓ Download PNG</button>
            </SectionCard>
          </div>

          {/* ── Stats row ── */}
          {stats && (
            <div style={styles.statsRow}>
              <StatCard label="Total Views" value={liveCount ?? stats.total_views} accent live={liveCount !== null} />
              <StatCard label="Unique Visitors (today)" value={stats.unique_visitors} />
              <StatCard label="Countries" value={stats.countries?.length ?? 0} />
              <StatCard label="Devices tracked" value={deviceData.reduce((s, d) => s + d.value, 0)} />
            </div>
          )}

          {/* ── Charts ── */}
          {stats && (
            <>
              {stats.daily_views?.length > 0 && (
                <SectionCard title="Daily Views — last 30 days" icon="📈" style={{ marginBottom: 16 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={stats.daily_views}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={styles.tooltipStyle} />
                      <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </SectionCard>
              )}

              <div style={styles.chartsGrid}>
                {stats.countries?.length > 0 && (
                  <SectionCard title="Countries" icon="🌍">
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={stats.countries} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis type="category" dataKey="country" width={55} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={styles.tooltipStyle} />
                        <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </SectionCard>
                )}

                {deviceData.length > 0 && (
                  <SectionCard title="Devices" icon="📱">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                      <PieChart width={150} height={150}>
                        <Pie data={deviceData} cx={70} cy={70} innerRadius={36} outerRadius={60} dataKey="value" paddingAngle={3}>
                          {deviceData.map((entry, i) => (
                            <Cell key={i} fill={DEVICE_COLORS[entry.name] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={styles.tooltipStyle} />
                      </PieChart>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {deviceData.map((d, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: DEVICE_COLORS[d.name] || '#94a3b8', flexShrink: 0 }} />
                            <span style={{ textTransform: 'capitalize', color: '#e2e8f0' }}>{d.name}</span>
                            <span style={{ color: '#94a3b8', marginLeft: 'auto', paddingLeft: 12 }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SectionCard>
                )}

                {stats.top_referrers?.length > 0 && (
                  <SectionCard title="Top Referrers" icon="🔀">
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Referrer</th>
                          <th style={{ ...styles.th, textAlign: 'right' }}>Views</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.top_referrers.map((r, i) => (
                          <tr key={i}>
                            <td style={styles.td}><span style={styles.truncate}>{r.referrer}</span></td>
                            <td style={{ ...styles.td, textAlign: 'right', color: '#6366f1', fontWeight: 600 }}>{r.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </SectionCard>
                )}
              </div>
            </>
          )}

          {/* ── Live feed ── */}
          <SectionCard title={`Live Activity Feed${feed.length > 0 ? ` (${feed.length})` : ''}`} icon="⚡" style={{ marginTop: 4 }}>
            {feed.length === 0 ? (
              <p style={{ color: '#475569', padding: '8px 0', margin: 0 }}>Waiting for events…</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Time', 'IP', 'Country', 'Device', 'Referrer'].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {feed.map((ev, i) => (
                      <tr key={i} style={i === 0 ? styles.flashRow : {}}>
                        <td style={{ ...styles.td, whiteSpace: 'nowrap', color: '#94a3b8', fontSize: 12 }}>{new Date(ev.timestamp).toLocaleTimeString()}</td>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>{ev.ip || '—'}</td>
                        <td style={styles.td}>{ev.country || <span style={{ color: '#475569' }}>Local</span>}</td>
                        <td style={{ ...styles.td, textTransform: 'capitalize' }}>{ev.device_type || '—'}</td>
                        <td style={{ ...styles.td, color: '#64748b', fontSize: 12 }}><span style={styles.truncate}>{ev.referrer || '—'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </Layout>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = {
  pageHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  pageHeaderLeft: { display: 'flex', gap: 16, alignItems: 'flex-start' },
  backBtn: { display: 'inline-flex', alignItems: 'center', padding: '6px 14px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#94a3b8', textDecoration: 'none', fontSize: 13, whiteSpace: 'nowrap', marginTop: 4 },
  pageTitleRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  pageTitle: { margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9' },
  typePill: { fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '.04em' },
  pageSubtitle: { margin: 0, fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  inlineCode: { background: 'rgba(255,255,255,.07)', padding: '1px 6px', borderRadius: 4, fontSize: 12, color: '#94a3b8' },
  expiryBadge: { background: 'rgba(245,158,11,.12)', color: '#f59e0b', fontSize: 11, padding: '2px 8px', borderRadius: 99 },
  livePill: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)', color: '#22c55e', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 600 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,.25)' },
  loading: { color: '#64748b', padding: '40px 0', textAlign: 'center' },
  errorBox: { background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)', color: '#f87171', padding: '14px 18px', borderRadius: 10 },
  topGrid: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 196px', gap: 16, marginBottom: 16, alignItems: 'start' },
  card: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 18px' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 },
  cardIcon: { fontSize: 14 },
  cardTitle: { margin: 0, fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em' },
  copyBox: { display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 7, overflow: 'hidden' },
  copyCode: { flex: 1, padding: '8px 12px', fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },
  copyBtn: { padding: '8px 14px', background: 'rgba(99,102,241,.18)', color: '#818cf8', border: 'none', borderLeft: '1px solid rgba(255,255,255,.08)', cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' },
  copyBtnDone: { background: 'rgba(34,197,94,.18)', color: '#4ade80' },
  metaLine: { margin: '8px 0 0', fontSize: 12, color: '#64748b' },
  metaLink: { color: '#6366f1', textDecoration: 'none' },
  metaLinkBlock: { color: '#6366f1', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' },
  openLink: { display: 'inline-block', marginTop: 8, fontSize: 13, color: '#6366f1', textDecoration: 'none', fontWeight: 600 },
  badgePreviewRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' },
  badgeImg: { height: 20, display: 'block' },
  badgeHint: { fontSize: 11, color: '#475569' },
  qrCard: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  qrWrapper: { width: 152, height: 152, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, border: '1px solid rgba(255,255,255,.1)' },
  qrImage: { width: '100%', height: '100%', borderRadius: 6, display: 'block' },
  downloadBtn: { width: '100%', marginTop: 10, padding: '8px 0', background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.3)', color: '#818cf8', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  switchLabel: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none', position: 'relative' },
  switchTrack: { position: 'relative', display: 'inline-block', width: 38, height: 22, borderRadius: 99, transition: 'background .2s', flexShrink: 0 },
  switchThumb: { position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'transform .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 },
  statCard: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 },
  statCardAccent: { background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.25)' },
  statLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' },
  statValue: { fontSize: 28, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6 },
  livePulse: { width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,.2)' },
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 },
  tooltipStyle: { background: '#1e2130', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#e2e8f0', fontSize: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { padding: '8px 10px', textAlign: 'left', color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid rgba(255,255,255,.07)' },
  td: { padding: '9px 10px', borderBottom: '1px solid rgba(255,255,255,.04)', color: '#cbd5e1', maxWidth: 220 },
  truncate: { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  flashRow: { background: 'rgba(99,102,241,.08)' },
};
