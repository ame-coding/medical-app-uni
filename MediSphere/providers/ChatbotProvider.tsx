// MediSphere/providers/ChatbotProvider.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useChatbot, { BotMsg } from "../hooks/useChatbot";

/**
 * ChatbotProvider
 *
 * - Elevates chatbot state to app root
 * - Persists history to AsyncStorage with TTL
 * - Wraps your existing useChatbot() logic for intent handling / remote calls
 *
 * NOTE: This approach keeps your existing hook logic and syncs its messages
 * into provider state after sendMessage / handleSuggestion calls.
 */

type ChatCtx = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  messages: BotMsg[];
  addMessage: (m: BotMsg) => void;
  sendMessage: (text: string) => Promise<void>;
  handleSuggestion: (label: string, meta?: any) => Promise<void>;
  clearHistory: () => Promise<void>;
};

const ChatContext = createContext<ChatCtx | null>(null);

const STORAGE_KEY = "kitty_chat_history_v1";
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export const ChatbotProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use your hook for the logic (fetchRecommendations, matchIntent etc.)
  const hb = useChatbot();

  // provider state
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<BotMsg[]>(hb.messages ?? []);

  // load persisted history once on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setMessages(hb.messages ?? []);
          return;
        }
        const parsed = JSON.parse(raw);
        if (!parsed.ts || Date.now() - parsed.ts > TTL_MS) {
          // expired
          await AsyncStorage.removeItem(STORAGE_KEY);
          setMessages(hb.messages ?? []);
          return;
        }
        setMessages(parsed.history ?? hb.messages ?? []);
      } catch (e) {
        console.warn("[ChatbotProvider] load error", e);
        setMessages(hb.messages ?? []);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist helper
  const persist = useCallback(async (next: BotMsg[]) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ts: Date.now(), history: next })
      );
    } catch (e) {
      console.warn("[ChatbotProvider] persist error", e);
    }
  }, []);

  // add message to provider + persist
  const addMessage = useCallback(
    (m: BotMsg) => {
      setMessages((prev) => {
        const next = [...prev, m];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  // sendMessage: call underlying hook, then sync provider messages from hook
  const sendMessage = useCallback(
    async (text: string) => {
      try {
        await hb.sendMessage(text);
        const next = hb.messages ?? [];
        setMessages(next);
        await persist(next);
      } catch (e) {
        console.warn("[ChatbotProvider] sendMessage error", e);
      }
    },
    [hb, persist]
  );

  // handleSuggestion: call hook then sync
  const handleSuggestion = useCallback(
    async (label: string, meta?: any) => {
      try {
        await hb.handleSuggestion(label, meta);
        const next = hb.messages ?? [];
        setMessages(next);
        await persist(next);
      } catch (e) {
        console.warn("[ChatbotProvider] handleSuggestion error", e);
      }
    },
    [hb, persist]
  );

  const clearHistory = useCallback(async () => {
    setMessages([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((s) => !s), []);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      messages,
      addMessage,
      sendMessage,
      handleSuggestion,
      clearHistory,
    }),
    [isOpen, messages, addMessage, sendMessage, handleSuggestion, clearHistory]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatbotContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx)
    throw new Error("useChatbotContext must be used inside ChatbotProvider");
  return ctx;
};
