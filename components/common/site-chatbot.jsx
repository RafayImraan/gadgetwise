"use client";

import { useMemo, useState } from "react";
import { faqItems } from "@/lib/site-data";

const QUICK_PROMPTS = [
  "Track my order",
  "Payment methods",
  "Return policy"
];

function findReply(message) {
  const text = String(message || "").toLowerCase();
  if (!text.trim()) {
    return "Ask about tracking, payments, delivery, or returns.";
  }

  if (text.includes("track") || text.includes("order")) {
    return faqItems.find((item) => item.question.toLowerCase().includes("track"))?.answer;
  }
  if (text.includes("payment") || text.includes("cod") || text.includes("easy")) {
    return faqItems.find((item) => item.question.toLowerCase().includes("payment"))?.answer;
  }
  if (text.includes("return") || text.includes("refund") || text.includes("exchange")) {
    return faqItems.find((item) => item.question.toLowerCase().includes("return"))?.answer;
  }

  return "I can help with tracking, payments, delivery, and returns. Try a quick prompt.";
}

export default function SiteChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello, I am Gadgetwise Concierge. How can I help you today?"
    }
  ]);

  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

  const send = (content) => {
    const text = String(content || input).trim();
    if (!text) {
      return;
    }
    const user = { id: `u-${Date.now()}`, role: "user", text };
    const bot = { id: `b-${Date.now() + 1}`, role: "assistant", text: findReply(text) };
    setMessages((current) => [...current, user, bot]);
    setInput("");
  };

  return (
    <>
      <button
        type="button"
        className="site-chatbot-fab"
        aria-label={open ? "Close chat support" : "Open chat support"}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M4 5h16v10H8l-4 4V5zm3 4h10v2H7V9z" />
        </svg>
      </button>

      {open ? (
        <aside className="site-chatbot-panel">
          <header>
            <h3>Gadgetwise Concierge</h3>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              x
            </button>
          </header>

          <div className="site-chatbot-body">
            {hasMessages
              ? messages.map((message) => (
                  <p key={message.id} className={message.role === "assistant" ? "assistant" : "user"}>
                    {message.text}
                  </p>
                ))
              : null}
          </div>

          <div className="site-chatbot-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" onClick={() => send(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="site-chatbot-input"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask your question"
              aria-label="Ask your question"
            />
            <button type="submit">Send</button>
          </form>
        </aside>
      ) : null}
    </>
  );
}
