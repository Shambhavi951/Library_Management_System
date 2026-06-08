import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/authStore.js';

export default function Landing() {
  const user = useAuth((s) => s.user);
  if (user) return <Navigate to="/dashboard" replace />;
  return (
    <div className="login-shell">
      <section className="login-card">
        <div className="login-ornament">✦ ✦ ✦</div>
        <h1>The Reading Nook</h1>
        <div className="subtitle">INTELLIGENT LIBRARY MANAGEMENT</div>
        <p className="hero-copy">A cozy multi-branch library platform for members, branch librarians, and owners.</p>
        <div className="divider"><span className="divider-mark">§</span></div>
        <div className="home-actions">
          <Link className="btn btn-primary" to="/login/member">Member Login</Link>
          <Link className="btn btn-primary" to="/login/admin">Admin Login</Link>
          <Link className="btn btn-gold" to="/login/owner">Owner Login</Link>
        </div>
        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <Link className="btn" to="/catalog-public">Browse Catalog</Link>
        </div>
        <div className="login-hint">Fernhollow · Mistgrove · Bramblewick</div>
      </section>
    </div>
  );
}

