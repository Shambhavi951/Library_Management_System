import { query } from '../database/db.js';

export async function upsertReview(memberId, payload) {
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
