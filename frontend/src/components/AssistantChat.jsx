import React, { useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

const AssistantChat = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canUseAssistant = Boolean(user);

  const handleToggle = () => {
    if (!canUseAssistant) return;
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setMessages((curr) =>
          curr.length ? curr : [{ role: "assistant", content: t("assistantWelcome") }]
        );
      }
      return next;
    });
    setError("");
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const content = input.trim();
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setLoading(true);
    try {
      const { data } = await api.post("/assistant/chat", {
        message: content,
        language
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || t("assistantError")
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("assistantError") }
      ]);
      setError(err?.response?.data?.message || t("assistantError"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const placeholder = useMemo(() => t("assistantInputPlaceholder"), [t]);

  if (!canUseAssistant) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-ocean px-4 py-3 font-semibold text-slate-900 shadow-lg hover:shadow-glow transition-colors"
      >
        {open ? t("assistantClose") : t("assistantOpenButton")}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900/95 backdrop-blur-lg shadow-2xl flex flex-col">
          <header className="p-4 border-b border-slate-800">
            <p className="font-display text-lg">{t("assistantTitle")}</p>
            <p className="text-sm text-slate-400">{t("assistantSubtitle")}</p>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-slate-500">{t("assistantEmpty")}</div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={`rounded-2xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-ocean/20 text-slate-100 self-end"
                    : "bg-slate-800/80 text-slate-100"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="text-xs text-slate-500">{t("assistantThinking")}</div>
            )}
          </div>
          {error && <p className="px-4 text-xs text-red-300">{error}</p>}
          <div className="p-4 border-t border-slate-800 flex gap-2">
            <textarea
              className="flex-1 resize-none rounded-2xl bg-slate-900/70 border border-slate-700 p-2 text-sm text-slate-100 focus:border-ocean focus:outline-none"
              rows={2}
              placeholder={placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={loading}
              className="self-end rounded-2xl bg-ocean px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
            >
              {t("assistantSend")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AssistantChat;
