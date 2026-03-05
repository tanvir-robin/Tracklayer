import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ticketsAPI } from '../services/api';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

function timeAgo(ts) {
  const sec = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  const d = Math.floor(sec / 86400);
  return d === 1 ? '1 day ago' : `${d} days ago`;
}

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const TicketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z" />
  </svg>
);

export default function Contact() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    ticketsAPI.list()
      .then(r => setTickets(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const r = await ticketsAPI.create(form);
      setTickets(prev => [r.data, ...prev]);
      setForm({ subject: '', message: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  }

  const openCount = tickets.filter(t => t.status === 'open').length;

  return (
    <Layout>
      <Helmet>
        <title>Contact &amp; Support — TrackLayer</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="page-header">
        <div>
          <h2 className="page-title">Contact &amp; Support</h2>
          <p className="page-subtitle">
            Submit a ticket or reach us directly — we'll get back to you.
          </p>
        </div>
        {openCount > 0 && (
          <div className="live-dot-label">
            <span className="live-dot" style={{ background: '#f59e0b', boxShadow: '0 0 6px rgba(245,158,11,.6)' }} />
            {openCount} open {openCount === 1 ? 'ticket' : 'tickets'}
          </div>
        )}
      </div>

      <div className="contact-wrap">
        <div className="contact-grid">
          {/* Info panel */}
          <div className="contact-info-card">
            <div className="contact-info-row">
              <div className="contact-info-icon"><MailIcon /></div>
              <div>
                <div className="contact-info-label">Email us</div>
                <div className="contact-info-value">
                  <a href="mailto:contact@tanvirrobin.dev">contact@tanvirrobin.dev</a>
                </div>
              </div>
            </div>

            <div className="contact-info-row">
              <div className="contact-info-icon" style={{ background: 'rgba(34,197,94,.1)', color: '#22c55e' }}>
                <ClockIcon />
              </div>
              <div>
                <div className="contact-info-label">Response time</div>
                <div className="contact-info-value">Usually within 24–48 hours</div>
              </div>
            </div>

            <div className="contact-info-row">
              <div className="contact-info-icon" style={{ background: 'rgba(245,158,11,.1)', color: '#f59e0b' }}>
                <TicketIcon />
              </div>
              <div>
                <div className="contact-info-label">Your tickets</div>
                <div className="contact-info-value">
                  {loading ? '—' : tickets.length === 0
                    ? 'No tickets yet'
                    : `${tickets.length} total · ${openCount} open`}
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 'auto',
              padding: '14px 16px',
              background: 'rgba(99,102,241,.07)',
              border: '1px solid rgba(99,102,241,.15)',
              borderRadius: 10,
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              lineHeight: 1.65,
            }}>
              <strong style={{ color: 'var(--text)' }}>Logged in as</strong><br />
              {user?.email}
            </div>
          </div>

          {/* Submit form */}
          <div className="contact-form-card">
            <p className="contact-form-title">Open a new ticket</p>
            <form onSubmit={handleSubmit}>
              <div className="contact-form-group">
                <label className="contact-form-label">Subject</label>
                <input
                  className="contact-form-input"
                  type="text"
                  placeholder="What's this about?"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  required
                />
              </div>
              <div className="contact-form-group">
                <label className="contact-form-label">Message</label>
                <textarea
                  className="contact-form-textarea"
                  placeholder="Describe your issue or question in detail…"
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>
              {error && (
                <div style={{
                  background: 'rgba(239,68,68,.08)',
                  border: '1px solid rgba(239,68,68,.2)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: '0.84rem',
                  color: '#f87171',
                  marginBottom: 12,
                }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="contact-submit-btn"
                disabled={submitting || !form.subject.trim() || !form.message.trim()}
              >
                {submitting ? 'Submitting…' : 'Submit ticket'}
              </button>
              {success && (
                <div className="contact-success">
                  ✓ Ticket submitted. We'll be in touch at {user?.email}.
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Tickets list */}
        <div className="tickets-section">
          <p className="tickets-section-title">Your tickets</p>
          {loading ? (
            <div className="loading-shimmer">
              {[1,2].map(n => <div key={n} className="shimmer-row" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="tickets-empty">
              No tickets yet. Use the form above to get in touch.
            </div>
          ) : (
            tickets.map(t => (
              <div className="ticket-card" key={t._id}>
                <span className={`ticket-status-dot ${t.status}`} />
                <div className="ticket-body">
                  <div className="ticket-subject">{t.subject}</div>
                  <div className="ticket-meta">
                    <span>{timeAgo(t.createdAt)}</span>
                    <span>·</span>
                    <span style={{
                      maxWidth: 380,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'inline-block',
                    }}>{t.message}</span>
                  </div>
                </div>
                <span className={`ticket-status-badge ${t.status}`}>{t.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
