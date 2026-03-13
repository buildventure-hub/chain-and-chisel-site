// Chain & Chisel — Chat Widget
// Drop this script on any page to add the floating chat button + panel

(function () {
  const API      = "https://chainandchisel.art/api/chat";
  const LEAD_API = "https://chainandchisel.art/api/chat-lead";
  const GOLD = "#d4a96a";
  const BG   = "#0f0f10";
  const PANEL = "#171718";
  const STROKE = "rgba(255,255,255,0.12)";

  // ── Inject styles ──────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    @keyframes cc-pulse {
      0%, 100% { filter: drop-shadow(0 0 4px rgba(212,169,106,0.25)); }
      50%       { filter: drop-shadow(0 0 14px rgba(212,169,106,0.9)) drop-shadow(0 0 28px rgba(212,169,106,0.45)); }
    }
    #cc-chat-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      height: auto;
      border-radius: 6px;
      background: url('/assets/buttons/plank-button-1.png') center/100% 100% no-repeat;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px 40px;
      animation: cc-pulse 3s ease-in-out infinite;
      transition: transform 0.15s ease;
    }
    #cc-chat-btn:hover {
      transform: scale(1.04);
      animation-play-state: paused;
      filter: brightness(1.1) drop-shadow(0 0 16px rgba(212,169,106,0.9));
    }
    #cc-chat-btn .cc-btn-text { text-align: center; }
    #cc-chat-btn .cc-btn-text strong {
      display: block;
      font-size: 19px;
      font-weight: 800;
      color: #1a1209;
      font-family: system-ui, sans-serif;
      line-height: 1.2;
      white-space: nowrap;
      text-shadow: 0 0 8px rgba(224,192,128,0.95), 0 1px 3px rgba(224,192,128,0.8);
    }
    #cc-chat-btn .cc-btn-text span {
      display: block;
      font-size: 16px;
      font-weight: 700;
      color: #2a1a08;
      font-family: system-ui, sans-serif;
      line-height: 1.2;
      white-space: nowrap;
      text-shadow: 0 0 8px rgba(224,192,128,0.95), 0 1px 3px rgba(224,192,128,0.8);
    }

    #cc-chat-panel {
      position: fixed;
      bottom: 90px;
      right: 24px;
      z-index: 9998;
      width: 340px;
      max-width: calc(100vw - 32px);
      height: 480px;
      max-height: calc(100vh - 120px);
      background: ${PANEL};
      border: 1px solid ${STROKE};
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.6);
      transform: scale(0.92) translateY(12px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }
    #cc-chat-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    #cc-chat-header {
      padding: 14px 16px;
      border-bottom: 1px solid ${STROKE};
      display: flex;
      align-items: center;
      gap: 10px;
      background: ${BG};
      flex-shrink: 0;
    }
    #cc-chat-header .cc-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${GOLD};
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    #cc-chat-header .cc-title { flex: 1; }
    #cc-chat-header .cc-title strong {
      display: block;
      font-size: 14px;
      color: #f3f3f3;
      font-family: system-ui, sans-serif;
    }
    #cc-chat-header .cc-title span {
      display: block;
      font-size: 11px;
      color: ${GOLD};
      font-family: system-ui, sans-serif;
    }
    #cc-close-btn {
      background: none;
      border: none;
      color: #bdbdbd;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      line-height: 1;
      font-size: 18px;
      transition: color 0.1s;
    }
    #cc-close-btn:hover { color: #f3f3f3; }

    #cc-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
    }
    #cc-messages::-webkit-scrollbar { width: 4px; }
    #cc-messages::-webkit-scrollbar-track { background: transparent; }
    #cc-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

    .cc-msg {
      max-width: 86%;
      padding: 10px 13px;
      border-radius: 12px;
      font-size: 13.5px;
      line-height: 1.5;
      font-family: system-ui, sans-serif;
      word-break: break-word;
    }
    .cc-msg.bot {
      align-self: flex-start;
      background: rgba(255,255,255,0.07);
      color: #f3f3f3;
      border-bottom-left-radius: 3px;
    }
    .cc-msg.user {
      align-self: flex-end;
      background: ${GOLD};
      color: #1a1a1a;
      font-weight: 500;
      border-bottom-right-radius: 3px;
    }
    .cc-msg a { color: ${GOLD}; }
    .cc-msg.user a { color: #1a1a1a; text-decoration: underline; }

    .cc-typing {
      align-self: flex-start;
      display: flex;
      gap: 4px;
      padding: 10px 14px;
      background: rgba(255,255,255,0.07);
      border-radius: 12px;
      border-bottom-left-radius: 3px;
    }
    .cc-typing span {
      width: 6px;
      height: 6px;
      background: #bdbdbd;
      border-radius: 50%;
      animation: cc-bounce 1.2s infinite;
    }
    .cc-typing span:nth-child(2) { animation-delay: 0.2s; }
    .cc-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes cc-bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
      30% { transform: translateY(-5px); opacity: 1; }
    }

    #cc-input-row {
      padding: 12px;
      border-top: 1px solid ${STROKE};
      display: flex;
      gap: 8px;
      align-items: flex-end;
      flex-shrink: 0;
      background: ${BG};
    }
    #cc-input {
      flex: 1;
      background: rgba(255,255,255,0.07);
      border: 1px solid ${STROKE};
      border-radius: 8px;
      color: #f3f3f3;
      font-size: 13.5px;
      font-family: system-ui, sans-serif;
      padding: 9px 12px;
      resize: none;
      outline: none;
      min-height: 38px;
      max-height: 100px;
      line-height: 1.4;
      transition: border-color 0.15s;
    }
    #cc-input:focus { border-color: rgba(212,169,106,0.5); }
    #cc-input::placeholder { color: #666; }
    #cc-send-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: ${GOLD};
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, opacity 0.15s;
    }
    #cc-send-btn:hover { background: #e0b87a; }
    #cc-send-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    #cc-chat-footer {
      padding: 6px 12px 10px;
      text-align: center;
      font-size: 10.5px;
      color: #555;
      font-family: system-ui, sans-serif;
      background: ${BG};
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(style);

  // ── Build DOM ──────────────────────────────────────────────────────────────
  // Float button
  const btn = document.createElement("button");
  btn.id = "cc-chat-btn";
  btn.setAttribute("aria-label", "Chat with us");
  btn.innerHTML = `<div class="cc-btn-text">
    <strong>Chat is open!</strong>
    <span>Let's carve it out!</span>
  </div>`;

  // Panel
  const panel = document.createElement("div");
  panel.id = "cc-chat-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Chain & Chisel chat");
  panel.innerHTML = `
    <div id="cc-chat-header">
      <div class="cc-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="#1a1a1a"/>
        </svg>
      </div>
      <div class="cc-title">
        <strong>Chain &amp; Chisel Art</strong>
        <span>Custom Chainsaw Carving · Denver, CO</span>
      </div>
      <button id="cc-close-btn" aria-label="Close chat">✕</button>
    </div>
    <div id="cc-messages"></div>
    <div id="cc-input-row">
      <textarea id="cc-input" placeholder="Ask about a custom piece…" rows="1"></textarea>
      <button id="cc-send-btn" aria-label="Send">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="#1a1a1a"/>
        </svg>
      </button>
    </div>
    <div id="cc-chat-footer">Powered by Chain &amp; Chisel AI · <a href="https://chainandchisel.art/order.html" style="color:#d4a96a;text-decoration:none;">Submit full request →</a></div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  // ── State ──────────────────────────────────────────────────────────────────
  const messages = []; // {role, content}
  let isOpen = false;
  let isLoading = false;
  let leadSubmitted = false; // prevent duplicate submissions
  const contact = { name: "", email: "", phone: "" }; // populated as bot collects info

  const messagesEl = panel.querySelector("#cc-messages");
  const inputEl    = panel.querySelector("#cc-input");
  const sendBtn    = panel.querySelector("#cc-send-btn");
  const closeBtn   = panel.querySelector("#cc-close-btn");

  // ── Helpers ────────────────────────────────────────────────────────────────
  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = `cc-msg ${role}`;
    // Simple link detection
    div.innerHTML = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement("div");
    div.className = "cc-typing";
    div.id = "cc-typing-indicator";
    div.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById("cc-typing-indicator");
    if (t) t.remove();
  }

  function setLoading(val) {
    isLoading = val;
    sendBtn.disabled = val;
    inputEl.disabled = val;
  }

  // ── Open / Close ───────────────────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    panel.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    if (messages.length === 0) {
      // Greeting
      const greetings = [
        "Hey! Welcome to Chain & Chisel — I'm here to help you find the perfect custom carving. First things first, what's your name?",
        "Hi there! Great to see you. I'm here to help bring your vision to life with Anthony's custom chainsaw art. What can I call you?",
        "Welcome! You've come to the right place for one-of-a-kind hand-carved art. I'd love to help — what's your name?",
        "Hey, welcome! Whether you've got a specific idea or you're just exploring, I'm here to help. What's your name?",
        "Hi! Glad you stopped by. Anthony carves some incredible custom pieces — let's figure out what's perfect for you. What do I call you?",
        "Hello! Custom chainsaw carving is what we do best around here. I'd love to chat — mind sharing your name first?",
        "Hey there! You're in the right spot for something truly one-of-a-kind. What's your name so I can make this feel a little less like talking to a robot?",
        "Welcome to Chain & Chisel! I'm here to help you explore what Anthony can create for you. What's your name?",
      ];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      addMessage("bot", greeting);
      messages.push({ role: "assistant", content: greeting });
    }
    setTimeout(() => inputEl.focus(), 200);
  }

  function submitLead() {
    // Submit any real conversation — even a single message can be a complete lead
    const userMsgCount = messages.filter(m => m.role === "user").length;
    if (leadSubmitted || userMsgCount < 1) return;
    leadSubmitted = true;

    // Try to extract contact info from conversation if not already set
    if (!contact.email || !contact.name) {
      const fullText = messages.map(m => m.content).join(" ");
      const emailMatch = fullText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
      const phoneMatch = fullText.match(/(\+?1?\s?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/);
      if (emailMatch && !contact.email) contact.email = emailMatch[0];
      if (phoneMatch && !contact.phone) contact.phone = phoneMatch[0];
    }

    navigator.sendBeacon
      ? navigator.sendBeacon(LEAD_API, new Blob([JSON.stringify({ messages, contact })], { type: "application/json" }))
      : fetch(LEAD_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, contact }), keepalive: true }).catch(() => {});
  }

  function closeChat() {
    submitLead();
    isOpen = false;
    panel.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }

  btn.addEventListener("click", () => isOpen ? closeChat() : openChat());
  closeBtn.addEventListener("click", closeChat);

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (isOpen && !panel.contains(e.target) && !btn.contains(e.target)) closeChat();
  });

  // Submit lead if user navigates away mid-conversation
  window.addEventListener("pagehide", submitLead);
  window.addEventListener("beforeunload", submitLead);

  // ── Send message ───────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isLoading) return;

    inputEl.value = "";
    inputEl.style.height = "auto";
    addMessage("user", text);
    messages.push({ role: "user", content: text });

    setLoading(true);
    showTyping();

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      removeTyping();

      if (res.status === 429) {
        addMessage("bot", "You've sent a lot of messages! Take a breather and try again in a bit, or reach out directly at (720) 334-6313.");
        return;
      }

      const data = await res.json();

      if (!res.ok || data.error) {
        addMessage("bot", "Something hiccupped on my end. You can reach Anthony directly at (720) 334-6313 or admin@chainandchisel.art.");
        return;
      }

      addMessage("bot", data.reply);
      messages.push({ role: "assistant", content: data.reply });

      // Extract contact info from the full conversation as it builds
      const fullText = messages.map(m => m.content).join(" ");
      const emailMatch = fullText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
      const phoneMatch = fullText.match(/(\+?1?\s?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/);
      if (emailMatch) contact.email = emailMatch[0];
      if (phoneMatch) contact.phone = phoneMatch[0];

    } catch (e) {
      removeTyping();
      addMessage("bot", "Can't connect right now. Reach Anthony directly at (720) 334-6313 or admin@chainandchisel.art.");
    } finally {
      setLoading(false);
      inputEl.focus();
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + "px";
  });

})();
