# The Reading Nook REST API

Base URL: `http://localhost:4000/api`

Auth uses `Authorization: Bearer <accessToken>`.

## Auth

- `POST /auth/register` creates a member.
- `POST /auth/login` accepts `{ email, password, login_type }`, where `login_type` is `member`, `admin`, or `owner`. The selected login type must match the account role.
- `POST /auth/refresh` returns new access and refresh tokens.
- `GET /auth/me` returns the current session profile.
- `POST /auth/logout` clears the client session.

## Catalog

- `GET /catalog/branches`
- `GET /catalog/books?q=&branchId=&availableOnly=`
- `GET /catalog/books/:publicationId`
- `GET /catalog/books/:publicationId/intelligence`

## Member

- `POST /member/borrow`
- `POST /member/borrow/hold`
- `GET /member/history`
- `GET /member/fines`
- `POST /member/reservations`
- `GET /member/reservations`
- `DELETE /member/reservations/:reservationId`
- `POST /member/switch-branch`
- `POST /member/upgrade`
- `POST /member/transfers`
- `GET /member/transfers`
- `POST /member/acquisitions`
- `GET /member/acquisitions`
- `GET /member/notifications`
- `PATCH /member/notifications/:notificationId/read`
- `POST /member/reviews`
- `GET /member/reviews`
- `POST /member/reading-lists`
- `GET /member/reading-lists`
- `POST /member/reading-lists/:listId/items`

## Admin

Admins are branch-scoped. They can only manage copies, returns, transfers, and acquisitions related to their own branch.

- `GET /admin/inventory`
- `POST /admin/publications`
- `POST /admin/copies`
- `PATCH /admin/copies/:copyId`
- `POST /admin/returns`
- `GET /admin/quality-checks`
- `POST /admin/quality-checks`
- `GET /admin/transfers`
- `PATCH /admin/transfers/:transferId`
- `GET /admin/acquisitions`
- `PATCH /admin/acquisitions/:requestId`
- `GET /admin/analytics`

## Owner

- `GET /owner/analytics`
- `GET /owner/admins`
- `POST /owner/admins`
- `POST /owner/settings`
- `POST /owner/branches`

