// Chain & Chisel — Email + CRM Worker
// Route: chainandchisel.art/api/send
// Handles: Resend emails (notification + auto-reply) + Airtable CRM record

const CORS = {
  "Access-Control-Allow-Origin": "https://chainandchisel.art",
  "Content-Type": "application/json",
};

export default {
  async fetch(request, env) {

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "https://chainandchisel.art",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), { status: 405, headers: CORS });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), { status: 400, headers: CORS });
    }

    const {
      from_name     = "",
      from_email    = "",
      phone         = "",
      street        = "",
      city          = "",
      zip           = "",
      species       = "",
      circumference = "",
      condition     = "Not specified",
      message       = "",
      newsletter    = false,
    } = body;

    const results = { email_notify: false, email_reply: false, crm: false };
    const errors  = [];

    // ── 1. Notification → Anthony ──────────────────────────────────────────
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from:     "Chain & Chisel <noreply@chainandchisel.art>",
          to:       ["admin@chainandchisel.art"],
          reply_to: from_email,
          subject:  `New Commission Request — ${from_name}`,
          html:     buildNotificationEmail({ from_name, from_email, phone, street, city, zip, species, circumference, condition, message, newsletter }),
        }),
      });
      if (res.ok) { results.email_notify = true; }
      else { errors.push(`notify: ${await res.text()}`); }
    } catch (e) { errors.push(`notify: ${e.message}`); }

    // ── 2. Auto-reply → Customer ───────────────────────────────────────────
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from:     "Anthony @ Chain & Chisel <admin@chainandchisel.art>",
          to:       [from_email],
          reply_to: "admin@chainandchisel.art",
          subject:  "Got your message! (I'm probably covered in sawdust right now)",
          html:     buildAutoReplyEmail({ from_name, from_email, phone, species, circumference, condition, message }),
        }),
      });
      if (res.ok) { results.email_reply = true; }
      else { errors.push(`reply: ${await res.text()}`); }
    } catch (e) { errors.push(`reply: ${e.message}`); }

    // ── 3. Airtable CRM ────────────────────────────────────────────────────
    try {
      const address = [street, city, zip].filter(Boolean).join(", ");
      const res = await fetch(
        `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent("Commissions")}`,
        {
          method: "POST",
          headers: { "Authorization": `Bearer ${env.AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              "Full Name":      from_name,
              "Email":          from_email,
              "Phone":          phone,
              "Address":        address,
              "Species":        species,
              "Circumference":  circumference,
              "Condition":      condition.startsWith("Dry") ? "Dry" : condition.startsWith("Green") ? "Green" : "Not specified",
              "Description":    message,
              "Newsletter":     newsletter === true || newsletter === "true",
              "Status":         "Todo",
              "Source":         "Website Form",
              "Date Submitted": new Date().toISOString().split("T")[0],
            },
          }),
        }
      );
      if (res.ok) { results.crm = true; }
      else { errors.push(`crm: ${await res.text()}`); }
    } catch (e) { errors.push(`crm: ${e.message}`); }

    // ── Response ───────────────────────────────────────────────────────────
    const emailOk = results.email_notify || results.email_reply;
    return new Response(
      JSON.stringify({ ok: emailOk, results, errors: errors.length ? errors : undefined }),
      { status: emailOk ? 200 : 500, headers: CORS }
    );
  }
};

// ── Email templates ────────────────────────────────────────────────────────
function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function buildNotificationEmail({ from_name, from_email, phone, street, city, zip, species, circumference, condition, message, newsletter }) {
  const addr = [street, city, zip].filter(s => s && s !== "Not provided").join(", ") || "Not provided";
  return `<div style="font-family:system-ui,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f10;border:1px solid rgba(255,255,255,0.12);border-radius:8px;overflow:hidden;">
  <div style="background:#0f0f10;padding:20px 32px;border-bottom:1px solid rgba(255,255,255,0.12);">
    <p style="margin:0;color:#d4a96a;font-size:18px;font-weight:700;">New Commission Request</p>
    <p style="margin:4px 0 0;color:#bdbdbd;font-size:13px;">chainandchisel.art contact form</p>
  </div>
  <div style="background:#171718;padding:28px 32px;color:#f3f3f3;font-size:15px;line-height:1.6;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="color:#bdbdbd;width:38%;padding:6px 12px 6px 0;font-weight:700;vertical-align:top;">Name</td><td style="padding:6px 0;">${esc(from_name)}</td></tr>
      <tr><td style="color:#bdbdbd;padding:6px 12px 6px 0;font-weight:700;vertical-align:top;">Email</td><td style="padding:6px 0;"><a href="mailto:${esc(from_email)}" style="color:#d4a96a;">${esc(from_email)}</a></td></tr>
      <tr><td style="color:#bdbdbd;padding:6px 12px 6px 0;font-weight:700;vertical-align:top;">Phone</td><td style="padding:6px 0;">${esc(phone)}</td></tr>
      <tr><td style="color:#bdbdbd;padding:6px 12px 6px 0;font-weight:700;vertical-align:top;">Address</td><td style="padding:6px 0;">${esc(addr)}</td></tr>
      <tr><td style="color:#bdbdbd;padding:6px 12px 6px 0;font-weight:700;vertical-align:top;">Species</td><td style="padding:6px 0;">${esc(species || "Not provided")}</td></tr>
      <tr><td style="color:#bdbdbd;padding:6px 12px 6px 0;font-weight:700;vertical-align:top;">Circumference</td><td style="padding:6px 0;">${esc(circumference || "Not provided")}</td></tr>
      <tr><td style="color:#bdbdbd;padding:6px 12px 6px 0;font-weight:700;vertical-align:top;">Condition</td><td style="padding:6px 0;">${esc(condition)}</td></tr>
      <tr><td style="color:#bdbdbd;padding:6px 12px 6px 0;font-weight:700;vertical-align:top;border-top:1px solid rgba(255,255,255,0.08);">Project</td><td style="padding:6px 0;border-top:1px solid rgba(255,255,255,0.08);">${esc(message)}</td></tr>
      <tr><td style="color:#bdbdbd;padding:6px 12px 6px 0;font-weight:700;vertical-align:top;">Newsletter</td><td style="padding:6px 0;">${newsletter ? "✅ Opted in" : "No"}</td></tr>
    </table>
    <p style="margin:24px 0 0;color:#bdbdbd;font-size:13px;">Reply to this email to respond directly to ${esc(from_name)}.</p>
  </div>
</div>`;
}

function buildAutoReplyEmail({ from_name, from_email, phone, species, circumference, condition, message }) {
  return `<div style="margin:0;padding:0;background:#0f0f10;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#0f0f10;border:1px solid rgba(255,255,255,0.12);border-radius:8px;overflow:hidden;">
    <div style="background:#0f0f10;padding:28px 32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.12);">
      <img src="https://chainandchisel.art/assets/brand/chain-and-chisel-logo.png" alt="Chain &amp; Chisel Art" style="max-width:260px;width:100%;height:auto;display:block;margin:0 auto;" />
    </div>
    <div style="background:#171718;padding:32px 36px;color:#f3f3f3;line-height:1.6;font-size:15px;">
      <p style="margin:0 0 20px 0;font-size:16px;">Hi ${esc(from_name)},</p>
      <p style="margin:0 0 20px 0;">I received your message — thanks for reaching out to <a href="https://chainandchisel.art" style="color:#d4a96a;text-decoration:none;">Chain &amp; Chisel Art</a>!</p>
      <p style="margin:0 0 28px 0;">I'm probably covered in sawdust at the moment, however, I personally review every request and I'll get back to you within <strong>48 hours</strong>. Feel free to text or call me anytime! (720) 334-6313</p>
      <div style="background:#0f0f10;border-left:3px solid rgba(255,255,255,0.20);border-radius:4px;padding:20px 24px;margin:0 0 28px 0;">
        <p style="margin:0 0 4px 0;color:#bdbdbd;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">Here's what I received</p>
        <table style="width:100%;border-collapse:collapse;margin-top:14px;">
          <tr style="line-height:2.2;"><td style="color:#bdbdbd;font-weight:700;width:38%;vertical-align:top;padding-right:12px;">Name:</td><td style="color:#f3f3f3;">${esc(from_name)}</td></tr>
          <tr style="line-height:2.2;"><td style="color:#bdbdbd;font-weight:700;vertical-align:top;padding-right:12px;">Email:</td><td style="color:#f3f3f3;">${esc(from_email)}</td></tr>
          <tr style="line-height:2.2;"><td style="color:#bdbdbd;font-weight:700;vertical-align:top;padding-right:12px;">Phone:</td><td style="color:#f3f3f3;">${esc(phone)}</td></tr>
          <tr style="line-height:2.2;"><td style="color:#bdbdbd;font-weight:700;vertical-align:top;padding-right:12px;">Species:</td><td style="color:#f3f3f3;">${esc(species || "Not provided")}</td></tr>
          <tr style="line-height:2.2;"><td style="color:#bdbdbd;font-weight:700;vertical-align:top;padding-right:12px;">Condition:</td><td style="color:#f3f3f3;">${esc(condition)}</td></tr>
          <tr style="line-height:2.2;"><td style="color:#bdbdbd;font-weight:700;vertical-align:top;padding-right:12px;">Circumference:</td><td style="color:#f3f3f3;">${esc(circumference || "Not provided")}</td></tr>
          <tr style="line-height:2.2;"><td style="color:#bdbdbd;font-weight:700;vertical-align:top;padding-right:12px;">Project:</td><td style="color:#f3f3f3;">${esc(message)}</td></tr>
        </table>
      </div>
    </div>
    <div style="background:#0f0f10;border-top:1px solid rgba(255,255,255,0.12);padding:20px 36px;color:#bdbdbd;font-size:13px;line-height:1.8;">
      <p style="margin:0;color:#f3f3f3;font-weight:700;">Anthony Purro</p>
      <p style="margin:0;">(720) 334-6313</p>
      <p style="margin:0;"><a href="https://chainandchisel.art" style="color:#d4a96a;text-decoration:none;">chainandchisel.art</a></p>
      <p style="margin:0;color:#bdbdbd;">Chainsaw Art &amp; Custom Carvings</p>
    </div>
  </div>
</div>`;
}
