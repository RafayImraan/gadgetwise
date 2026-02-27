"use client";

import { useMemo, useState } from "react";

const QUICK_PROMPTS = [
  "How do I track my order?",
  "Which payment methods are available?",
  "What is your return policy?"
];

function getAssistantReply(message, items) {
  const text = String(message || "").trim().toLowerCase();
  if (!text) {
    return "Ask me anything about orders, shipping, payments, or returns.";
  }

  const keywordMap = [
    { keys: ["track", "tracking", "order status"], fallback: "How can I track my order?" },
    { keys: ["payment", "pay", "cod", "easy paisa", "jazzcash", "stripe"], fallback: "Which payment methods do you accept?" },
    { keys: ["return", "refund", "exchange"], fallback: "How do returns and exchanges work?" },
    { keys: ["delivery", "shipping"], fallback: "How can I track my order?" }
  ];

  for (const entry of keywordMap) {
    if (entry.keys.some((key) => text.includes(key))) {
      const found = items.find((item) =>
        item.question.toLowerCase().includes(entry.fallback.toLowerCase().slice(0, 10))
      );
      if (found) {
        return found.answer;
      }
    }
  }

  const exact = items.find(
    (item) =>
      item.question.toLowerCase().includes(text) || text.includes(item.question.toLowerCase().slice(0, 12))
  );
  if (exact) {
    return exact.answer;
  }

  return "I can help with tracking, delivery, payments, account, and returns. Try one of the quick prompts below.";
}

export default function FaqClient({ items = [] }) {
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "m1",
      role: "assistant",
      text: "Welcome to Gadgetwise Concierge. Ask me anything about your order, delivery, or payments."
    }
  ]);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return items;
    }
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(search) || item.answer.toLowerCase().includes(search)
    );
  }, [items, query]);

  const sendMessage = (content) => {
    const text = String(content || chatInput).trim();
    if (!text) {
      return;
    }

    const userMessage = { id: `u-${Date.now()}`, role: "user", text };
    const assistantMessage = {
      id: `a-${Date.now() + 1}`,
      role: "assistant",
      text: getAssistantReply(text, items)
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setChatInput("");
  };

  return (
    <main className="section-block faq-premium-page">
      <section className="faq-premium-head panel-card">
        <p className="eyebrow">Luxury Support Hub</p>
        <h1>Frequently Asked Questions</h1>
        <p>
          Find instant answers or chat with the premium assistant for tracking, payment, and
          return guidance.
        </p>
      </section>

      <section className="faq-premium-layout">
        <article className="panel-card faq-premium-left">
          <div className="faq-search-row">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search FAQs"
              aria-label="Search FAQs"
            />
          </div>

          <div className="faq-accordion">
            {filteredItems.map((item, index) => (
              <article key={item.question} className="faq-accordion-item">
                <button
                  type="button"
                  className={openIndex === index ? "active" : ""}
                  onClick={() => setOpenIndex((current) => (current === index ? -1 : index))}
                >
                  <span>{item.question}</span>
                  <strong>{openIndex === index ? "-" : "+"}</strong>
                </button>
                {openIndex === index ? <p>{item.answer}</p> : null}
              </article>
            ))}
            {!filteredItems.length ? <p className="faq-empty">No matching FAQs found.</p> : null}
          </div>
        </article>

        <aside className="panel-card faq-chatbot">
          <div className="faq-chatbot-head">
            <div className="faq-chatbot-title">
              <span className="faq-chatbot-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M4 5h16v10H8l-4 4V5zm3 4h10v2H7V9z" />
                </svg>
              </span>
              <h2>Concierge Chat</h2>
            </div>
            <p>Premium instant support</p>
          </div>

          <div className="faq-chatbot-messages">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`faq-chat-message ${message.role === "assistant" ? "assistant" : "user"}`}
              >
                {message.text}
              </article>
            ))}
          </div>

          <div className="faq-chatbot-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" onClick={() => sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="faq-chatbot-input"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Type your question"
              aria-label="Type your question"
            />
            <button type="submit">Send</button>
          </form>
        </aside>
      </section>
    </main>
  );
}
