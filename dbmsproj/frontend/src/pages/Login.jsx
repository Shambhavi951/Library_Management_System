import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/authStore.js';

const labels = { member: 'Member Login', admin: 'Admin Login', owner: 'Owner Login' };

export default function Login() {
  const { type = 'member' } = useParams();
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await login(form.email, form.password, type);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="login-ornament">✦ ✦ ✦</div>
        <h1>{labels[type]}</h1>
        <div className="subtitle">THE READING NOOK</div>
        <div className="login-mode-grid">
          <Link className="btn" to="/login/member">Member</Link>
          <Link className="btn" to="/login/admin">Admin</Link>
          <Link className="btn" to="/login/owner">Owner</Link>
        </div>
        <label>Email</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <label>Password</label>
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button className="btn btn-primary" type="submit">{labels[type]}</button>
        {error && <div className="login-error">{error}</div>}
        <div className="login-hint"><Link to="/">Return to landing</Link></div>
      </form>
    </div>
  );
}

