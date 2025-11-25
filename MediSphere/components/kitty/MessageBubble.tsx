// MediSphere/components/kitty/MessageBubble.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";

type Msg = {
  id: string;
  from: "bot" | "user";
  text: string;
  payload?: any;
  suggestions?: string[];
};

export default function MessageBubble({
  message,
  onQuickReply,
}: {
  message: Msg;
  onQuickReply?: (q: string, meta?: any) => void;
}) {
  const isBot = message.from === "bot";
  const { styles, colors } = useTheme();

  return (
    <View
      style={[
        {
          marginVertical: 6,
          alignSelf: isBot ? "flex-start" : "flex-end",
          maxWidth: "85%",
        },
      ]}
    >
      <View
        style={[
          localStyles.bubble,
          {
            backgroundColor: isBot ? colors.surface : colors.primary,
            borderWidth: isBot ? 1 : 0,
            borderColor: isBot ? colors.border : undefined,
          },
        ]}
      >
        <Text style={{ color: isBot ? colors.text : "#fff" }}>
          {message.text}
        </Text>
      </View>

      {isBot && message.suggestions && (
        <View style={{ flexDirection: "row", marginTop: 8, flexWrap: "wrap" }}>
          {message.suggestions.map((s: string) => (
            <TouchableOpacity
              key={s}
              onPress={() => {
                console.log("[MessageBubble] chip tapped:", s);
                onQuickReply?.(s);
              }}
              style={[
                localStyles.chip,
                {
                  backgroundColor: colors.glass,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={{ fontSize: 12, color: colors.text }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  bubble: {
    padding: 12,
    borderRadius: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 6,
  },
});
