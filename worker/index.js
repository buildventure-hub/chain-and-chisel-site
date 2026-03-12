// Chain & Chisel — Worker Router
// Routes:
//   POST chainandchisel.art/api/send → email + CRM
//   POST chainandchisel.art/api/chat → AI chatbot

import { handleSend } from "./send.js";
import { handleChat } from "./chat.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/send") return handleSend(request, env);
    if (url.pathname === "/api/chat") return handleChat(request, env);

    return new Response("Not found", { status: 404 });
  }
};
