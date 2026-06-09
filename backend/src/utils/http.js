export function ok(res, data, status = 200) {
  res.status(status).json({ data });
}

export function created(res, data) {
  ok(res, data, 201);
}

