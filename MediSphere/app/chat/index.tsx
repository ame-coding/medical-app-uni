// MediSphere/app/chat/index.tsx
import React from "react";
import { SafeAreaView, View, Platform } from "react-native";
import KittyChatbot from "..//..//components/kitty/kittyChatbot";
import { useTheme } from "../../hooks/useTheme";

export default function ChatScreen() {
  const { styles } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.screen,
        { paddingTop: Platform.OS === "android" ? 24 : 0 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <KittyChatbot />
      </View>
    </SafeAreaView>
  );
}
