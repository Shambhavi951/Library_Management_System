import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar.jsx';
import { api } from '../api/client.js';

export default function DataPage({ title, crumb, endpoint, columns = [], form, method = 'POST', actionLabel = 'Submit', readOnly = false, noEdit = false, hideCreateForm = false }) {
  const [rows, setRows] = useState([]);
  const defaultValues = Object.fromEntries((form || []).map((f) => [f.name, f.default || '']));
  const [values, setValues] = useState(defaultValues);
  const [message, setMessage] = useState(null);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    if (!endpoint) return;
    try {
      const data = await api(endpoint);
      setRows(Array.isArray(data) ? data : data?.mostBorrowed || data?.demand || (data ? [data] : []));
      // Only auto-populate form if we are not editing
      if (!editingId) {
        if (form && data && !Array.isArray(data)) {
          setValues(Object.fromEntries(form.map((f) => [f.name, data[f.name] ?? f.default ?? ''])));
        } else if (form && Array.isArray(data) && data.length > 0 && !endpoint.includes('/members') && !endpoint.includes('/admins')) {
          // Avoid auto-populating Member/Admin lists into the creation form at first row
          setValues(Object.fromEntries(form.map((f) => [f.name, data[0][f.name] ?? f.default ?? ''])));
        }
      }
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  }

  useEffect(() => { load(); }, [endpoint]);

  async function submit(event) {
    event.preventDefault();
    try {
      const submitMethod = editingId ? (method === 'PATCH' ? 'PATCH' : 'PUT') : method;
      const submitUrl = editingId ? `${endpoint}/${editingId}` : endpoint;
      await api(submitUrl, { method: submitMethod, body: cast(values) });
      setMessage({ text: editingId ? 'Changes Saved' : 'Saved', type: 'success' });
      setEditingId(null);
      setValues(defaultValues);
      await load();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  }

  function getRowId(row) {
    return row.acquisition_request_id ||
           row.transfer_id ||
           row.copy_id ||
           row.publication_id ||
           row.reading_list_id ||
           row.review_id ||
           row.member_id ||
           row.account_id ||
           row.id;
  }

  function startEdit(row) {
    const id = getRowId(row);
    setEditingId(id);
    setValues(Object.fromEntries(form.map((f) => [f.name, f.name === 'password' ? '' : row[f.name] ?? ''])));
  }

  function cancelEdit() {
    setEditingId(null);
    setValues(defaultValues);
  }

  async function handleReturn(row) {
    const copyId = row.copy_id || row.id;
    if (!copyId) return;
    if (!confirm(`Are you sure you want to mark "${row.title || 'this book'}" (Copy #${copyId}) as returned?`)) return;
    try {
      await api('/admin/returns', { method: 'POST', body: { copy_id: copyId } });
      setMessage({ text: 'Book marked as returned successfully', type: 'success' });
      await load();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  }

  async function handleApproveBorrowal(row) {
    if (!row.notification_id) return;
    if (!confirm('Are you sure you want to approve this borrowal?')) return;
    try {
      await api('/admin/approve-hold', { method: 'POST', body: { notification_id: row.notification_id } });
      setMessage({ text: 'Borrowal approved and checked out successfully', type: 'success' });
      await load();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  }

  return (
    <>
      <Topbar title={title} crumb={crumb || 'The Reading Nook'} />
      {message && <div className={`toast-inline toast-${message.type || 'info'}`}>{message.text || message}</div>}
      {form && (!hideCreateForm || editingId) && <form className="card" onSubmit={submit}>
        <div className="card-header">
          <div>
            <div className="card-sub">FORM</div>
            <div className="card-title">{editingId ? `Edit: ${actionLabel}` : actionLabel}</div>
          </div>
        </div>
        <div className="form-grid">
          {form.map((field) => (
            <div className="form-field" key={field.name}>
              <label>{field.label}</label>
              {field.options ? <select disabled={readOnly} value={values[field.name]} onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}>{field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                : <input disabled={readOnly} type={field.type || 'text'} value={values[field.name]} onChange={(e) => setValues({ ...values, [field.name]: e.target.value })} required={field.name !== 'password' && field.name !== 'phone_number'} />}
            </div>
          ))}
        </div>
        {!readOnly && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" type="submit">{editingId ? 'Save Changes' : actionLabel}</button>
            {editingId && <button className="btn btn-sm" type="button" onClick={cancelEdit}>Cancel Edit</button>}
          </div>
        )}
      </form>}
      <div className="card">
        <div className="card-header"><div><div className="card-sub">RECORDS</div><div className="card-title">{title}</div></div><button className="btn btn-sm" onClick={load}>Refresh</button></div>
        <div className="table-wrap">
          <table className="small-table">
            <thead>
              <tr>
                {columns.map((c) => <th key={c}>{c.replaceAll('_', ' ').toUpperCase()}</th>)}
                {(((form && !noEdit) || title === 'Notifications' || rows.some(r => r.copy_status === 'BORROWED')) && !readOnly) && <th>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const showActions = ((form && !noEdit) || title === 'Notifications' || rows.some(r => r.copy_status === 'BORROWED')) && !readOnly;
                return (
                  <tr key={getRowId(row) || i}>
                    {columns.map((c) => {
                      let val = row[c] ?? row[toSnake(c)];
                      if (val === undefined && c.toLowerCase() === 'id') {
                        val = getRowId(row);
                      }
                      return <td key={c}>{String(val ?? '')}</td>;
                    })}
                    {showActions && (
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {form && !noEdit && <button className="btn btn-sm" onClick={() => startEdit(row)}>Edit</button>}
                          {row.copy_status === 'BORROWED' && (
                            <button className="btn btn-sm btn-primary" type="button" onClick={() => handleReturn(row)}>Return</button>
                          )}
                          {row.notification_type === 'BOOK_READY_ADMIN' && row.read_status !== 'Y' && (
                            <button className="btn btn-sm btn-primary" type="button" onClick={() => handleApproveBorrowal(row)}>Approve Borrowal</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && <div className="empty"><span className="empty-hint">NO ENTRIES</span>Nothing on this shelf yet.</div>}
      </div>
    </>
  );
}

function toSnake(text) { return text.toLowerCase().replaceAll(' ', '_'); }
function cast(values) {
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v !== '' && !Number.isNaN(Number(v)) && k.endsWith('_id') ? Number(v) : v]));
}
