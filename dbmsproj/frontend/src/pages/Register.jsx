import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/authStore.js';
import { displayBranch } from '../utils/branches.js';

export default function Register() {
  const register = useAuth((s) => s.register);
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone_number: '', branch_id: 1, plan_name: 'STANDARD', password: '' });
  useEffect(() => { api('/catalog/branches').then(setBranches).catch(() => setBranches([])); }, []);
  async function submit(event) {
    event.preventDefault();
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="login-ornament">✦ ✦ ✦</div>
        <h1>Register</h1>
        <div className="subtitle">SELECT YOUR BRANCH AND PLAN</div>
        <div className="form-grid cols-2">
          <Field label="First Name" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
          <Field label="Last Name" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Phone" value={form.phone_number} onChange={(v) => setForm({ ...form, phone_number: v })} />
          <div className="form-field">
            <label>Branch</label>
            <select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: Number(e.target.value) })}>
              {branches.map((b) => <option key={b.branch_id} value={b.branch_id}>{displayBranch(b.branch_name)}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Plan</label>
            <select value={form.plan_name} onChange={(e) => setForm({ ...form, plan_name: e.target.value })}>
              <option value="STANDARD">Standard</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
          <Field className="full" label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
        </div>
        <button className="btn btn-primary" type="submit">Create Account</button>
        {error && <div className="login-error">{error}</div>}
        <div className="login-hint"><Link to="/">Return to landing</Link></div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', className = '' }) {
  return <div className={`form-field ${className}`}><label>{label}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={label !== 'Phone'} /></div>;
}

