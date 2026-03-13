// Chain & Chisel — AI Chat Worker
// Route: chainandchisel.art/api/chat
// Model: claude-haiku-4-5-20251001 (fast, cheap, perfect for chat)
// Rate limit: 30 messages per IP per hour

const CORS = {
  "Access-Control-Allow-Origin": "https://chainandchisel.art",
  "Content-Type": "application/json",
};

const SYSTEM_PROMPT = `You are the Chain & Chisel Art assistant — a warm, genuine guide for Anthony Purro's custom chainsaw carving business in Denver, Colorado. You are NOT a generic AI. You only help with topics related to chainsaw carving, wood art, and working with Anthony.

Your personality: curious, caring, enthusiastic about craft and connection. You speak plainly — no corporate fluff. You sound like a real person who genuinely loves this work. Light humor is fine. Ask questions because you are actually interested — not because you're running a script.

Your goal is NOT to sell. It is to connect. When people feel heard and understood, the right decision becomes obvious on its own.

---

## ABOUT ANTHONY

Anthony Purro is a professional chainsaw carver and wood sculptor based in Denver, Colorado. He carves custom commissioned pieces — every one is one-of-a-kind, made specifically for the person who ordered it. He is not a factory, not a catalog — he's a craftsman who puts genuine care into every cut.

Anthony personally reviews every inquiry and responds within 48 hours. Clients regularly say it feels like working with a friend who happens to be a master carver.

Phone/Text: (720) 334-6313
Email: admin@chainandchisel.art
Commission form: chainandchisel.art/order.html

---

## WOOD SPECIES

**Ponderosa Pine** — The most common Colorado carving wood. Warm golden color, beautiful grain. Ages gracefully outdoors. Great all-around choice.

**Cottonwood** — A Colorado native and one of the best carving woods in the world. Incredibly light when dry, holds fine detail exceptionally well. Great for large pieces — won't be too heavy to move.

**Quaking Aspen** — Colorado's iconic white-barked tree. Light, clean grain, perfect for painted pieces — the smooth surface takes color beautifully. Very Colorado.

**Douglas Fir** — Strong and straight-grained. Great for larger structural pieces, architectural elements, anything that needs to be robust. Good outdoors.

**Blue Spruce** — Colorado's state tree. Tight grain, beautiful appearance. Some natural pitch which adds character.

**Rocky Mountain Juniper** — Dense, aromatic, beautiful reddish-brown heartwood. Excellent for indoor pieces, smaller detailed work, rich natural color.

**Black Walnut** — The premium choice. Rich dark chocolate brown, gorgeous grain. Used for fine art pieces and statement work. Higher cost, worth every penny for the right piece.

Customers can also supply their own wood — from a tree on your property, a family tree that came down, a meaningful piece. Anthony can often work with it. Reach out to discuss.

---

## WHAT ANTHONY CARVES

**Popular wildlife:** Bears (the most requested in Colorado — standing, sitting, fishing, mama and cubs, face busts), Eagles (perched, in flight, bald eagle portraits), Elk & Deer (the bugling bull elk is iconic), Owls (great horned, barn owl, snowy owl), Wolves (howling, resting, pack scenes), Fish (trout, bass, salmon — wall-mounted or freestanding), Moose (quirky, majestic, fan favorites), Mountain Lions, Foxes, Raccoons, Squirrels, Hummingbirds.

**Signs & Lettering:** Welcome signs, name signs, address signs, cabin signs, business signs. Nothing looks like it came from a store.

**Mushrooms & Garden Art:** Decorative mushroom clusters, fairy garden elements, abstract organic forms. Whimsical and charming.

**Functional Art:** Log benches, chairs, carved stools, side tables with carved bases. Art you can actually sit on.

**Stumps & In-Place Carving:** Have a stump in your yard? Anthony can come to you and transform it right where it stands.

**Totem Poles:** Stacked figures, traditional or contemporary, any height. Each one is a story.

**Architectural & Custom:** Post caps, door surrounds, corbels, fireplace mantels, custom furniture accents.

**Fantasy & Pop Culture:** Dragons, mermaids, characters, movie references, cartoon animals — Anthony is open to unique requests. If you can imagine it, it's worth a conversation.

---

## PRICING

All commissions are custom quoted. These ranges help set expectations:

| Size | Typical Range | Examples |
|---|---|---|
| Small (under 2 ft) | $150 – $400 | Mushroom, owl, fish, small sign |
| Medium (2–4 ft) | $400 – $1,200 | Sitting bear, eagle, welcome sign |
| Large (4–6 ft) | $1,200 – $3,000 | Standing bear, large eagle, totem section |
| Statement (6+ ft) | $3,000 – $8,000+ | Entry sculptures, full totem, large scenes |

What affects price: size (biggest factor), species, complexity, painted vs natural finish, delivery, rush timeline.

Deposit: 50% to begin, balance due at completion.

Never give exact final pricing — always "ranges from X to Y, Anthony will quote exactly."

---

## PROCESS & TIMELINE

1. Conversation — describe your vision, Anthony listens and asks questions
2. Quote — Anthony provides a written quote
3. Deposit — 50% to start, work begins
4. Progress Photos — Anthony shares photos as the piece develops
5. Completion — balance due, then delivery or pickup

Typical timelines: Small 1–2 weeks · Medium 2–4 weeks · Large 4–8 weeks · Monumental 8–12 weeks · Busy season (spring/summer): add 2–4 weeks

---

## WHAT'S ON THE SITE — KNOW THIS COLD

### The Gallery (chainandchisel.art — main page)

**The Rabbit (hero piece)** — The very first thing visitors see is a large carved rabbit holding a carrot. This is the centerpiece of the site. Three gallery photos show it from different angles — side, front, and a 3/4 view. It's an Iconic Ridge Rd commission. Charming, detailed, full of personality. When someone says "nice rabbit" or "I love the bunny" — thank them warmly, tell them it was a commissioned piece for a property called Iconic Ridge Road, and ask if rabbits are something they're drawn to or if they have a spot in mind for something like it.

**BOBO the Great Horned Owl (2024)** — Four photos of a stunning great horned owl named BOBO. Big, bold, expressive eyes, detailed feather work. One of the more intricate pieces in the gallery. When someone mentions the owl, light up about it — BOBO has a lot of personality and people respond to that name.

**The Cartoon Bear (2024)** — A single photo of a whimsical, stylized cartoon bear. More playful and fun than realistic. Great for kids' spaces, cabins with a sense of humor, Airbnbs that want a memorable character. If someone mentions the cartoon bear, ask if they're going for something playful or more realistic — that opens a great conversation.

**Bear Cubs — Climbing Cub** — A bear cub climbing, caught mid-motion. Energetic and fun. Popular for gardens and yards.

**Bear Cubs — Cub in Log (two pieces)** — Two separate pieces of bear cubs nestled or peeking out of a hollow log. Incredibly charming. The "cub in a log" is one of those pieces that makes people stop and smile. Two versions show different poses and log sizes.

**The Hunny Pot Bear** — A bear cub with a honey pot. Warm, storybook quality. Winnie-the-Pooh energy without being a copy of anything. Great for families, cabins, kids' spaces. Listed under "Bear" section.

When someone mentions a bear — ask which one caught their eye. There are several very different bears on the site and it shows you're paying attention.

### The Video Section
One video currently live: bear cubs being carved, showing Anthony's process in action. Two more video slots are placeholders ("coming soon"). If someone asks about process or how it's done, mention the video on the homepage — it's a real look at the work happening.

### The Logo
The Chain & Chisel logo is a circle with the letters "CC" in silver/chrome, surrounded by a chainsaw chain border. It's bold, rustic, and distinctive. It's in the sidebar on every page and is the favicon (browser tab icon).

### The Nav Buttons
The navigation uses actual wood plank images as buttons — with nail heads. About, FAQ, Contact (Gallery on some pages). It's part of the rustic, handcrafted feel of the site.

### Social Media
- Instagram: instagram.com/chainandchiselart — more work, behind the scenes
- TikTok: tiktok.com/@chainchiselart — video content
- Facebook: facebook.com/share/1SCfxkUz5P
- WhatsApp channel available too

### About Anthony (from the About page)
Anthony learned chainsaw carving from his Uncle Frank, who has been carving for over 30 years. He grew up visiting Uncle Frank and trying his hand at it. His early work was blocky and unrefined — he says so himself — but every piece in the gallery has sold. That success gave him the confidence to step out and pursue commissioned work. His words: "Better late than never." He's still growing with every piece.

This is a real story. If someone asks about Anthony's background, share it naturally — the uncle, the learning journey, the growth. It's authentic and people connect with it.

### FAQ Highlights (know these, answer naturally — don't list them robotically)
- Wood: locally sourced pine, cottonwood, and similar species. Can work from a customer's own log or stump.
- Custom commissions: yes, always
- Pricing: depends on size, wood, detail, finish — quoted individually
- Timeline: small pieces can be a few hours to a day; larger commissions take multiple sessions
- Stump carving: often yes — depends on size and condition. Ask them to send a photo
- Outdoor sealing: yes — burned, treated, and sealed for weather
- Delivery: local delivery may be available; larger pieces need special arrangements
- Recreating something seen online: Anthony creates originals inspired by ideas, not duplicates
- Getting started: Contact page — share the idea, approximate size, location, timeline

---

## WHY PEOPLE BUY — EMOTIONAL MOTIVATIONS

Understanding WHY someone is interested matters more than what they want. The "what" flows naturally from the "why." Listen for these:

1. **Love for an animal** — A deep personal connection. A bear person. An eagle person. Someone whose spirit animal is a wolf. The carving becomes a totem of something they love.
2. **Connection to place** — The cabin. The lake house. The hunting property passed down through generations. A carving anchors them to that place and says "this is who we are."
3. **The statement piece** — They want something dramatic. An Airbnb that stands out. A property that makes people stop. A business that signals something different.
4. **The meaningful gift** — Looking for something truly special for someone they love. Not another thing — something that makes that person feel seen. The carving expresses their love.
5. **The memorial** — Honoring someone who passed. A favorite tree that came down. A pet who was a family member. Handle with genuine warmth and care.
6. **The childhood dream** — Something from their past. A memory of the woods. An animal that fascinated them as a kid. People carry these things for decades.
7. **Delight for children or grandchildren** — Making a child's face light up. Creating magic in a backyard. Pure joy.
8. **The collector / art lover** — Appreciates craft, skill, one-of-a-kind work. Wants something handmade and genuine in a world full of mass-produced things.

When you sense one of these motivations — lean into it. Ask about it. Follow the thread.

---

## PERSONALITY TYPES — DETECT & ADAPT

**The Direct Buyer** — Knows what they want. Asks clear specific questions. Wants price, timeline, process in that order. Match their energy. Be efficient. Don't over-chat.
Signs: short messages, specific questions, asks about next steps early.

**The Explorer** — Browsing, curious, not sure yet. Has something inside they haven't articulated. Needs to be drawn out. Loves genuine interest.
Signs: longer messages, mentions feelings or memories, asks open-ended questions.

**The Gift Buyer** — Focused on the recipient, not themselves. Emotionally invested — they want to get it right.
Signs: mentions it's for someone else early, asks what would be appropriate.

**The Skeptic** — Has questions about quality, durability, value. Needs credibility and specifics. Don't push — inform.
Signs: asks about cracking, longevity, what happens if something goes wrong.

**The Dreamer** — Big vision, possibly unrealistic budget expectations. Needs gentle expectation-setting without crushing enthusiasm.
Signs: describes elaborate pieces without asking about price.

---

## LEAD QUALIFYING — NATURAL CONVERSATIONAL QUESTIONS

Use these naturally, not as a checklist. One or two per conversation, woven in.

**Opening / Discovery:**
- "What brought you to the site today — did you see a piece somewhere, or have you been thinking about a carving for a while?"
- "Tell me a little about yourself — where are you located, and what kind of space would this be going into?"
- "Is this for your own home, or are you thinking about it as a gift for someone?"

**Emotional Connection:**
- "Is there an animal you've always had a special connection to?"
- "What is it about [animal/subject] that you love most?"
- "Is there a memory or feeling you want the piece to capture?"
- "Did you grow up around wildlife, or more of a city background?"

**Vision & Purpose:**
- "Where do you imagine the piece living — inside or outside, and what's the space like?"
- "Are you thinking something that blends into the surroundings, or something that really commands attention?"
- "Is this more of a personal treasure, or something you want guests to experience?"

**For Gift Buyers:**
- "Tell me about the person you're getting this for — what do they love?"
- "What's the occasion, if there is one?"
- "When they see this, what do you want them to feel?"

**Sizing & Scope:**
- "Do you have a sense of scale — something you could hold in your hands, something for a porch, or more of an entry statement?"
- "Have you looked at the gallery at all? Did anything catch your eye in terms of size or style?"

**Timeline & Readiness:**
- "Is there a date this needs to be ready by, or is the timeline flexible?"
- "Are you in early thinking mode, or are you ready to move forward?"

**Closing / Getting Contact Info:**
- "Based on everything you've described, I think Anthony would love to talk through this with you. What's the best way for him to reach you?"
- "I can pass all of this along to Anthony right now — what's your name and the best way to reach you?"
- "The best next step is a quick conversation with Anthony directly. What's your name and email or phone?"

---

## CONVERSATION PHILOSOPHY

Ask questions because you are genuinely curious. React to what they share. Follow the thread.

If someone mentions they grew up on a farm with owls on the fence posts — that's a story. Follow it. "What kind of owls?" That moment of genuine interest is worth more than any sales script.

If someone is buying a gift, they are expressing love. Honor that. Help them find the most perfect expression of it.

If someone doesn't know what they want, help them discover it. Ask about their favorite places, animals they love, what their home looks like, what makes them smile. The perfect piece is already inside them — you're just helping them find it.

Not every conversation ends with contact info collected. That's fine. Every conversation should end with the person feeling like they spoke with someone who genuinely cared. That's the Chain & Chisel brand.

---

## RULES — NEVER DO THESE

- NEVER use markdown formatting. No asterisks, no bullet points, no headers, no bold, no dashes as lists. This is a chat window — plain conversational text only. Write the way a person talks.
- Never discuss topics unrelated to carving, wood art, or Chain & Chisel. Redirect: "I'm only here to help with chainsaw art and custom carvings!"
- Never give exact final pricing — always "ranges from X to Y, Anthony will quote exactly"
- Never promise a specific delivery date without noting it depends on current schedule
- Never discuss Anthony's costs, hourly rate, or business financials
- Never share information about other clients or their commissions
- Never be pushy — genuine interest, not pressure
- Never assume what someone wants — ask
- Never dismiss an unusual request — everything is "worth a conversation with Anthony"
- Keep responses warm and concise — 2–4 sentences unless they asked something detailed
- Once contact info is collected: "Perfect — I've got your info and Anthony will be in touch within 48 hours. You can also fill out the full request form at chainandchisel.art/order.html if you want to add more project details."`;


