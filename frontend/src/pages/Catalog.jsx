import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar.jsx';
import BookCover from '../components/BookCover.jsx';
import { api } from '../api/client.js';
import { displayBranch } from '../utils/branches.js';

function StarRating({ avg, count }) {
  if (!count || count === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px', minHeight: '18px' }}>
        <span style={{ fontSize: '12px', color: 'var(--ink-soft)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
          No reviews yet
        </span>
      </div>
    );
  }

  const rating = parseFloat(avg) || 0;
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
      <span style={{ letterSpacing: '1px', fontSize: '14px', lineHeight: 1 }}>
        {'★'.repeat(full)}
        {half ? '½' : ''}
        <span style={{ color: 'var(--parchment-3)' }}>{'★'.repeat(empty)}</span>
      </span>
      <span style={{
        fontFamily: 'var(--font-caps)',
        fontSize: '10px',
        letterSpacing: '.18em',
        color: 'var(--ink-soft)'
      }}>
        {rating.toFixed(1)} ({count} {count === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}

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
              <StarRating avg={book.avg_rating} count={book.review_count} />
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

