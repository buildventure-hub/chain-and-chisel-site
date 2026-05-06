// Chain & Chisel — Worker Router
// Routes:
//   POST chainandchisel.art/api/send → email + CRM
//   POST chainandchisel.art/api/chat → AI chatbot

import { handleSend } from "./send.js";
import { handleChat, handleChatLead } from "./chat.js";
import { handleModelRepository, handleModelRepositoryUpload } from "./model-repository.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/send")      return handleSend(request, env);
    if (url.pathname === "/api/chat")      return handleChat(request, env);
    if (url.pathname === "/api/chat-lead") return handleChatLead(request, env);
    if (url.pathname === "/api/model-repository") return handleModelRepository(request, env);
    if (url.pathname === "/api/model-repository-upload") return handleModelRepositoryUpload(request, env);

    return new Response("Not found", { status: 404 });
  }
};