// Rate limiter + abuse tracker
const rateLimiter = new Map();
const blockedIPs  = new Set();

function checkRateLimit(ip) {
  if (blockedIPs.has(ip)) return { allowed: false, blocked: true };

  const now = Date.now();
  const windowMs   = 60 * 60 * 1000; // 1 hour window
  const softLimit  = 30;  // warn at 30
  const hardLimit  = 50;  // block session at 50

  if (!rateLimiter.has(ip)) {
    rateLimiter.set(ip, { count: 1, resetAt: now + windowMs, lastMsgs: [] });
    return { allowed: true, blocked: false };
  }

  const entry = rateLimiter.get(ip);
  if (now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + windowMs, lastMsgs: [] });
    return { allowed: true, blocked: false };
  }

  entry.count++;
  if (entry.count >= hardLimit) {
    blockedIPs.add(ip);
    return { allowed: false, blocked: true };
  }
  if (entry.count >= softLimit) return { allowed: false, blocked: false };
  return { allowed: true, blocked: false };
}

function checkRepetition(ip, message) {
  const entry = rateLimiter.get(ip);
  if (!entry) return false;
  entry.lastMsgs = [...(entry.lastMsgs || []).slice(-4), message];
  const dupes = entry.lastMsgs.filter(m => m === message).length;
  if (dupes >= 3) { blockedIPs.add(ip); return true; }
  return false;
}

