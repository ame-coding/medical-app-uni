// MediSphere/hooks/useChatbot.ts
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../providers/AuthProvider";
import { matchIntent } from "../lib/intentMatcher";
import intentConfig from "../constants/intentConfig.json";
import defaultPopups from "../constants/defaultPopups.json";

export type BotMsg = {
  id: string;
  from: "bot" | "user";
  text: string;
  payload?: any;
  suggestions?: string[];
};

const SERVER_BASE_URL = "http://YOUR_SERVER_BASE_URL:3000"; // <-- replace this

export const useChatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BotMsg[]>([
    {
      id: "bot-1",
      from: "bot",
      text: "Hi, I'm Kitty 😺 — I can show recommendations, list recent tests, or offer quick health tips.",
      suggestions: ["Show recommendations", "Show recent tests", "Help"],
    },
  ]);

  const [showPopup, setShowPopup] = useState<boolean>(false);

  useEffect(() => {
    // show popup on app open once (simple): if user exists show popup
    if (user) {
      // small delay for nicer UX
      const t = setTimeout(() => setShowPopup(true), 900);
      return () => clearTimeout(t);
    }
  }, [user]);

  const addMessage = useCallback((m: BotMsg) => {
    setMessages((s) => [...s, m]);
  }, []);
  const fetchRecommendations = async (userId: string, docType?: string) => {
    try {
      const encodedUser = encodeURIComponent(userId);
      const url = docType
        ? `${SERVER_BASE_URL}/api/recommendations/${encodedUser}?docType=${encodeURIComponent(
            docType
          )}`
        : `${SERVER_BASE_URL}/api/recommendations/${encodedUser}`;
      const res = await fetch(url);
      const json = await res.json();
      return json.recommendations || [];
    } catch (err) {
      console.warn("recommendation fetch error", err);
      return [];
    }
  };

  const sendMessage = async (text: string) => {
    // add user message (unchanged)
    const userMsg: BotMsg = { id: `u-${Date.now()}`, from: "user", text };
    addMessage(userMsg);

    const matched = matchIntent(text);
    if (matched.intent === "show_recommendations") {
      const doc = matched.entity; // may be undefined

      addMessage({
        id: `b-${Date.now()}`,
        from: "bot",
        text: "Let me check your records...",
        suggestions: [],
      });

      // HERE: ensure we pass a string userId. Use String(user?.id ?? 'unknown')
      const userIdStr = String(user?.id ?? "unknown");
      const recs = await fetchRecommendations(userIdStr, doc);
      if (!recs || recs.length === 0) {
        addMessage({
          id: `b-${Date.now()}-no`,
          from: "bot",
          text: "I couldn't find clear recommendations for that. Try asking for a specific report, e.g., 'recommendations for Hemoglobin'.",
          suggestions: intentConfig.defaultSuggestions,
        });
      } else {
        // format a nice message and quick actions
        addMessage({
          id: `b-${Date.now()}-ok`,
          from: "bot",
          text: `I found ${recs.length} recommendation(s).`,
          payload: recs,
          suggestions: ["View record", "More tips", "Dismiss"],
        });
      }
    } else if (matched.intent === "show_recent_tests") {
      // call an example endpoint (make sure it exists)
      try {
        const url = `${SERVER_BASE_URL}/api/records/${
          user?.id ?? "unknown"
        }/recent`;
        const res = await fetch(url);
        const json = await res.json();
        const records = json.records || [];
        addMessage({
          id: `b-${Date.now()}-recents`,
          from: "bot",
          text: records.length
            ? `Here are your ${records.length} recent tests.`
            : "I couldn't find recent tests.",
          payload: records,
          suggestions: intentConfig.defaultSuggestions,
        });
      } catch {
        addMessage({
          id: `b-${Date.now()}-err`,
          from: "bot",
          text: "Failed to load recent tests.",
          suggestions: intentConfig.defaultSuggestions,
        });
      }
    } else if (matched.intent === "greeting") {
      addMessage({
        id: `b-${Date.now()}-g`,
        from: "bot",
        text: "Hey! I'm Kitty — I can help with recommendations.",
        suggestions: intentConfig.defaultSuggestions,
      });
    } else {
      // smalltalk / fallback
      addMessage({
        id: `b-${Date.now()}-fb`,
        from: "bot",
        text: "Meow? I didn't get that. Try: 'Show recommendations' or 'Show recent tests'.",
        suggestions: intentConfig.defaultSuggestions,
      });
    }
  };

  const dismissPopup = (openChat?: boolean) => {
    setShowPopup(false);
    if (openChat) {
      // add friendly message when user opens chat via popup
      addMessage({
        id: `b-${Date.now()}-pop`,
        from: "bot",
        text: defaultPopups[0]?.followUp || "Hey — what can I help you with?",
        suggestions: intentConfig.defaultSuggestions,
      });
    }
  };

  return {
    messages,
    sendMessage,
    showPopup,
    dismissPopup,
  };
};
