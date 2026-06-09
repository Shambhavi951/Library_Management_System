import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar.jsx';
import { api } from '../api/client.js';

export default function DataPage({ title, crumb, endpoint, columns = [], form, method = 'POST', actionLabel = 'Submit', readOnly = false }) {
  const [rows, setRows] = useState([]);
  const defaultValues = Object.fromEntries((form || []).map((f) => [f.name, f.default || '']));
  const [values, setValues] = useState(defaultValues);
  const [message, setMessage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [expandedListId, setExpandedListId] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [publicationOptions, setPublicationOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);

  useEffect(() => {
    async function loadPublications() {
      if (form && form.some(f => f.name === 'publication_id')) {
        try {
          const pubs = await api('/catalog/publications');
          setPublicationOptions(pubs.map(p => ({ value: p.publication_id, label: p.title })));
        } catch (err) {
          console.error('Failed to load publications', err);
        }
      }
    }
    loadPublications();
  }, [form]);

  useEffect(() => {
    async function loadBranches() {
      if (form && form.some(f => f.name.endsWith('branch_id'))) {
        try {
          const branches = await api('/catalog/branches');
          setBranchOptions(branches.map(b => ({ value: b.branch_id, label: b.branch_name })));
        } catch (err) {
          console.error('Failed to load branches', err);
        }
      }
    }
    loadBranches();
  }, [form]);


  async function toggleExpandList(row) {
    const listId = row.reading_list_id;
    if (expandedListId === listId) {
      setExpandedListId(null);
      setListItems([]);
    } else {
      setExpandedListId(listId);
      try {
        const items = await api(`/member/reading-lists/${listId}/items`);
        setListItems(items);
      } catch (err) {
        setMessage({ text: err.message, type: 'error' });
      }
    }
  }

  async function handleRemoveItem(listId, itemId) {
    if (!confirm('Remove this book from the reading list?')) return;
    try {
      await api(`/member/reading-lists/${listId}/items/${itemId}`, { method: 'DELETE' });
      setMessage({ text: 'Book removed from list', type: 'success' });
      const items = await api(`/member/reading-lists/${listId}/items`);
      setListItems(items);
      await load();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  }

  function handleFieldChange(fieldName, val) {
    const newValues = { ...values, [fieldName]: val };
    if (endpoint === '/member/reviews' && fieldName === 'publication_id') {
      const existingReview = rows.find(r => Number(r.publication_id) === Number(val));
      if (existingReview) {
        setEditingId(existingReview.review_id);
        newValues.rating_value = existingReview.rating_value;
        newValues.review_text = existingReview.review_text;
        setMessage({ text: 'You already reviewed this book. Submitting will update your existing review.', type: 'info' });
      } else {
        setEditingId(null);
        newValues.rating_value = '';
        newValues.review_text = '';
        setMessage(null);
      }
    }
    setValues(newValues);
  }

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
    if (endpoint === '/member/reading-lists' && !editingId) {
      const isDuplicate = rows.some(r => r.list_name.trim().toLowerCase() === values.list_name.trim().toLowerCase());
      if (isDuplicate) {
        const confirmCreate = confirm(`A reading list named "${values.list_name}" already exists. Do you still want to create another one with the same name?`);
        if (!confirmCreate) return;
      }
    }
    try {
      const editConfig = getEditConfig(endpoint, editingId);
      const createConfig = getCreateConfig(endpoint, method);
      const submitMethod = editingId ? editConfig.method : createConfig.method;
      const submitUrl = editingId ? editConfig.url : createConfig.url;
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
    return row.member_id || row.account_id || row.branch_id || row.reservation_id || row.publication_id || row.id || row.copy_id || row.transfer_id || row.acquisition_request_id || row.reading_list_id || row.review_id || row.notification_id;
  }

  function startEdit(row) {
    const id = getRowId(row);
    setEditingId(id);
    setValues(Object.fromEntries(form.map((f) => [f.name, f.name === 'password' ? '' : getFormValue(row, f.name)])));
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

  async function runRowAction(action, row) {
    if (action.confirm && !confirm(action.confirm(row))) return;
    try {
      await api(action.url(row), { method: action.method || 'POST', body: action.body?.(row) });
      setMessage({ text: action.success || 'Updated', type: 'success' });
      await load();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  }

  const rowActions = getRowActions(endpoint, title);
  const canEdit = Boolean(form && isEditableEndpoint(endpoint, title));

  return (
    <>
      <Topbar title={title} crumb={crumb || 'The Reading Nook'} />
      {message && <div className={`toast-inline toast-${message.type || 'info'}`}>{message.text || message}</div>}
      {form && <form className="card" onSubmit={submit}>
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
              {field.name === 'publication_id' ? (
                <select disabled={readOnly} value={values[field.name]} onChange={(e) => handleFieldChange(field.name, e.target.value)} required>
                  <option value="">-- Select Book Title --</option>
                  {publicationOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : field.name.endsWith('branch_id') ? (
                <select disabled={readOnly} value={values[field.name]} onChange={(e) => handleFieldChange(field.name, e.target.value)} required>
                  <option value="">-- Select Branch --</option>
                  {branchOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : field.options ? (
                <select disabled={readOnly} value={values[field.name]} onChange={(e) => handleFieldChange(field.name, e.target.value)}>{field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              ) : (
                <input disabled={readOnly} type={field.type || 'text'} value={values[field.name]} onChange={(e) => handleFieldChange(field.name, e.target.value)} required={field.name !== 'password' && field.name !== 'phone_number'} />
              )}
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
                {(canEdit || rowActions.length || title === 'Notifications' || endpoint === '/member/reading-lists') && !readOnly && <th>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const rowId = getRowId(row);
                const isExpanded = expandedListId === rowId;
                return (
                  <tr key={rowId || i}>
                    {columns.map((c) => <td key={c}>{String(row[c] ?? row[toSnake(c)] ?? '')}</td>)}
                    {(canEdit || rowActions.length || title === 'Notifications' || endpoint === '/member/reading-lists') && !readOnly && (
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {endpoint === '/member/reading-lists' && (
                            <button className="btn btn-sm btn-primary" type="button" onClick={() => toggleExpandList(row)}>
                              {isExpanded ? 'Hide Books' : 'View Books'}
                            </button>
                          )}
                          {canEdit && <button className="btn btn-sm" onClick={() => startEdit(row)}>Edit</button>}
                          {row.copy_status === 'BORROWED' && (
                            <button className="btn btn-sm btn-primary" type="button" onClick={() => handleReturn(row)}>Return</button>
                          )}
                          {row.notification_type === 'BOOK_READY_ADMIN' && row.read_status !== 'Y' && (
                            <button className="btn btn-sm btn-primary" type="button" onClick={() => handleApproveBorrowal(row)}>Approve Borrowal</button>
                          )}
                          {rowActions.filter((action) => !action.show || action.show(row)).map((action) => (
                            <button className={`btn btn-sm ${action.variant || ''}`} type="button" key={action.label} onClick={() => runRowAction(action, row)}>{action.label}</button>
                          ))}
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
      {expandedListId && (
        <div className="card" style={{ marginTop: '1.5rem', border: '1px dashed var(--brown-warm)' }}>
          <div className="card-header">
            <div>
              <div className="card-sub">LIST DETAILS</div>
              <div className="card-title">Books in Reading List</div>
            </div>
            <button className="btn btn-sm" onClick={() => { setExpandedListId(null); setListItems([]); }}>Close Detail View</button>
          </div>
          <div className="table-wrap">
            <table className="small-table">
              <thead>
                <tr>
                  <th>TITLE</th>
                  <th>PUBLISHER</th>
                  <th>YEAR</th>
                  <th>ISBN</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {listItems.length > 0 ? (
                  listItems.map((item) => (
                    <tr key={item.item_id}>
                      <td>{item.title}</td>
                      <td>{item.publisher_name}</td>
                      <td>{item.publication_year}</td>
                      <td>{item.isbn}</td>
                      <td>
                        <button className="btn btn-sm btn-danger" type="button" onClick={() => handleRemoveItem(expandedListId, item.item_id)}>Remove</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-subtle)' }}>
                      No books in this list. Browse the <strong>Public Catalog</strong> or <strong>Catalog</strong> page and click <strong>"Add to List"</strong> to save books here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function toSnake(text) { return text.toLowerCase().replaceAll(' ', '_'); }
function cast(values) {
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v !== '' && !Number.isNaN(Number(v)) && k.endsWith('_id') ? Number(v) : v]));
}

function getFormValue(row, fieldName) {
  const aliases = {
    title: 'requested_title',
    author: 'requested_author',
    isbn: 'requested_isbn'
  };
  return row[fieldName] ?? row[aliases[fieldName]] ?? '';
}

function getCreateConfig(endpoint, fallbackMethod) {
  if (endpoint === '/admin/inventory') return { url: '/admin/copies', method: 'POST' };
  if (endpoint === '/catalog/branches') return { url: '/owner/branches', method: 'POST' };
  return { url: endpoint, method: fallbackMethod };
}

function getEditConfig(endpoint, id) {
  if (endpoint === '/admin/inventory') return { url: `/admin/copies/${id}`, method: 'PATCH' };
  if (endpoint === '/member/reviews') return { url: '/member/reviews', method: 'POST' };
  if (endpoint === '/member/acquisitions') return { url: `/member/acquisitions/${id}`, method: 'PUT' };
  return { url: `${endpoint}/${id}`, method: 'PUT' };
}

function isEditableEndpoint(endpoint, title) {
  if (title === 'Quality Checks') return false;
  return [
    '/member/reading-lists',
    '/member/reviews',
    '/member/acquisitions',
    '/admin/inventory',
    '/admin/publications',
    '/admin/members',
    '/owner/members',
    '/owner/admins'
  ].includes(endpoint);
}

function getRowActions(endpoint, title) {
  const actions = [];
  if (endpoint === '/member/reservations') {
    actions.push({
      label: 'Cancel',
      method: 'DELETE',
      url: (row) => `/member/reservations/${row.reservation_id}`,
      show: (row) => ['QUEUED', 'ON_HOLD'].includes(row.reservation_status),
      confirm: (row) => `Cancel reservation for "${row.title || 'this title'}"?`,
      success: 'Reservation canceled'
    });
  }
  if (endpoint === '/member/transfers') {
    actions.push({
      label: 'Cancel',
      method: 'DELETE',
      url: (row) => `/member/transfers/${row.transfer_id}`,
      show: (row) => ['REQUESTED', 'APPROVED'].includes(row.transfer_status),
      confirm: (row) => `Cancel transfer for "${row.title || 'this copy'}"?`,
      success: 'Transfer canceled'
    });
  }
  if (endpoint === '/member/reading-lists') {
    actions.push({ label: 'Delete', method: 'DELETE', url: (row) => `/member/reading-lists/${row.reading_list_id}`, confirm: (row) => `Delete reading list "${row.list_name}"?`, success: 'Reading list deleted' });
  }
  if (endpoint === '/member/reviews') {
    actions.push({ label: 'Delete', method: 'DELETE', url: (row) => `/member/reviews/${row.review_id}`, confirm: () => 'Delete this review?', success: 'Review deleted' });
  }
  if (endpoint === '/member/acquisitions') {
    actions.push({
      label: 'Cancel',
      method: 'DELETE',
      url: (row) => `/member/acquisitions/${row.acquisition_request_id}`,
      show: (row) => ['REQUESTED', 'UNDER_REVIEW'].includes(row.request_status),
      confirm: (row) => `Cancel request for "${row.requested_title}"?`,
      success: 'Acquisition request canceled'
    });
  }
  if (endpoint === '/admin/inventory') {
    actions.push({ label: 'Remove', method: 'DELETE', url: (row) => `/admin/copies/${row.copy_id}`, show: (row) => !['BORROWED', 'ON_HOLD', 'IN_TRANSIT'].includes(row.copy_status), confirm: (row) => `Remove copy #${row.copy_id}?`, success: 'Copy removed' });
  }
  if (endpoint === '/admin/publications') {
    actions.push({ label: 'Delete', method: 'DELETE', url: (row) => `/admin/publications/${row.publication_id}`, confirm: (row) => `Delete publication "${row.title}"?`, success: 'Publication removed' });
  }
  if (endpoint === '/admin/members' || endpoint === '/owner/members') {
    actions.push({ label: 'Deactivate', method: 'DELETE', url: (row) => `${endpoint}/${row.member_id}`, confirm: (row) => `Deactivate ${row.first_name} ${row.last_name}?`, success: 'Member deactivated' });
  }
  if (endpoint === '/owner/admins') {
    actions.push({ label: 'Deactivate', method: 'DELETE', url: (row) => `/owner/admins/${row.account_id}`, confirm: (row) => `Deactivate admin ${row.username}?`, success: 'Admin deactivated' });
  }
  if (endpoint === '/catalog/branches') {
    actions.push({ label: 'Deactivate', method: 'DELETE', url: (row) => `/owner/branches/${row.branch_id}`, show: (row) => row.branch_status !== 'INACTIVE', confirm: (row) => `Deactivate branch "${row.branch_name}"?`, success: 'Branch deactivated' });
  }
  if (title === 'Notifications') {
    actions.push({
      label: 'Mark Read',
      method: 'PATCH',
      url: (row) => `${endpoint}/${row.notification_id}/read`,
      show: (row) => row.read_status !== 'Y',
      success: 'Notification marked as read'
    });
  }
  if (endpoint === '/admin/transfers') {
    ['APPROVED', 'IN_TRANSIT', 'ARRIVED', 'SHELVED', 'READY_FOR_PICKUP'].forEach((status) => actions.push({
      label: status.replaceAll('_', ' '),
      method: 'PATCH',
      url: (row) => `/admin/transfers/${row.transfer_id}`,
      body: () => ({ transfer_status: status }),
      show: (row) => row.transfer_status !== status,
      success: 'Transfer status updated'
    }));
  }
  if (endpoint === '/admin/acquisitions') {
    ['UNDER_REVIEW', 'ORDERED', 'ARRIVED', 'CATALOGED', 'AVAILABLE', 'REJECTED'].forEach((status) => actions.push({
      label: status.replaceAll('_', ' '),
      method: 'PATCH',
      url: (row) => `/admin/acquisitions/${row.acquisition_request_id}`,
      body: () => ({ request_status: status }),
      show: (row) => row.request_status !== status,
      success: 'Acquisition status updated'
    }));
  }
  return actions;
}
