function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { success: false, error: "Method not allowed" });
  }

  const secretKey = String(process.env.GHOSTSPAY_SECRET_KEY || "").trim();
  const companyId = String(process.env.GHOSTSPAY_COMPANY_ID || "").trim();
  if (!secretKey || !companyId) {
    return json(res, 500, { success: false, error: "GhostsPay credentials are not configured" });
  }

  const tx = String((req.query && (req.query.transaction_hash || req.query.id)) || "").trim();
  if (!tx) {
    return json(res, 400, { success: false, error: "transaction_hash is required" });
  }

  try {
    const credentials = Buffer.from(`${secretKey}:${companyId}`).toString("base64");
    const url = `https://api.ghostspaysv2.com/functions/v1/transactions/${encodeURIComponent(tx)}`;

    const gatewayResponse = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
    });

    const raw = await gatewayResponse.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { raw };
    }

    if (!gatewayResponse.ok) {
      return json(res, gatewayResponse.status, {
        success: false,
        error: data.error || data.message || "GhostsPay request failed",
        details: data,
      });
    }

    const record = data.data || data.transaction || data;
    return json(res, 200, {
      success: true,
      data: {
        status: record.status || null,
        paid_at: record.paidAt || null,
      },
    });
  } catch (error) {
    return json(res, 500, {
      success: false,
      error: error && error.message ? error.message : "Internal error",
    });
  }
};
