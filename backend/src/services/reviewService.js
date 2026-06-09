import { query } from '../database/db.js';
import { badRequest } from '../utils/errors.js';

export async function upsertReview(memberId, payload) {
  // Check if member has borrowed this publication
  const [borrowed] = await query(
    `SELECT 1 FROM borrowing_records br
     JOIN inventory_copies ic ON ic.copy_id = br.copy_id
     WHERE br.member_id = @memberId AND ic.publication_id = @publicationId
     LIMIT 1`,
    { memberId, publicationId: payload.publication_id }
  );
  if (!borrowed) {
    throw badRequest('You can only review books that you have borrowed or are currently borrowing.');
  }

  const [existing] = await query(
    'SELECT review_id FROM publication_reviews WHERE publication_id = @publicationId AND member_id = @memberId',
    { publicationId: payload.publication_id, memberId }
  );
  if (existing) {
    const [updated] = await query(
      `UPDATE publication_reviews SET rating_value = @rating, review_text = @text
       OUTPUT INSERTED.*
       WHERE review_id = @reviewId`,
      { reviewId: existing.review_id, rating: payload.rating_value, text: payload.review_text }
    );
    return updated;
  }
  const [created] = await query(
    `INSERT INTO publication_reviews(publication_id, member_id, rating_value, review_text)
     OUTPUT INSERTED.*
     VALUES(@publicationId,@memberId,@rating,@text)`,
    { publicationId: payload.publication_id, memberId, rating: payload.rating_value, text: payload.review_text }
  );
  return created;
}

export async function memberReviews(memberId) {
  return query(
    `SELECT r.*, p.title
     FROM publication_reviews r
     JOIN publications p ON p.publication_id = r.publication_id
     WHERE r.member_id = @memberId
     ORDER BY r.review_id DESC`,
    { memberId }
  );
}

export async function deleteReview(memberId, reviewId) {
  const result = await query(
    `DELETE FROM publication_reviews
     OUTPUT DELETED.review_id
     WHERE review_id = @reviewId AND member_id = @memberId`,
    { reviewId, memberId }
  );
  if (!result.length) return { deleted: false };
  return { deleted: true };
}
