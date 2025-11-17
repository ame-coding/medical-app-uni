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
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
  StyleSheet,
} from "react-native";
import MessageBubble from "./MessageBubble";
import { useChatbot } from "../../hooks/useChatbot";
import { useTheme } from "../../hooks/useTheme";

const kittyIdle = require("../../assets/kitty/idle.png");

type KittyChatbotProps = {
  onClose?: () => void;
};

const KittyChatbot: React.FC<KittyChatbotProps> = ({ onClose }) => {
  const { styles, colors } = useTheme();
  const { messages, sendMessage, showPopup, dismissPopup } = useChatbot();
  const [text, setText] = useState<string>("");
  const inputRef = useRef<TextInput | null>(null);

  // ensure keyboard avoids input on ios
  useEffect(() => {
    // nothing for now, placeholder if you want initial messages or focus
  }, []);

  const handleSubmit = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText("");
    inputRef.current?.blur();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={[
            styles.card,
            {
              flexDirection: "row",
              alignItems: "center",
              padding: 12,
              backgroundColor: colors.surface,
              borderRadius: 0,
              borderBottomWidth: 0,
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
            accessibilityLabel="Close chat"
          >
            <Text style={[styles.text, { color: colors.muted }]}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onQuickReply={(q) => sendMessage(q)}
            />
          )}
        />

        {/* Input */}
        <View
          style={{
            flexDirection: "row",
            padding: 8,
            alignItems: "center",
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
            keyboardAppearance={
              Platform.OS === "ios"
                ? colors === undefined
                  ? "light"
                  : colors === undefined
                  ? "dark"
                  : "dark"
                : undefined
            }
          />
          <TouchableOpacity
            onPress={handleSubmit}
            style={[localStyles.sendBtn, { backgroundColor: colors.primary }]}
            accessibilityLabel="Send message"
          >
            <Text style={[styles.buttonText]}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default KittyChatbot;

const localStyles = StyleSheet.create({
  sendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
});
