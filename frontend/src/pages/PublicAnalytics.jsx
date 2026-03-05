import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { publicAPI, BACKEND_URL } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const DEVICE_COLORS = { mobile: '#6366f1', desktop: '#22c55e', tablet: '#f59e0b', unknown: '#94a3b8' };

export default function PublicAnalytics() {
  const { tracking_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    publicAPI.getAnalytics(tracking_id)
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 403) setDisabled(true);
        else setError(err.response?.data?.message || 'Not found');
      })
      .finally(() => setLoading(false));
  }, [tracking_id]);

  const deviceData = data?.device_breakdown?.map((d) => ({
    name: d.device || 'unknown',
    value: d.count,
  })) || [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f4f4f8)', padding: '32px 16px' }}>
      <Helmet>
        <title>{data ? `${data.name} Analytics — TrackLayer` : 'Public Analytics — TrackLayer'}</title>
        <meta name="description" content={data ? `Live analytics for "${data.name}" — powered by TrackLayer.` : 'View public analytics powered by TrackLayer.'} />
        <meta property="og:title" content={data ? `${data.name} Analytics — TrackLayer` : 'Public Analytics — TrackLayer'} />
        <meta property="og:image" content="https://tracklayer.xyz/og-image.png" />
      </Helmet>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 22 }}>TrackLayer</span>
            <span style={{ fontSize: 12, background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
              Public Stats
            </span>
          </div>
          {data && (
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
              {data.name}
              &nbsp;
              <span style={{ fontSize: 14, background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 6, textTransform: 'capitalize' }}>
                {data.type}
              </span>
            </h1>
          )}
        </div>

        {loading && <p style={{ color: '#888' }}>Loading…</p>}
        {disabled && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '32px 24px', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, color: '#1e293b' }}>Analytics are private</h2>
            <p style={{ margin: 0, fontSize: 14 }}>The owner has disabled public access to these stats.</p>
          </div>
        )}
        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '16px 20px', borderRadius: 10 }}>
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 28 }}>
              <StatCard label="Total Views" value={data.total_views.toLocaleString()} color="#6366f1" />
              <StatCard label="Today" value={data.today_views.toLocaleString()} color="#22c55e" />
              <StatCard label="Countries" value={data.countries?.length || 0} color="#f59e0b" />
              <StatCard label="Devices tracked" value={deviceData.reduce((s, d) => s + d.value, 0).toLocaleString()} color="#8b5cf6" />
            </div>

            {/* Daily chart */}
            {data.daily_views?.length > 0 && (
              <Section title="Daily Views (last 30 days)">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.daily_views}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Section>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
              {/* Countries */}
              {data.countries?.length > 0 && (
                <Section title="Countries">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data.countries} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="country" width={50} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </Section>
              )}

              {/* Device breakdown */}
              {deviceData.length > 0 && (
                <Section title="Devices">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <PieChart width={140} height={140}>
                      <Pie data={deviceData} cx={60} cy={60} innerRadius={30} outerRadius={55} dataKey="value">
                        {deviceData.map((entry, i) => (
                          <Cell key={i} fill={DEVICE_COLORS[entry.name] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {deviceData.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: DEVICE_COLORS[d.name] || '#94a3b8', display: 'inline-block' }} />
                          <span style={{ textTransform: 'capitalize' }}>{d.name}</span>
                          <span style={{ color: '#888' }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>
              )}
            </div>

            {/* Referrers */}
            {data.referrers?.length > 0 && (
              <Section title="Top Referrers">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748b' }}>Referrer</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#64748b' }}>Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.referrers.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 8px', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.referrer}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748b' }}>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {/* Live badge */}
            <Section title="Live Badge Embed">
              <div style={{ marginBottom: 8 }}>
                <img src={`${BACKEND_URL}/badge/${tracking_id}`} alt="Views badge" style={{ height: 20 }} />
              </div>
              <code style={{ fontSize: 12, background: '#f1f5f9', padding: '6px 10px', borderRadius: 6, display: 'block', wordBreak: 'break-all' }}>
                {`<img src="${BACKEND_URL}/badge/${tracking_id}" alt="Views" />`}
              </code>
            </Section>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 32 }}>
              Powered by <strong>TrackLayer</strong>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '20px 20px', boxShadow: '0 1px 6px rgba(0,0,0,.06)', marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, marginTop: 0, color: '#1e293b' }}>{title}</h3>
      {children}
    </div>
  );
}
