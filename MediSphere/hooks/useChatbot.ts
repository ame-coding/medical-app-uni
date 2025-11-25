// MediSphere/hooks/useChatbot.ts
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../providers/AuthProvider";
import { matchIntent } from "../lib/intentMatcher";
import intentConfig from "../constants/intentConfig.json";
import documentTypes from "../constants/documentTypes.json";
import BASE_URL from "../lib/apiconfig";
import { authFetch } from "../lib/auth";

export type BotMsg = {
  id: string;
  from: "bot" | "user";
  text: string;
  payload?: any;
  suggestions?: string[];
};

function joinBase(base: string, path: string) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

function collapseApiDup(url: string) {
  if (!url) return url;
  return url.replace(/\/api\/api(\/?)/g, "/api$1");
}

function bot(id: string, text: string, payload?: any, suggestions?: string[]) {
  return {
    id: `b-${Date.now()}-${id}`,
    from: "bot" as const,
    text,
    payload,
    suggestions,
  };
}

export default function useChatbot() {
  const { user } = useAuth();

  const [messages, setMessages] = useState<BotMsg[]>([
    {
      id: `b-hello`,
      from: "bot",
      text: "Hi, I'm Kitty 😺 — I can show your tests or set reminders.",
      // changed "Show recommendations" -> "Recommend me"
      suggestions: ["Recommend me", "Show recent tests", "Help"],
    },
  ]);

  useEffect(() => {
    // show the popup / initial followup handled elsewhere if needed
  }, [user]);

  const addMessage = useCallback((m: BotMsg) => {
    console.log("[useChatbot] Add message:", m);
    setMessages((s) => [...s, m]);
  }, []);

  const getDocTypesList = useCallback(
    () => Object.keys(documentTypes || {}),
    []
  );

  const pushDocTypes = useCallback(() => {
    const types = getDocTypesList();
    addMessage(
      bot(
        "doctypes",
        "Which type would you like recommendations for?",
        { docTypeFields: documentTypes },
        types
      )
    );
  }, [addMessage, getDocTypesList]);

  const fetchRecommendations = useCallback(
    async (docType?: string) => {
      try {
        const uid = String(user?.id ?? "unknown");
        let url = joinBase(
          BASE_URL,
          `recommendations/${encodeURIComponent(uid)}`
        );
        if (docType) url += `?docType=${encodeURIComponent(docType)}`;

        url = collapseApiDup(url);
        console.log("[useChatbot] fetchRecommendations URL:", url);

        const res = await authFetch(url);
        console.log("[useChatbot] fetchRecommendations status:", res.status);

        if (!res.ok) return [];
        const json = await res.json();
        return json.recommendations || [];
      } catch (e) {
        console.error("[useChatbot] fetchRecommendations error:", e);
        return [];
      }
    },
    [user]
  );

  const fetchRecent = useCallback(async () => {
    try {
      const uid = String(user?.id ?? "unknown");
      let url = joinBase(BASE_URL, `records/${encodeURIComponent(uid)}/recent`);
      url = collapseApiDup(url);

      console.log("[useChatbot] fetchRecent URL:", url);

      const res = await authFetch(url);
      console.log("[useChatbot] fetchRecent status:", res.status);

      if (!res.ok) return [];
      const json = await res.json();
      return json.records || [];
    } catch (e) {
      console.error("[useChatbot] fetchRecent error:", e);
      return [];
    }
  }, [user]);

  // resolve ids from different shapes
  const resolveIdFromMeta = (m: any) => {
    if (!m) return null;
    return (
      m.recordId ??
      m.id ??
      m._id ??
      (m.record && (m.record.id ?? m.record._id)) ??
      (m.list && m.list.length
        ? m.list[0].recordId ?? m.list[0].id ?? m.list[0]._id
        : null) ??
      null
    );
  };

  // ---------------------
  // USER TEXT
  // ---------------------
  const sendMessage = useCallback(
    async (text: string) => {
      console.log("[useChatbot] user said:", text);

      addMessage({
        id: `u-${Date.now()}`,
        from: "user",
        text,
      });

      // Accept "recommend me" explicitly in addition to intent matcher
      if (/recommend\s*me/i.test(text)) {
        console.log("[useChatbot] text matched 'recommend me' direct check");
        pushDocTypes();
        return;
      }

      const matched = matchIntent(text);
      console.log("[useChatbot] matched intent:", matched);

      if (matched.intent === "show_recommendations") {
        pushDocTypes();
        return;
      }

      if (matched.intent === "show_recent_tests") {
        addMessage(bot("loading", "Fetching your recent tests..."));
        const list = await fetchRecent();

        if (!list.length) {
          addMessage(
            bot(
              "none",
              "No recent records found.",
              undefined,
              intentConfig.defaultSuggestions
            )
          );
          return;
        }

        // Recent tests: send records as-is (no __isRecommendation flag)
        addMessage(
          bot(
            "recent",
            `Found ${list.length} recent record(s).`,
            list.slice(0, 10),
            ["View record", "Set reminder"]
          )
        );
        return;
      }

      if (matched.intent === "greeting") {
        addMessage(
          bot(
            "greet",
            "Hey! I can give recommendations or show recent tests.",
            undefined,
            intentConfig.defaultSuggestions
          )
        );
        return;
      }

      addMessage(
        bot(
          "fallback",
          "I didn't understand that — try 'Recommend me' or 'Show recent tests'.",
          undefined,
          intentConfig.defaultSuggestions
        )
      );
    },
    [addMessage, fetchRecent, pushDocTypes]
  );

  // ---------------------
  // Quick reply handling
  // ---------------------
  const handleSuggestion = useCallback(
    async (label: string, meta?: any) => {
      console.log("[useChatbot] handleSuggestion:", label, meta);

      const l = label.trim();
      const docTypes = getDocTypesList();

      // If user selected a docType label (e.g., "MRI", "Blood Test")
      if (docTypes.includes(l)) {
        addMessage({
          id: `u-${Date.now()}-sel`,
          from: "user",
          text: l,
        });

        addMessage(bot("loading", `Checking ${l} results...`));

        const recs = await fetchRecommendations(l);

        if (!recs.length) {
          addMessage(
            bot(
              "norec",
              `No recommendations found for ${l}.`,
              undefined,
              intentConfig.defaultSuggestions
            )
          );
          return;
        }

        // For recommendations flow: mark items as recommendations so UI shows only View
        const wrapped = recs.map((r: any) => ({
          ...r,
          __isRecommendation: true,
        }));

        addMessage(
          bot(
            "ok",
            `Found ${wrapped.length} recommendation(s) for ${l}.`,
            wrapped,
            // recommendations: show only "View record"
            ["View record"]
          )
        );
        return;
      }

      const lc = l.toLowerCase();

      if (lc.includes("recommend")) {
        pushDocTypes();
        return;
      }

      if (lc.includes("tips")) {
        addMessage(
          bot(
            "tips",
            "General tips: hydrate, sleep 7–8 hours, balanced diet, daily movement.",
            undefined,
            ["Diet tips", "Exercise tips"]
          )
        );
        return;
      }

      // View record handling (robust)
      if (lc.includes("view record")) {
        const id = resolveIdFromMeta(meta);
        console.info("[useChatbot] resolved id for view:", id, "meta:", meta);

        if (!id) {
          addMessage(
            bot(
              "missing-id",
              "Sorry — I couldn't find the record id to open. Try tapping the View button on the card instead.",
              undefined,
              intentConfig.defaultSuggestions
            )
          );
          return;
        }

        addMessage(
          bot("goto-record", `Opening record ${id}...`, {
            navigateTo: `/addItems/viewRecord?id=${encodeURIComponent(
              String(id)
            )}`,
          })
        );
        return;
      }

      // Set reminder handling (robust)
      if (lc.includes("set reminder")) {
        const id = resolveIdFromMeta(meta);
        const recDate =
          (meta && (meta.record?.date ?? meta.date ?? meta.recordDate)) || "";
        const encodedDate = recDate ? encodeURIComponent(String(recDate)) : "";
        const encodedPrefill = id ? encodeURIComponent(String(id)) : "";

        const queryParts = [];
        if (encodedPrefill) queryParts.push(`prefill=${encodedPrefill}`);
        if (encodedDate) queryParts.push(`date=${encodedDate}`);
        const query = queryParts.length ? `?${queryParts.join("&")}` : "";

        addMessage(
          bot("goto-rem", "Opening reminder creation...", {
            navigateTo: `/addItems/newReminders${query}`,
          })
        );
        return;
      }

      sendMessage(l);
    },
    [
      addMessage,
      fetchRecommendations,
      getDocTypesList,
      pushDocTypes,
      sendMessage,
    ]
  );

  return {
    messages,
    sendMessage,
    handleSuggestion,
  };
}
