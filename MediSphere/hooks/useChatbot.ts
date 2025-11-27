// MediSphere/hooks/useChatbot.ts
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../providers/AuthProvider";
// Ensure your intentMatcher exposes a default function
import matchIntent from "../lib/intentMatcher";
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

  const CORE_SUGGESTIONS: string[] = intentConfig?.defaultSuggestions ?? [
    "Recommend me",
    "Show recent tests",
    "Help",
  ];

  const [messages, setMessages] = useState<BotMsg[]>([
    {
      id: `b-hello`,
      from: "bot",
      text: "Hi, I'm Kitty 😺 — I can show your tests or set reminders.",
      suggestions: CORE_SUGGESTIONS,
    },
  ]);

  useEffect(() => {
    // placeholder if you want to react to user changes
  }, [user]);

  const addMessage = useCallback((m: BotMsg) => {
    console.log("[useChatbot] Add message:", m);
    setMessages((s) => [...s, m]);
  }, []);

  // Remove any loading messages (id includes 'loading')
  const removeLoadingMessages = useCallback(() => {
    setMessages((s) =>
      s.filter((it) => !String(it.id).toLowerCase().includes("loading"))
    );
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
        // limit doc types shown so the UI doesn't overflow; always append core options
        [...types.slice(0, 12), ...CORE_SUGGESTIONS]
      )
    );
  }, [addMessage, getDocTypesList, CORE_SUGGESTIONS]);

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
        // show loading bot message (typing animation will render)
        addMessage(
          bot("loading", "Fetching your recent tests...", undefined, undefined)
        );

        const list = await fetchRecent();

        // remove loading messages before adding results
        removeLoadingMessages();

        if (!list.length) {
          addMessage(
            bot("none", "No recent records found.", undefined, CORE_SUGGESTIONS)
          );
          return;
        }

        // Recent tests: send records as-is (no __isRecommendation flag)
        addMessage(
          bot(
            "recent",
            `Found ${list.length} recent record(s).`,
            list.slice(0, 10),
            // removed 'Show all' per your earlier request; include core options after results
            ["View record", "Set reminder", ...CORE_SUGGESTIONS]
          )
        );
        return;
      }

      // explicit help intent
      if (matched.intent === "help") {
        addMessage(
          bot(
            "help",
            "I can: recommend tests, show your recent tests, open a record, or set reminders. Try 'Recommend me' or 'Show recent tests'.",
            undefined,
            CORE_SUGGESTIONS
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
            CORE_SUGGESTIONS
          )
        );
        return;
      }

      addMessage(
        bot(
          "fallback",
          "I didn't understand that — try 'Recommend me' or 'Show recent tests'.",
          undefined,
          CORE_SUGGESTIONS
        )
      );
    },
    [
      addMessage,
      fetchRecent,
      pushDocTypes,
      removeLoadingMessages,
      CORE_SUGGESTIONS,
    ]
  );

  // ---------------------
  // Quick reply handling (chips)
  // ---------------------
  const handleSuggestion = useCallback(
    async (label: string, meta?: any) => {
      console.log("[useChatbot] handleSuggestion:", label, meta);

      const l = String(label || "").trim();
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

        // remove loading messages
        removeLoadingMessages();

        if (!recs.length) {
          addMessage(
            bot(
              "norec",
              `No recommendations found for ${l}.`,
              undefined,
              CORE_SUGGESTIONS
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
            // "View record" + core suggestions
            ["View record", ...CORE_SUGGESTIONS]
          )
        );
        return;
      }

      const lc = l.toLowerCase();

      // direct help chip handling — this fixes the problem you saw
      if (lc === "help" || lc.includes("help")) {
        addMessage(
          bot(
            "help",
            "I can: recommend tests, show your recent tests, open a record, or set reminders. Try 'Recommend me' or 'Show recent tests'.",
            undefined,
            CORE_SUGGESTIONS
          )
        );
        return;
      }

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
            ["Diet tips", "Exercise tips", ...CORE_SUGGESTIONS]
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
              CORE_SUGGESTIONS
            )
          );
          return;
        }

        addMessage(
          bot("goto-record", "", {
            navigateTo: `/addItems/viewRecord?id=${encodeURIComponent(
              String(id)
            )}`,
            closeChat: true,
            meta: { recordId: id },
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

        const queryParts: string[] = [];
        if (encodedPrefill) queryParts.push(`prefill=${encodedPrefill}`);
        if (encodedDate) queryParts.push(`date=${encodedDate}`);
        const query = queryParts.length ? `?${queryParts.join("&")}` : "";

        addMessage(
          bot("goto-rem", "", {
            navigateTo: `/addItems/newReminders${query}`,
            closeChat: true,
            meta: { recordId: id },
          })
        );
        return;
      }

      // fallback: pass through as typed text (this will also hit sendMessage and use intentMatcher there)
      sendMessage(l);
    },
    [
      addMessage,
      fetchRecommendations,
      getDocTypesList,
      pushDocTypes,
      sendMessage,
      removeLoadingMessages,
      CORE_SUGGESTIONS,
    ]
  );

  return {
    messages,
    sendMessage,
    handleSuggestion,
  };
}
