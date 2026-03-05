import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { assetsAPI, BACKEND_URL } from '../services/api';
import Layout from '../components/Layout';
import CreateAssetModal from '../components/CreateAssetModal';

export default function Assets() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function loadAssets() {
    try {
      const res = await assetsAPI.list();
      setAssets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAssets(); }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this asset?')) return;
    await assetsAPI.delete(id);
    setAssets((prev) => prev.filter((a) => a._id !== id));
  }

  function trackingUrl(asset) {
    if (asset.type === 'pixel') return `${BACKEND_URL}/p/${asset.tracking_id}.png`;
    if (asset.type === 'link') return `${BACKEND_URL}/l/${asset.tracking_id}`;
    if (asset.type === 'file') return `${BACKEND_URL}/d/${asset.tracking_id}`;
    return '';
  }

  function embedCode(asset) {
    if (asset.type === 'pixel')
      return `<img src="${BACKEND_URL}/p/${asset.tracking_id}.png" width="1" height="1" />`;
    return trackingUrl(asset);
  }

  return (
    <Layout>
      <Helmet>
        <title>Assets — TrackLayer</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="page-header">
        <h2>Assets</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Asset</button>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : assets.length === 0 ? (
        <div className="empty-state">
          <p>No assets yet. Click <strong>+ New Asset</strong> to create one.</p>
        </div>
      ) : (
        <div className="assets-table">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th className="col-hide-mobile">Tracking URL / Embed</th>
                <th className="col-hide-mobile">Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset._id}>
                  <td>{asset.name}</td>
                  <td><span className={`badge badge-${asset.type}`}>{asset.type}</span></td>
                  <td className="col-hide-mobile">
                    <div className="code-cell">
                      <code className="truncate">{embedCode(asset)}</code>
                      <button
                        className="btn btn-xs"
                        onClick={() => navigator.clipboard.writeText(embedCode(asset))}
                      >
                        Copy
                      </button>
                    </div>
                  </td>
                  <td className="col-hide-mobile">{new Date(asset.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/assets/${asset._id}`} className="btn btn-sm btn-secondary">
                        Analytics
                      </Link>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(asset._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
