// MediSphere/components/kitty/KittyChatbot.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import MessageBubble from "./MessageBubble";
import useChatbot from "../../hooks/useChatbot";
import { useTheme } from "../../hooks/useTheme";
import { useRouter } from "expo-router";

const kittyIdle = require("../../assets/kitty/idle.png");

export default function KittyChatbot({ onClose }: { onClose?: () => void }) {
  const { styles, colors } = useTheme();
  const { messages, sendMessage, handleSuggestion } = useChatbot();
  const [text, setText] = useState("");
  const router = useRouter();

  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    console.log("🐱 [KittyChatbot] Mounted");
    return () => console.log("🐱 [KittyChatbot] Unmounted");
  }, []);

  // Listen for navigateTo payloads (goto-record / goto-rem)
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.from !== "bot") return;

    const nav = last.payload?.navigateTo;
    if (!nav) return;

    console.info("[KittyChatbot] navigateTo payload found:", nav);

    let [rawPath, rawQuery] = String(nav).split("?");
    if (!rawPath.startsWith("/")) rawPath = "/" + rawPath;

    const params: any = {};
    if (rawQuery) {
      rawQuery.split("&").forEach((kv) => {
        const [k, v] = kv.split("=");
        if (k) params[k] = decodeURIComponent(v ?? "");
      });
    }

    try {
      if (params.id) {
        router.push({ pathname: rawPath, params: { id: params.id } } as any);
      } else if (params.prefill) {
        router.push({
          pathname: rawPath,
          params: { prefill: params.prefill, date: params.date || "" },
        } as any);
      } else {
        router.push((rawPath + (rawQuery ? `?${rawQuery}` : "")) as any);
      }
      onClose?.();
    } catch (e) {
      console.error("[KittyChatbot] Router push failed:", e);
    }
  }, [messages, router, onClose]);

  const handleSubmit = () => {
    if (!text || !text.trim()) return;
    const payload = text.trim();
    console.log("✉️ [KittyChatbot] submit:", payload);
    sendMessage(payload);
    setText("");
    inputRef.current?.blur();
  };

  // derive meta helper
  function deriveMetaFromItem(item: any) {
    if (!item) return undefined;
    const maybeId =
      item.recordId ??
      item.id ??
      item._id ??
      item.record?.id ??
      item.record?._id;
    return { recordId: maybeId, record: item };
  }

  const onQuickReply = (label: string, incomingMeta?: any) => {
    console.log(
      "[KittyChatbot] quick reply tapped:",
      label,
      incomingMeta ?? ""
    );
    handleSuggestion(label, incomingMeta);
  };

  // Payload preview: show buttons differently if item is recommendation
  const PayloadPreview: React.FC<{ payload: any[] }> = ({ payload }) => {
    if (!Array.isArray(payload) || payload.length === 0) return null;
    return (
      <View style={{ marginTop: 8 }}>
        {payload.slice(0, 3).map((p: any, idx: number) => {
          const meta = deriveMetaFromItem(p);
          const isRec = !!p.__isRecommendation;
          console.debug(
            `[KittyChatbot] PayloadPreview item ${idx} isRec=${isRec} meta.recordId=`,
            meta?.recordId
          );

          return (
            <View
              key={idx}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 10,
                padding: 8,
                marginBottom: 8,
              }}
            >
              <Text style={[styles.text, { fontWeight: "700" }]}>
                {p.record_title ||
                  p.title ||
                  p.text ||
                  `Item ${meta?.recordId}`}
              </Text>
              {p.date ? (
                <Text style={[styles.mutedText, { marginTop: 4 }]}>
                  {p.date}
                </Text>
              ) : null}

              <View style={{ flexDirection: "row", marginTop: 8 }}>
                {/* VIEW */}
                <TouchableOpacity
                  onPress={() => onQuickReply("View record", meta)}
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: "white" }}>View</Text>
                </TouchableOpacity>

                {/* Only show Set reminder for non-recommendations (recent tests) */}
                {!isRec && (
                  <TouchableOpacity
                    onPress={() => onQuickReply("Set reminder", meta)}
                    style={{
                      padding: 6,
                      borderRadius: 8,
                      backgroundColor: "#6c5ce7",
                    }}
                  >
                    <Text style={{ color: "white" }}>Set reminder</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
        {payload.length > 3 && (
          <TouchableOpacity
            onPress={() => onQuickReply("Show all records", { list: payload })}
            style={{ marginTop: 6 }}
          >
            <Text style={[styles.mutedText]}>Show all ({payload.length})</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={[
            styles.card,
            {
              flexDirection: "row",
              alignItems: "center",
              padding: 12,
            },
          ]}
        >
          <Image
            source={kittyIdle}
            style={{ width: 56, height: 56, borderRadius: 28 }}
            resizeMode="contain"
          />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.heading, { marginBottom: 2 }]}>Kitty</Text>
            <Text style={styles.mutedText}>Your health assistant</Text>
          </View>
          <TouchableOpacity
            style={{ marginLeft: "auto", padding: 8 }}
            onPress={() => onClose?.()}
          >
            <Text style={[styles.text, { color: colors.muted }]}>Close</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View>
              <MessageBubble
                message={item}
                onQuickReply={(q: string, _meta?: any) => {
                  // derive meta from message payload if needed, prefer passed meta
                  let meta = _meta;
                  if (
                    (!meta || !meta.recordId) &&
                    item.payload &&
                    Array.isArray(item.payload) &&
                    item.payload.length > 0
                  ) {
                    const first = item.payload[0];
                    meta = deriveMetaFromItem(first);
                    (meta as any).list = item.payload;
                  }
                  console.debug(
                    "[KittyChatbot] MessageBubble onQuickReply ->",
                    q,
                    meta
                  );
                  onQuickReply(q, meta);
                }}
              />

              {item.payload && Array.isArray(item.payload) ? (
                <PayloadPreview payload={item.payload} />
              ) : null}
            </View>
          )}
        />

        <View
          style={{
            flexDirection: "row",
            padding: 8,
            borderTopWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder="Ask Kitty something..."
            placeholderTextColor={colors.muted}
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
          />
          <TouchableOpacity
            onPress={handleSubmit}
            style={[localStyles.sendBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.buttonText]}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const localStyles = StyleSheet.create({
  sendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
});
