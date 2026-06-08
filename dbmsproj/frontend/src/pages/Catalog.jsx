import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar.jsx';
import BookCover from '../components/BookCover.jsx';
import { api } from '../api/client.js';
import { displayBranch } from '../utils/branches.js';

export default function Catalog({ publicMode = false }) {
  const [q, setQ] = useState('');
  const [books, setBooks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [message, setMessage] = useState(null);
  useEffect(() => { api('/catalog/branches').then(setBranches).catch(() => {}); }, []);
  useEffect(() => { load(); }, [branchId]);
  async function load() {
    const params = new URLSearchParams({ q, ...(branchId ? { branchId } : {}) });
    setBooks(await api(`/catalog/books?${params}`));
  }
  async function action(path, body, label) {
    try {
      await api(path, { method: 'POST', body });
      setMessage({ text: label, type: 'success' });
      await load();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  }
  return (
    <div className={publicMode ? 'main-content' : ''}>
      <Topbar title={publicMode ? 'Public Catalog' : 'Catalog'} crumb="Available books and branch intelligence" />
      {message && <div className={`toast-inline toast-${message.type || 'info'}`}>{message.text || message}</div>}
      <div className="card">
        <div className="mini-form">
          <div className="form-field"><label>Search</label><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, author, or ISBN" /></div>
          <div className="form-field"><label>Branch</label><select value={branchId} onChange={(e) => setBranchId(e.target.value)}><option value="">All branches</option>{branches.map((b) => <option key={b.branch_id} value={b.branch_id}>{displayBranch(b.branch_name)}</option>)}</select></div>
          <button className="btn btn-primary" onClick={load}>Search</button>
        </div>
      </div>
      <div className="book-grid">
        {books.map((book) => (
          <article className="book-card-visual" key={book.publication_id}>
            <BookCover book={book} />
            <div className="book-info">
              <div className="book-info-title">{book.title}</div>
              <div className="book-info-author">{book.authors || 'Unknown author'}</div>
              <span className={`status-pill ${book.available_copies > 0 ? 'ok' : 'n'}`}>{book.available_copies || 0} available</span>
              {!publicMode && <div className="btn-row">
                <button className="btn btn-sm btn-primary" onClick={() => action('/member/borrow', { publication_id: book.publication_id, branch_id: Number(branchId || book.first_available_branch_id || 1) }, 'Borrowed successfully')}>Borrow</button>
                <button className="btn btn-sm" onClick={() => action('/member/reservations', { publication_id: book.publication_id, branch_id: Number(branchId || 1) }, 'Reservation joined')}>Reserve</button>
              </div>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

