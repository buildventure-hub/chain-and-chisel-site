/**
 * Cloudflare Pages Function: POST /api/order
 *
 * Validates Turnstile token server-side (required),
 * then sends an email via Resend.
 *
 * Add these environment variables in Cloudflare Pages:
 *  - TURNSTILE_SECRET_KEY
 *  - RESEND_API_KEY
 *  - RESEND_FROM
 *  - ORDER_TO  (set to info@chainandchisel.art)
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    if (!body || !body.turnstileToken) {
      return json({ ok: false, error: "Missing verification token." }, 400);
    }

    // Turnstile server-side validation (Siteverify)
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY || "",
        response: body.turnstileToken,
      }),
    });

    const verify = await verifyRes.json();
    if (!verify.success) {
      return json({ ok: false, error: "Verification failed." }, 403);
    }

    const lines = [
      "CONTACT",
      `Name: ${(body.firstName || "").trim()} ${(body.lastName || "").trim()}`.trim(),
      `Phone: ${body.phone || ""}`,
      "",
      "ADDRESS",
      `Street: ${body.street || ""}`,
      `City: ${body.city || ""}`,
      `ZIP: ${body.zip || ""}`,
      "",
      "TREE / MATERIAL",
      `Species requested: ${body.species || ""}`,
      `Trunk circumference: ${body.circumference || ""}`,
      `Tree dry (sitting for years): ${body.treeDry ? "Yes" : "No"}`,
      `Tree green (freshly cut): ${body.treeGreen ? "Yes" : "No"}`,
      "",
      "DESCRIPTION",
      `${body.description || ""}`,
    ];

    const subject = "Chain & Chisel Order Request";
    const text = lines.join("\n");

    const resendKey = env.RESEND_API_KEY;
    const to = env.ORDER_TO || "info@chainandchisel.art";
    const from = env.RESEND_FROM;

    if (!resendKey || !from) {
      return json({ ok: false, error: "Server email is not configured yet (missing RESEND_* vars)." }, 500);
    }

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
      }),
    });

    if (!sendRes.ok) {
      const t = await sendRes.text().catch(() => "");
      return json({ ok: false, error: "Email send failed. " + t }, 502);
    }

    return json({ ok: true }, 200);
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