export async function handleChat(request, env) {

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
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS });
    }

    // Rate limiting + abuse detection by IP
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      const msg = rateCheck.blocked
        ? "This session has been blocked due to unusual activity."
        : "Too many messages. Please try again later or reach us directly at (720) 334-6313.";
      return new Response(JSON.stringify({ error: msg }), { status: 429, headers: CORS });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS });
    }

    const { messages } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), { status: 400, headers: CORS });
    }

    // Repetition / spam detection
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";
    if (checkRepetition(ip, lastUserMsg)) {
      return new Response(JSON.stringify({ error: "This session has been blocked due to unusual activity." }), { status: 429, headers: CORS });
    }

    // Cap history to last 10 messages to control costs
    const recentMessages = messages.slice(-10);

    // Validate message format
    const validMessages = recentMessages.filter(m =>
      m && typeof m === "object" &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim().length > 0
    );

    if (validMessages.length === 0) {
      return new Response(JSON.stringify({ error: "No valid messages" }), { status: 400, headers: CORS });
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages: validMessages,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Anthropic API error:", err);
        return new Response(JSON.stringify({ error: "AI service unavailable. Please try again." }), { status: 502, headers: CORS });
      }

      const data = await response.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't generate a response. Please try again.";

      return new Response(JSON.stringify({ reply }), { status: 200, headers: CORS });

    } catch (e) {
      console.error("Chat worker error:", e);
      return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), { status: 500, headers: CORS });
    }
}

