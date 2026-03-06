import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';

/* ── SVG icon set ─────────────────────────────────────────── */
const Icon = ({ d, size = 20, multi }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {multi ? multi.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const icons = {
  link:     ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
  eye:      ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  chart:    ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  shield:   ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  globe:    ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
  qr:       ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h3v3h-3z', 'M20 17v4', 'M17 20h4'],
  tag:      ['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z', 'M7 7h.01'],
  clock:    ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 6v6l4 2'],
  mail:     ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'M22 6l-10 7L2 6'],
  file:     ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  star:     ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
};

// accent colours per use-case
const UC_ACCENT = [
  '#818cf8', '#4ade80', '#fbbf24', '#f472b6',
  '#38bdf8', '#c084fc', '#fb7185', '#34d399', '#fb923c',
];

const useCases = [
  {
    icon: 'eye',
    label: 'GitHub · GitLab · Notion',
    title: 'README & Docs Views',
    desc: 'Embed a tracking pixel or live badge in any README or docs page. See reads by country, device, and time.',
    tags: ['GitHub README', 'GitLab', 'Notion Docs', 'mdBook'],
  },
  {
    icon: 'file',
    label: 'PDFs & Office Docs',
    title: 'PDF & Document Tracking',
    desc: 'Wrap any PDF, resume, or pitch deck in a tracked URL. Know when it opens and how many times it has been viewed.',
    tags: ['Resumes', 'Pitch Decks', 'Whitepapers', 'Reports'],
  },
  {
    icon: 'mail',
    label: 'HTML Emails',
    title: 'Email Open Tracking',
    desc: 'Drop a 1×1 invisible pixel into any HTML email. Get notified the instant it is opened, with device and location — no third-party service needed.',
    tags: ['Cold Outreach', 'Newsletters', 'Transactional Emails'],
  },
  {
    icon: 'link',
    label: 'Social & Ad Campaigns',
    title: 'Campaign & Bio Links',
    desc: 'Short tracked links for social bios, ads, or print. Compare click-through rates across every channel in one place.',
    tags: ['Instagram Bio', 'Twitter / X', 'Ad Campaigns', 'Print QR'],
  },
  {
    icon: 'download',
    label: 'Files & Software',
    title: 'File Download Tracking',
    desc: 'See exactly when and how often files are downloaded — installers, datasets, templates. No client SDK. Works with any CDN.',
    tags: ['Software Installers', 'Datasets', 'Templates', 'Binaries'],
  },
  {
    icon: 'qr',
    label: 'Print & Packaging',
    title: 'QR Code Generation',
    desc: 'Generate a high-res QR PNG for any tracked link. Drop it into packaging, slide decks, posters, or business cards instantly.',
    tags: ['Product Packaging', 'Slide Decks', 'Business Cards'],
  },
  {
    icon: 'tag',
    label: 'Portfolios & Open Source',
    title: 'Live SVG Badges',
    desc: 'Paste a live counter badge anywhere that renders an image. The number stays current in real time — no cache, no stale counts.',
    tags: ['GitHub README', 'Portfolio Sites', 'Open Source Projects'],
  },
  {
    icon: 'clock',
    label: 'Time-Limited Offers',
    title: 'Expiring & Capped Links',
    desc: 'Set an expiry date or max-click cap on any link. Expired links show a clean page. Perfect for beta invites or flash offers.',
    tags: ['Beta Invites', 'Limited Offers', 'One-Time Downloads'],
  },
  {
    icon: 'shield',
    label: 'Data Integrity',
    title: 'Bot & Crawler Filtering',
    desc: 'All events are screened against known bot signatures. Crawlers and scrapers are silently dropped — your numbers reflect real humans only.',
    tags: ['Marketing Analytics', 'SEO', 'A/B Testing'],
  },
];

const features = [
  { icon: 'link',     title: 'Link Tracking',    desc: 'Create short tracking links and see who clicked, when, from where, and on what device.' },
  { icon: 'eye',      title: 'Pixel Tracking',   desc: 'Embed a 1×1 tracking pixel in emails or HTML pages to silently log opens without any clicks.' },
  { icon: 'download', title: 'File Downloads',   desc: 'Wrap any file download in a tracked URL. Know every time someone grabs your asset.' },
  { icon: 'chart',    title: 'Live Analytics',   desc: 'Real-time event feed over WebSocket. Watch events stream in as they happen.' },
  { icon: 'shield',   title: 'Bot Filtering',    desc: 'Automated crawlers are silently dropped so your numbers always reflect real humans.' },
  { icon: 'globe',    title: 'Device & Country', desc: 'Every event tagged with device type (mobile / desktop / tablet) and geographic data.' },
  { icon: 'qr',       title: 'QR Codes',         desc: 'Instantly generate a QR code for any tracked link — ready for print, slides, or packaging.' },
  { icon: 'tag',      title: 'Live Badges',       desc: 'Embed a live SVG counter badge anywhere — GitHub READMEs, docs, or portfolios.' },
  { icon: 'clock',    title: 'Expiring Links',   desc: 'Set an expiry date or max-click limit. Links auto-expire with a clean error page.' },
];

const steps = [
  { n: '01', title: 'Create an Asset',       desc: 'Pick a type — Link, Pixel, or File. Optionally set an expiry date or click cap.' },
  { n: '02', title: 'Deploy It',             desc: 'Copy the tracking URL, embed snippet, or QR code and use it wherever you need.' },
  { n: '03', title: 'Watch Events Roll In',  desc: 'Open the dashboard. Live charts, device breakdown, referrers, and a real-time event feed.' },
  { n: '04', title: 'Share or Embed',        desc: 'Share the public analytics page or embed the live badge counter in any document.' },
];

/* ── Scroll-triggered fade-in hook ───────────────────────── */
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Animated section wrapper ─────────────────────────────── */
function FadeSection({ children, className = '', style }) {
  const ref = useFadeIn();
  return <div ref={ref} className={`fade-up ${className}`} style={style}>{children}</div>;
}

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="landing">
      <Helmet>
        <title>TrackLayer — Track Every Click, Open &amp; Download</title>
        <meta name="description" content="TrackLayer is a developer-first, self-hosted analytics platform. Track links, pixels, and file downloads with real-time events, bot filtering, QR codes, and embeddable badges." />
        <meta property="og:title" content="TrackLayer — Track Every Click, Open &amp; Download" />
        <meta property="og:description" content="Drop a link, pixel, or file. Get real-time analytics with device detection, bot filtering, QR codes, and embeddable SVG badges. Self-hosted &amp; open source." />
        <meta property="og:url" content="https://tracklayer.xyz/" />
        <meta property="og:image" content="https://tracklayer.xyz/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://tracklayer.xyz/og-image.png" />
        <link rel="canonical" href="https://tracklayer.xyz/" />
      </Helmet>

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <img src="/logo_full.png" alt="TrackLayer" />
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="/contact">Contact</a>
          </div>
          <div className="landing-nav-cta">
            {user ? (
              <Link to="/dashboard" className="btn-primary-nav">Dashboard →</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost-nav">Log in</Link>
                <Link to="/register" className="btn-primary-nav">Start free</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="hero">
        <FadeSection>
          <div className="hero-badge">Open-source · Self-hosted · Privacy-first</div>
          <h1 className="hero-title">
            Track every click,<br />
            <span className="hero-gradient">open, and download.</span>
          </h1>
          <p className="hero-sub">
            TrackLayer is a developer-first analytics platform. Drop a link,
            pixel, or file — get real-time event data with device detection,
            bot filtering, QR codes, and embeddable SVG badges.
          </p>
          <div className="hero-btns">
            {user ? (
              <Link to="/dashboard" className="btn-hero-primary">Go to Dashboard →</Link>
            ) : (
              <>
                <Link to="/register" className="btn-hero-primary">Get started free →</Link>
                <Link to="/login" className="btn-hero-ghost">Sign in</Link>
              </>
            )}
          </div>
        </FadeSection>

        <FadeSection className="hero-preview-wrap" style={{transitionDelay:'0.15s'}}>
          <div className="hero-preview">
            <div className="preview-bar">
              <span className="dot red" /><span className="dot amber" /><span className="dot green" />
              <span className="preview-url">tracklayer.xyz/dashboard</span>
            </div>
            <div className="preview-body">
              <div className="preview-stat-row">
                {[['Total Clicks','14,280'],['Unique Visitors','6,912'],['Active Assets','23'],['Avg. CTR','48.4%']].map(([l,v]) => (
                  <div className="preview-stat" key={l}>
                    <div className="preview-stat-val">{v}</div>
                    <div className="preview-stat-label">{l}</div>
                  </div>
                ))}
              </div>
              <div className="preview-chart-row">
                {[40,65,50,85,72,90,60,78,95,70,88,100].map((h,i) => (
                  <div key={i} className="preview-bar-item" style={{height: h * 0.7 + 'px', animationDelay: i * 0.05 + 's'}} />
                ))}
              </div>
              <div className="preview-events">
                {[
                  ['L','portfolio-link','Chrome · macOS','2s ago'],
                  ['P','email-pixel','Safari · iPhone','8s ago'],
                  ['F','resume.pdf','Firefox · Linux','14s ago'],
                ].map(([type,name,meta,time]) => (
                  <div className="preview-event-row" key={name}>
                    <span className={`preview-event-type type-${type.toLowerCase()}`}>{type}</span>
                    <span className="preview-event-name">{name}</span>
                    <span className="preview-event-meta">{meta}</span>
                    <span className="preview-event-time">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ── Use Cases ───────────────────────────────────── */}
      <section className="section section-alt" id="usecases">
        <div className="section-inner">
          <FadeSection>
            <p className="section-eyebrow">Real-world use cases</p>
            <h2 className="section-title">Built for the things that matter most</h2>
            <p className="section-sub">
              From README views to QR codes on packaging — here's everything TrackLayer can track.
            </p>
          </FadeSection>
          <div className="ucases-grid">
            {useCases.map((uc, i) => {
              const accent = UC_ACCENT[i % UC_ACCENT.length];
              return (
                <FadeSection key={uc.title} style={{transitionDelay: (i % 2) * 0.07 + 's'}}>
                  <div className="ucase-card" style={{'--uc-accent': accent}}>
                    <div className="ucase-card-top">
                      <div className="ucase-icon">
                        <Icon multi={icons[uc.icon]} size={15} />
                      </div>
                      <span className="ucase-label">{uc.label}</span>
                    </div>
                    <h3 className="ucase-title">{uc.title}</h3>
                    <p className="ucase-desc">{uc.desc}</p>
                    <div className="usecase-tags">
                      {uc.tags.map(t => <span key={t} className="usecase-tag">{t}</span>)}
                    </div>
                  </div>
                </FadeSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="section" id="features">
        <div className="section-inner">
          <FadeSection>
            <p className="section-eyebrow">Everything you need</p>
            <h2 className="section-title">Built for developers &amp; marketers</h2>
            <p className="section-sub">
              One platform to track links, pixels, and files — with analytics that actually make sense.
            </p>
          </FadeSection>
          <div className="features-grid">
            {features.map((f, i) => (
              <FadeSection key={f.title} style={{transitionDelay: (i % 3) * 0.08 + 's'}}>
                <div className="feature-card">
                  <div className="feature-icon-wrap">
                    <Icon multi={icons[f.icon]} size={18} />
                  </div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="section section-alt" id="how">
        <div className="section-inner">
          <FadeSection>
            <p className="section-eyebrow">Simple by design</p>
            <h2 className="section-title">Up and running in minutes</h2>
          </FadeSection>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <FadeSection key={s.n} style={{transitionDelay: i * 0.09 + 's'}}>
                <div className="step-card">
                  <div className="step-number">{s.n}</div>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Embed showcase ──────────────────────────────── */}
      <section className="section">
        <div className="section-inner embed-showcase">
          <FadeSection className="embed-text">
            <p className="section-eyebrow">Developer tools</p>
            <h2 className="section-title" style={{textAlign:'left'}}>Drop it anywhere</h2>
            <p className="section-sub" style={{textAlign:'left', maxWidth:420}}>
              Every asset ships with a copy-ready tracking URL, a pixel embed snippet,
              a QR code PNG, and a live counter badge you can paste straight into a GitHub README.
            </p>
            <Link to={user ? '/assets' : '/register'} className="btn-hero-primary" style={{marginTop:24,display:'inline-block'}}>
              Create your first asset →
            </Link>
          </FadeSection>
          <FadeSection className="embed-cards" style={{transitionDelay:'0.1s'}}>
            {[
              ['Tracking URL',    `https://api.tracklayer.xyz/l/`, 'aBc123'],
              ['Pixel Embed',     `<img src="…/p/`, 'aBc123', `.png" width="1" height="1" />`],
              ['README Badge',    `![clicks](…/badge/`, 'aBc123', `)`],
              ['Public Analytics',`tracklayer.xyz/public/`, 'aBc123'],
            ].map(([label, pre, accent, post = '']) => (
              <div className="embed-card" key={label}>
                <div className="embed-card-label">{label}</div>
                <code className="embed-code">{pre}<span className="code-accent">{accent}</span>{post}</code>
              </div>
            ))}
          </FadeSection>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="cta-section">
        <FadeSection className="cta-inner">
          <h2 className="cta-title">Start tracking in 60 seconds.</h2>
          <p className="cta-sub">No credit card required. No limits on assets. Just sign up and go.</p>
          <div className="hero-btns">
            {user ? (
              <Link to="/dashboard" className="btn-hero-primary">Go to Dashboard →</Link>
            ) : (
              <>
                <Link to="/register" className="btn-hero-primary">Create free account →</Link>
                <Link to="/login" className="btn-hero-ghost">Sign in</Link>
              </>
            )}
          </div>
        </FadeSection>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-logo" style={{opacity:0.5}}>
          <img src="/logo_full.png" alt="TrackLayer" />
        </div>
        <div style={{display:'flex',gap:20,alignItems:'center'}}>
          <a href="/contact" style={{fontSize:'0.82rem',color:'var(--text-muted)',textDecoration:'none'}}>Contact</a>
          <a href="mailto:contact@tanvirrobin.dev" style={{fontSize:'0.82rem',color:'var(--text-muted)',textDecoration:'none'}}>contact@tanvirrobin.dev</a>
          <p className="footer-copy" style={{margin:0}}>© {new Date().getFullYear()} TrackLayer. Self-hosted. Source-available.</p>
        </div>
      </footer>

    </div>
  );
}
