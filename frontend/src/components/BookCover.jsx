import { useState } from 'react';
import { covers } from '../api/client.js';

export default function BookCover({ book }) {
  const [failed, setFailed] = useState(false);
  const src = covers.byIsbn(book?.isbn);
  if (src && !failed) {
    return <div className="book-cover"><img src={src} alt={`${book.title} cover`} onError={() => setFailed(true)} /></div>;
  }
  return (
    <div className="book-cover generated-cover">
      <span className="cover-kicker">The Reading Nook</span>
      <strong>{book?.title || 'Untitled'}</strong>
      <em>{book?.authors || 'Library Edition'}</em>
    </div>
  );
}