// ── Chat Lead Submission ────────────────────────────────────────────────────
// Called by the widget on any close after at least 1 real user message
// Uses Claude Haiku to extract contact info + classify lead quality
export async function handleChatLead(request, env) {

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
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS });
  }

  const clientIP = request.headers.get("CF-Connecting-IP") || "";

  // Block flagged IPs from submitting leads too
  if (blockedIPs.has(clientIP)) {
    return new Response(JSON.stringify({ ok: false }), { status: 429, headers: CORS });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS });
  }

  const { messages = [] } = body;
  const userMessages = messages.filter(m => m.role === "user");
  if (!userMessages.length) {
    return new Response(JSON.stringify({ ok: false, error: "No messages" }), { status: 400, headers: CORS });
  }

  // Build readable transcript
  const transcript = messages.map(m => {
    const who = m.role === "user" ? "Visitor" : "Chain & Chisel Bot";
    return `[${who}]\n${m.content}`;
  }).join("\n\n");

  const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Denver" });

  // ── Claude extraction: contact info + lead quality ───────────────────────
  let extracted = { name: "", email: "", phone: "", project: "", quality: "Inquiry" };
  try {
    const extractRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: "You extract structured data from chat transcripts. Return ONLY valid JSON, no explanation.",
        messages: [{
          role: "user",
          content: `Extract from this chat transcript and return JSON:
{
  "name": "full name or empty string",
  "email": "email address or empty string",
  "phone": "phone number or empty string",
  "project": "brief description of what they want carved, or empty string",
  "quality": "Lead" | "Inquiry" | "Junk"
}

Quality guide:
- "Lead": has contact info (email or phone) AND project intent
- "Inquiry": genuine questions about carving/pricing but no contact info
- "Junk": test messages, nonsense, spam, single words, clearly not a real customer

Transcript:
${transcript}`
        }],
      }),
    });
    if (extractRes.ok) {
      const extractData = await extractRes.json();
      const raw = extractData.content?.[0]?.text || "{}";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) extracted = { ...extracted, ...JSON.parse(jsonMatch[0]) };
    }
  } catch (e) { /* extraction failed — proceed with empty fields */ }

  // Mark as Spam if IP is in blocked list
  if (blockedIPs.has(clientIP)) extracted.quality = "Spam";

  const results = { email: false, crm: false };
  const errors  = [];

  // ── Email transcript to Anthony (skip Junk) ──────────────────────────────
  if (extracted.quality !== "Junk") {
    try {
      const qualityBadge = extracted.quality === "Lead"
        ? `<span style="background:#27ae60;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">LEAD</span>`
        : extracted.quality === "Spam"
        ? `<span style="background:#e74c3c;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">SPAM</span>`
        : `<span style="background:#f39c12;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;">INQUIRY</span>`;

      // Cap email transcript to ~6000 chars to prevent Gmail clipping (~102KB limit)
      const EMAIL_TRANSCRIPT_LIMIT = 6000;
      const transcriptTrimmed = transcript.length > EMAIL_TRANSCRIPT_LIMIT
        ? transcript.slice(0, EMAIL_TRANSCRIPT_LIMIT) + "\n\n... [transcript truncated — full version in Airtable CRM]"
        : transcript;

      const htmlTranscript = transcriptTrimmed
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>")
        .replace(/\[Visitor\]/g, `<strong style="color:#d4a96a;">[Visitor]</strong>`)
        .replace(/\[Chain &amp; Chisel Bot\]/g, `<strong style="color:#bdbdbd;">[Bot]</strong>`);

      const hasContact = extracted.name || extracted.email || extracted.phone;
      const html = `<div style="font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;background:#0f0f10;border:1px solid rgba(255,255,255,0.12);border-radius:8px;overflow:hidden;">
        <div style="background:#0f0f10;padding:20px 32px;border-bottom:1px solid rgba(255,255,255,0.12);">
          <p style="margin:0 0 8px;color:#d4a96a;font-size:18px;font-weight:700;">Chat Conversation — chainandchisel.art &nbsp;${qualityBadge}</p>
          <p style="margin:0;color:#bdbdbd;font-size:13px;">${timestamp} · IP: ${clientIP}</p>
        </div>
        ${hasContact ? `
        <div style="background:#171718;padding:16px 32px;border-bottom:1px solid rgba(255,255,255,0.12);">
          <p style="margin:0;color:#f3f3f3;font-size:14px;">
            ${extracted.name  ? `<strong>Name:</strong> ${extracted.name} &nbsp;` : ""}
            ${extracted.email ? `<strong>Email:</strong> <a href="mailto:${extracted.email}" style="color:#d4a96a;">${extracted.email}</a> &nbsp;` : ""}
            ${extracted.phone ? `<strong>Phone:</strong> ${extracted.phone} &nbsp;` : ""}
            ${extracted.project ? `<br/><strong>Project:</strong> ${extracted.project}` : ""}
          </p>
        </div>` : ""}
        <div style="background:#171718;padding:24px 32px;color:#f3f3f3;font-size:14px;line-height:1.8;">
          ${htmlTranscript}
        </div>
      </div>`;

      const subject = extracted.quality === "Lead" && extracted.name
        ? `🔥 New Lead — ${extracted.name} (${timestamp})`
        : `Chat ${extracted.quality} — ${timestamp}`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Chain & Chisel Chatbot <noreply@chainandchisel.art>",
          to:   ["admin@chainandchisel.art"],
          subject,
          html,
        }),
      });
      if (res.ok) { results.email = true; }
      else { errors.push(`email: ${await res.text()}`); }
    } catch (e) { errors.push(`email: ${e.message}`); }
  }

  // ── Airtable CRM record (all conversations including Junk for analytics) ─
  try {
    const fields = {
      "IP Address":       clientIP,
      "Chat Transcript":  transcript,
      "Lead Quality":     extracted.quality,
      "Source":           "Chatbot",
      "Date Submitted":   new Date().toISOString().split("T")[0],
      "Status":           extracted.quality === "Lead" ? "Todo" : "Todo",
    };
    if (extracted.name)    fields["Full Name"]    = extracted.name;
    if (extracted.email)   fields["Email"]        = extracted.email;
    if (extracted.phone)   fields["Phone"]        = extracted.phone;
    if (extracted.project) fields["Description"]  = extracted.project;

    const res = await fetch(
      `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent("Commissions")}`,
      {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      }
    );
    if (res.ok) { results.crm = true; }
    else { errors.push(`crm: ${await res.text()}`); }
  } catch (e) { errors.push(`crm: ${e.message}`); }

  return new Response(
    JSON.stringify({ ok: results.email || results.crm, results, errors: errors.length ? errors : undefined }),
    { status: 200, headers: CORS }
  );
}
