import React, { useEffect, useRef, useState } from "react";
import API from "../api";

const DEFAULT_CHIPS = [
  "How do I register?",
  "How do I add a product?",
  "How does mobile money payment work?",
  "Tell me about farming seasons",
];

/** Lightweight markdown renderer: **bold**, • bullets, 1. numbered lists. */
function renderRich(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const nodes = [];
  let list = null;
  let listKey = 0;

  const flushList = () => {
    if (list) {
      nodes.push(
        React.createElement(
          list.type,
          { key: `list-${listKey++}`, className: `${list.type === "ol" ? "list-decimal" : "list-disc"} pl-5 my-1 space-y-0.5` },
          list.items
        )
      );
      list = null;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (/^\d+\.\s/.test(trimmed)) {
      if (!list) list = { type: "ol", items: [] };
      list.items.push(
        <li key={`${listKey}-li`}>
          <span
            dangerouslySetInnerHTML={{
              __html: trimmed.replace(/^\d+\.\s/, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
            }}
          />
        </li>
      );
      return;
    }
    if (/^[-•]\s/.test(trimmed) || trimmed.startsWith("•")) {
      if (!list) list = { type: "ul", items: [] };
      const body = trimmed.replace(/^[-•]\s/, "").replace(/^•\s/, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      list.items.push(
        <li key={`${listKey}-li`} dangerouslySetInnerHTML={{ __html: body }} />
      );
      return;
    }
    flushList();

    const rawHtml = trimmed
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-emerald-700">$1</code>');
    nodes.push(<p key={`line-${idx}`} dangerouslySetInnerHTML={{ __html: rawHtml }} className="mb-1.5 last:mb-0" />);
  });
  flushList();
  return nodes;
}

const AssistantWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [chips, setChips] = useState(DEFAULT_CHIPS);
  const [inited, setInited] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (!inited) {
      setInited(true);
      const hint =
        "Hello! I'm the FarmerJoin Assistant, built into this marketplace. Ask me anything about the system — registration, buying, selling, orders, payments, or farming.";
      setMessages([{ role: "assistant", content: hint, chips: DEFAULT_CHIPS }]);
      API.get("/api/system-assistant/welcome")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.chips) && res.data.chips.length) {
            setChips(res.data.chips);
          } else if (res.data?.message) {
            setMessages((prev) => [{ role: "assistant", content: res.data.message, chips: res.data.chips || DEFAULT_CHIPS }]);
          }
        })
        .catch(() => {
          /* offline-safe: keep default chips */
        });
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, inited]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const ask = async (text) => {
    const question = String(text || "").trim();
    if (!question || typing) return;
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setTyping(true);
    try {
      const res = await API.post("/api/system-assistant/chat", { query: question });
      const data = res.data;
      if (data?.success && data.answer) {
        setTyping(false);
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer, chips: data.followUps || [] }]);
        return;
      }
      throw new Error(data?.error || "empty response");
    } catch (e) {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I could not reach the assistant service right now. Please check your connection and try again.",
          chips: DEFAULT_CHIPS,
        },
      ]);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-[100] w-[min(92vw,400px)] max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white flex flex-col" role="dialog" aria-label="FarmerJoin Assistant">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">FarmerJoin Assistant</p>
                <p className="text-[11px] text-white/85 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Built-in knowledge, always available
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" aria-label="Close assistant">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-gradient-to-b from-gray-50 to-emerald-50/40 max-h-[50vh]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] text-sm rounded-2xl px-3.5 py-2.5 whitespace-pre-wrap break-words ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-gray-800 shadow-sm rounded-bl-sm"
                  }`}
                >
                  {renderRich(m.content)}
                  {m.role === "assistant" && Array.isArray(m.chips) && m.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {m.chips.slice(0, 3).map((c, ci) => (
                        <button
                          key={ci}
                          onClick={() => ask(c)}
                          className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${d * 120}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Start chips */}
          {messages.length <= 1 && chips.length > 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {chips.map((c, i) => (
                <button key={i} onClick={() => ask(c)} className="text-xs px-3 py-1.5 rounded-full border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors">
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 p-2.5 flex items-center gap-2 bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about FarmerJoin..."
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
            <button
              onClick={() => ask(input)}
              disabled={!input.trim() || typing}
              aria-label="Send"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white disabled:opacity-40 hover:from-emerald-600 hover:to-teal-600 transition-colors shadow"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-5 right-4 sm:right-6 z-[100] w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl flex items-center justify-center hover:scale-105 hover:shadow-2xl transition-all duration-200"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.4-4 8-9 8-1 0-1.9-.1-2.8-.3L4 21l1.3-4C3.9 15.6 3 13.9 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
          </svg>
        )}
      </button>
    </>
  );
};

export default AssistantWidget;