function traceContext(req) {
  // simplu: atașăm un request-id dacă nu există
  const id = req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return id;
}
module.exports = { traceContext };
