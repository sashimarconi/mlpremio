function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  }

  // Webhook endpoint kept lightweight: acknowledge quickly per provider recommendation.
  // If needed later, persist req.body into a database for audit/idempotency.
  return json(res, 200, { ok: true });
};
