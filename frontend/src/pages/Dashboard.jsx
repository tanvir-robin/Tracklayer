import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { assetsAPI, analyticsAPI } from '../services/api';
import Layout from '../components/Layout';
import { useEventStream } from '../hooks/useEventStream';
import CreateAssetModal from '../components/CreateAssetModal';
import {
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, LineChart, Line, Legend,
} from 'recharts';

const MAX_FEED = 100;
const ALL = '__all__';

const TYPE_COLOR = { pixel: '#8b5cf6', link: '#6366f1', file: '#22c55e' };
const CHART_PALETTE = ['#6366f1','#22c55e','#f59e0b','#ec4899','#06b6d4','#8b5cf6','#f87171','#34d399'];

function getBrowser(ua) {
  if (!ua) return null;
  if (/edg\//i.test(ua)) return 'Edge';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  if (/curl/i.test(ua)) return 'cURL';
  if (/bot|spider|crawl/i.test(ua)) return 'Bot';
  return 'Other';
}

function timeAgo(ts) {
  const sec = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

// Merge per-asset daily_views arrays into one array keyed by date
// Each entry: { date, Asset1Name: count, Asset2Name: count, ... }
function mergeAllDailyViews(statsMap, assets) {
  const dateMap = {};
  for (const asset of assets) {
    const s = statsMap[asset._id];
    if (!s?.daily_views) continue;
    for (const { date, count } of s.daily_views) {
      if (!dateMap[date]) dateMap[date] = { date };
      dateMap[date][asset.name] = (dateMap[date][asset.name] || 0) + count;
    }
  }
  return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
}

// Remove icon components — replaced with CSS classes

export default function Dashboard() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [selectedAssetId, setSelectedAssetId] = useState(ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveCounts, setLiveCounts] = useState({});
  const [feed, setFeed] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleEvent = useCallback((data) => {
    setLiveCounts((prev) => ({ ...prev, [data.asset_id]: data.total_views }));
    setFeed((prev) => [{ ...data, _live: true }, ...prev].slice(0, MAX_FEED));
  }, []);
  useEventStream(handleEvent);

  useEffect(() => {
    async function load() {
      try {
        const [assetsRes, countsRes, eventsRes] = await Promise.allSettled([
          assetsAPI.list(),
          analyticsAPI.getAllCounts(),
          analyticsAPI.getRecentEvents(),
        ]);

        const assetList = assetsRes.status === 'fulfilled' ? assetsRes.value.data : [];
        setAssets(assetList);

        if (countsRes.status === 'fulfilled') {
          const m = {};
          for (const c of countsRes.value.data) m[c.asset_id] = c.total_views;
          setLiveCounts(m);
        }

        if (eventsRes.status === 'fulfilled') setFeed(eventsRes.value.data);

        // Load analytics for ALL assets upfront for the combined view
        if (assetList.length > 0) {
          const results = await Promise.allSettled(assetList.map((a) => analyticsAPI.get(a._id)));
          const map = {};
          results.forEach((r, i) => {
            if (r.status === 'fulfilled') map[assetList[i]._id] = r.value.data;
          });
          setStatsMap(map);
        }

        if (assetsRes.status === 'rejected') {
          setError(assetsRes.reason?.response?.data?.message || assetsRes.reason?.message || 'Failed to load');
        }
      } catch (err) {
        setError(err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSelectAsset(id) {
    setSelectedAssetId(id);
    if (id === ALL || statsMap[id]) return; // already loaded
    setLoadingStats(true);
    try {
      const analytics = await analyticsAPI.get(id);
      setStatsMap((prev) => ({ ...prev, [id]: analytics.data }));
    } catch (_) {}
    finally { setLoadingStats(false); }
  }

  const totalLiveViews = useMemo(
    () => Object.values(liveCounts).reduce((a, b) => a + b, 0),
    [liveCounts],
  );

  const countrySet = useMemo(
    () => new Set(feed.filter((e) => e.country).map((e) => e.country)),
    [feed],
  );

  const pixelCount = assets.filter((a) => a.type === 'pixel').length;
  const linkCount = assets.filter((a) => a.type === 'link').length;

  const leaderboard = useMemo(() => {
    const sorted = [...assets].sort((a, b) => (liveCounts[b._id] || 0) - (liveCounts[a._id] || 0));
    const max = Math.max(1, liveCounts[sorted[0]?._id] || 0);
    return sorted.map((a) => ({
      ...a,
      views: liveCounts[a._id] || 0,
      pct: Math.round(((liveCounts[a._id] || 0) / max) * 100),
    }));
  }, [assets, liveCounts]);

  // Data for charts
  const stats = selectedAssetId === ALL ? null : statsMap[selectedAssetId];

  // All-assets total views bar chart data
  const allAssetsBarData = useMemo(
    () => leaderboard.map((a) => ({ name: a.name, views: a.views, type: a.type })),
    [leaderboard],
  );

  // Multi-line daily views chart data (all assets)
  const allDailyData = useMemo(
    () => mergeAllDailyViews(statsMap, assets),
    [statsMap, assets],
  );

  const barColor = (type) => TYPE_COLOR[type] || '#6366f1';

  return (
    <Layout>
      <Helmet>
        <title>Dashboard — TrackLayer</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* Header */}
      <div className="page-header dash-page-header">
        <div>
          <h2 className="dash-title">Dashboard</h2>
          <p className="dash-subtitle">Tracking overview &amp; live activity</p>
        </div>
        <div className="ph-right">
          <div className="live-dot-label"><span className="live-dot" />Live</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Asset</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-shimmer">
          {[1, 2, 3].map((n) => <div key={n} className="shimmer-row" style={{ width: n === 3 ? '60%' : '100%' }} />)}
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <>
          {/* ── Hero Stats ── */}
          <div className="hero-stats">
            <div className="hstat-card hstat-views">
              <div className="hstat-icon hstat-icon-views">👁</div>
              <div className="hstat-body">
                <span className="hstat-value live-number">{totalLiveViews.toLocaleString()}</span>
                <span className="hstat-label">Total Views</span>
              </div>
              <span className="live-dot" style={{ position: 'absolute', top: 14, right: 14 }} />
            </div>
            <div className="hstat-card">
              <div className="hstat-icon hstat-icon-assets">▣</div>
              <div className="hstat-body">
                <span className="hstat-value">{assets.length}</span>
                <span className="hstat-label">Total Assets</span>
              </div>
            </div>
            <div className="hstat-card">
              <div className="hstat-icon hstat-icon-pixel">◎</div>
              <div className="hstat-body">
                <span className="hstat-value">{pixelCount}</span>
                <span className="hstat-label">Pixels</span>
              </div>
            </div>
            <div className="hstat-card">
              <div className="hstat-icon hstat-icon-link">⌁</div>
              <div className="hstat-body">
                <span className="hstat-value">{linkCount}</span>
                <span className="hstat-label">Links</span>
              </div>
            </div>
            <div className="hstat-card">
              <div className="hstat-icon hstat-icon-globe">⊕</div>
              <div className="hstat-body">
                <span className="hstat-value">{countrySet.size}</span>
                <span className="hstat-label">Countries</span>
              </div>
            </div>
          </div>

          {/* ── Main Grid ── */}
          {assets.length > 0 && (
            <div className="dash-main-grid">
              {/* Left column: chart + countries */}
              <div className="dash-col-left">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">
                      {selectedAssetId === ALL ? 'All Assets — Daily Views' : `Daily Views — ${stats?.name || ''}`}
                    </span>
                    {selectedAssetId !== ALL && stats && <span className="card-sub">last 30 days</span>}
                    {loadingStats && <span className="card-sub">Loading…</span>}
                  </div>

                  {/* ALL view: multi-line chart */}
                  {selectedAssetId === ALL && allDailyData.length > 0 && (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={allDailyData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} stroke="var(--border)" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} stroke="var(--border)" />
                        <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                        {assets.map((a, i) => (
                          <Line key={a._id} type="monotone" dataKey={a.name}
                            stroke={CHART_PALETTE[i % CHART_PALETTE.length]}
                            strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}

                  {/* ALL view fallback: total views bar */}
                  {selectedAssetId === ALL && allDailyData.length === 0 && (
                    <>
                      <p className="card-sub" style={{ margin: '4px 0 10px' }}>Total views per asset</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={allAssetsBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} stroke="var(--border)" />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} stroke="var(--border)" />
                          <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                            {allAssetsBarData.map((entry, i) => (
                              <Bar key={i} fill={barColor(entry.type)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  )}

                  {/* Individual asset view */}
                  {selectedAssetId !== ALL && stats?.daily_views?.length > 0 && (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={stats.daily_views} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} stroke="var(--border)" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} stroke="var(--border)" />
                        <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                        <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#viewsGrad)" dot={false} activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}

                  {selectedAssetId !== ALL && !stats?.daily_views?.length && !loadingStats && (
                    <p className="empty-hint">No data yet for this asset.</p>
                  )}
                </div>

                {/* ALL: total views bar chart as second panel */}
                {selectedAssetId === ALL && allAssetsBarData.some((d) => d.views > 0) && (
                  <div className="card" style={{ marginTop: 16 }}>
                    <div className="card-header">
                      <span className="card-title">Total Views by Asset</span>
                    </div>
                    <ResponsiveContainer width="100%" height={Math.max(120, assets.length * 38 + 20)}>
                      <BarChart data={allAssetsBarData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} stroke="var(--border)" />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border)" />
                        <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="views" radius={[0, 4, 4, 0]} fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Individual: countries */}
                {selectedAssetId !== ALL && stats?.countries?.length > 0 && (
                  <div className="card" style={{ marginTop: 16 }}>
                    <div className="card-header">
                      <span className="card-title">Top Countries</span>
                      <span className="card-sub">{stats.name}</span>
                    </div>
                    <ResponsiveContainer width="100%" height={Math.min(200, stats.countries.length * 36 + 20)}>
                      <BarChart data={stats.countries} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} stroke="var(--border)" />
                        <YAxis type="category" dataKey="country" width={44} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border)" />
                        <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Right column: leaderboard + quick stats */}
              <div className="dash-col-right">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Assets</span>
                    <span className="card-badge">{assets.length}</span>
                  </div>
                  <div className="leaderboard">
                    {/* All Assets row */}
                    <div
                      className={`lb-row${selectedAssetId === ALL ? ' lb-row--active' : ''}`}
                      onClick={() => handleSelectAsset(ALL)}
                    >
                      <span className="lb-rank">—</span>
                      <div className="lb-info">
                        <div className="lb-name-row">
                          <span className="lb-name" style={{ color: '#94a3b8' }}>All Assets</span>
                          <span className="badge" style={{ background: 'rgba(255,255,255,.07)', color: '#64748b' }}>combined</span>
                        </div>
                        <div className="lb-bar-wrap">
                          <div className="lb-bar" style={{ width: '100%', background: 'linear-gradient(90deg,#6366f1,#22c55e)' }} />
                        </div>
                      </div>
                      <span className="lb-views">
                        <span className="lb-count">{totalLiveViews.toLocaleString()}</span>
                      </span>
                    </div>

                    {leaderboard.map((a, i) => (
                      <div
                        key={a._id}
                        className={`lb-row${selectedAssetId === a._id ? ' lb-row--active' : ''}`}
                        onClick={() => handleSelectAsset(a._id)}
                      >
                        <span className="lb-rank">{i + 1}</span>
                        <div className="lb-info">
                          <div className="lb-name-row">
                            <span className="lb-name">{a.name}</span>
                            <span className={`badge badge-${a.type}`}>{a.type}</span>
                          </div>
                          <div className="lb-bar-wrap">
                            <div className="lb-bar" style={{ width: `${a.pct || 0}%`, background: barColor(a.type) }} />
                          </div>
                        </div>
                        <span className="lb-views">
                          <span className="lb-count">{a.views.toLocaleString()}</span>
                          {a.views > 0 && <span className="live-dot-inline" />}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {stats && (
                  <div className="card" style={{ marginTop: 16 }}>
                    <div className="card-header">
                      <span className="card-title">{stats.name}</span>
                      <span className={`badge badge-${stats.type}`}>{stats.type}</span>
                    </div>
                    <div className="qstats">
                      <div className="qstat">
                        <span className="qstat-val live-number">{(liveCounts[stats.asset_id] ?? stats.total_views).toLocaleString()}</span>
                        <span className="qstat-label">Views</span>
                      </div>
                      <div className="qstat">
                        <span className="qstat-val">{stats.unique_visitors}</span>
                        <span className="qstat-label">Unique IPs</span>
                      </div>
                      <div className="qstat">
                        <span className="qstat-val">{stats.countries?.length || 0}</span>
                        <span className="qstat-label">Countries</span>
                      </div>
                      <div className="qstat">
                        <span className="qstat-val">{stats.top_referrers?.length || 0}</span>
                        <span className="qstat-label">Referrers</span>
                      </div>
                    </div>

                    {stats.top_referrers?.length > 0 && (
                      <div className="ref-section">
                        <p className="ref-heading">Top Referrers</p>
                        {stats.top_referrers.slice(0, 5).map((r, i) => (
                          <div key={i} className="ref-row">
                            <span className="ref-url truncate">{r.referrer || '(direct)'}</span>
                            <span className="ref-count">{r.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Activity Log ── */}
          <div className="card activity-log-card">
            <div className="card-header">
              <span className="card-title">Activity Log</span>
              <div className="al-header-right">
                {feed.length > 0 && <span className="live-dot-label"><span className="live-dot" />Live</span>}
                {feed.length > 0 && <span className="card-badge">{feed.length}</span>}
              </div>
            </div>

            {feed.length === 0 ? (
              <div className="al-empty">
                <p>No activity recorded yet.</p>
                {assets.length > 0
                  ? <p>Trigger a pixel or visit a redirect link to start tracking.</p>
                  : <p><Link to="/assets">Create an asset →</Link></p>}
              </div>
            ) : (
              <div className="al-table-wrap">
                <table className="table al-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Asset</th>
                      <th>IP Address</th>
                      <th>Country</th>
                      <th>Browser</th>
                      <th>Referrer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feed.map((ev, i) => {
                      const browser = getBrowser(ev.user_agent);
                      return (
                        <tr key={ev._id || i} className={ev._live && i === 0 ? 'row-flash' : ''}>
                          <td className="nowrap al-time">
                            {timeAgo(ev.timestamp)}
                            {ev._live && <span className="live-dot-inline" />}
                          </td>
                          <td>
                            <span className={`badge badge-${ev.asset_type || ev.type}`}>
                              {ev.name}
                            </span>
                          </td>
                          <td className="mono al-ip">{ev.ip || '—'}</td>
                          <td>
                            {ev.country
                              ? <span className="country-pill">{ev.country}</span>
                              : <span className="muted">—</span>}
                          </td>
                          <td>
                            {browser
                              ? <span className={`ua-badge ua-${browser.toLowerCase()}`}>{browser}</span>
                              : <span className="muted">—</span>}
                          </td>
                          <td className="truncate muted al-ref">{ev.referrer || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {assets.length === 0 && (
            <div className="empty-state">
              <p>No assets yet. <button className="btn-link" onClick={() => setShowModal(true)}>Create your first asset →</button></p>
            </div>
          )}
        </>
      )}

      {showModal && (
        <CreateAssetModal
          onClose={() => setShowModal(false)}
          onCreated={(asset) => {
            setShowModal(false);
            navigate(`/assets/${asset._id}`);
          }}
        />
      )}
    </Layout>
  );
}

