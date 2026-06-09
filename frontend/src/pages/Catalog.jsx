import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar.jsx';
import BookCover from '../components/BookCover.jsx';
import { api } from '../api/client.js';
import { displayBranch } from '../utils/branches.js';
import { useAuth } from '../context/authStore.js';

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
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [books, setBooks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(user?.branch_id || '');
  const [message, setMessage] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [readingLists, setReadingLists] = useState([]);

  useEffect(() => {
    if (user?.branch_id) {
      setBranchId(user.branch_id);
    }
  }, [user?.branch_id]);

  useEffect(() => { api('/catalog/branches').then(setBranches).catch(() => {}); }, []);
  useEffect(() => { api('/catalog/publications').then(setSuggestions).catch(() => {}); }, []);
  useEffect(() => {
    if (!publicMode) {
      api('/member/reading-lists').then(setReadingLists).catch(() => {});
    }
  }, [publicMode]);

  useEffect(() => { load(); }, [branchId, availableOnly]);

  async function load() {
    const params = new URLSearchParams({ 
      q, 
      ...(branchId ? { branchId } : {}),
      availableOnly: availableOnly ? 'true' : 'false'
    });
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

  async function handleAddToList(publicationId, listId) {
    if (!listId) return;
    try {
      await api(`/member/reading-lists/${listId}/items`, {
        method: 'POST',
        body: { publication_id: publicationId }
      });
      setMessage({ text: 'Added to reading list successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  }

  return (
    <div className={publicMode ? 'main-content' : ''}>
      <Topbar title={publicMode ? 'Public Catalog' : 'Catalog'} crumb="Available books and branch intelligence" />
      {message && <div className={`toast-inline toast-${message.type || 'info'}`}>{message.text || message}</div>}
      
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--brown-warm)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <button 
            className={`btn btn-sm ${!availableOnly ? 'btn-primary' : ''}`} 
            style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
            type="button" 
            onClick={() => setAvailableOnly(false)}
          >
            All Books
          </button>
          <button 
            className={`btn btn-sm ${availableOnly ? 'btn-primary' : ''}`} 
            style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
            type="button" 
            onClick={() => setAvailableOnly(true)}
          >
            Available Only
          </button>
        </div>
        
        <div className="mini-form">
          <div className="form-field">
            <label>Search</label>
            <input list="book-suggestions" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, author, or ISBN" />
            <datalist id="book-suggestions">
              {suggestions.map((p) => <option key={p.publication_id} value={p.title} />)}
            </datalist>
          </div>
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
              {!publicMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  <div className="btn-row">
                    <button className="btn btn-sm btn-primary" onClick={() => action('/member/borrow', { publication_id: book.publication_id, branch_id: Number(branchId || book.first_available_branch_id || 1) }, 'Borrowed successfully')}>Borrow</button>
                    <button className="btn btn-sm" onClick={() => action('/member/reservations', { publication_id: book.publication_id, branch_id: Number(branchId || 1) }, 'Reservation joined')}>Reserve</button>
                  </div>
                  {readingLists.length > 0 && (
                    <select 
                      style={{ 
                        padding: '4px 6px', 
                        fontSize: '11px', 
                        border: '1px solid var(--brown-warm)', 
                        background: 'var(--parchment)', 
                        color: 'var(--ink-subtle)',
                        borderRadius: '2px',
                        cursor: 'pointer'
                      }}
                      defaultValue=""
                      onChange={(e) => {
                        handleAddToList(book.publication_id, e.target.value);
                        e.target.value = ""; // Reset dropdown
                      }}
                    >
                      <option value="" disabled>Add to list...</option>
                      {readingLists.map(l => (
                        <option key={l.reading_list_id} value={l.reading_list_id}>{l.list_name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

