// MediSphere/components/kitty/KittyFloating.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  Image,
  Platform,
  StyleSheet,
  Easing,
  Modal,
  Text,
} from "react-native";
import KittyChatbot from "./kittyChatbot";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../providers/AuthProvider"; // adjust path if different

// local asset - ensure this file exists: MediSphere/assets/kitty/idle.png
const kittyIdle = require("../../assets/kitty/idle.png");
import TIP_POOL from "../../constants/quickTips";

/**
 * KittyFloating
 * - auto-shows one ephemeral random tip after login (once per session)
 * - single tap opens chat modal
 * - long press opens chat modal
 * - only visible to normal users (user.role === 'user')
 */
export default function KittyFloating() {
  // Always call hooks unconditionally at the top
  const { styles, colors } = useTheme();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);

  // ephemeral bubble state
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [bubbleVisible, setBubbleVisible] = useState(false);

  // session-level guard so auto tip shows only once per session
  const hasAutoShownRef = useRef(false);

  // Tip queue to avoid immediate repeats in the session
  const tipQueueRef = useRef<string[]>([]);

  // animations
  const bob = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleTranslate = useRef(new Animated.Value(6)).current;

  // Guard after hooks: only render UI for authenticated regular users
  if (!user || user.role?.toLowerCase() !== "user") return null;

  // Build a shuffled queue (no repeats until emptied)
  function refillQueue() {
    const arr = [...TIP_POOL];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    tipQueueRef.current = arr;
  }

  // Start bob + pulse animations
  useEffect(() => {
    const bobAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    bobAnim.start();
    pulseAnim.start();

    return () => {
      bobAnim.stop();
      pulseAnim.stop();
    };
  }, [bob, pulse]);

  // show ephemeral bubble and auto-hide after durationMs
  function showBubble(message: string, durationMs = 2500) {
    setBubbleText(message);
    setBubbleVisible(true);
    bubbleOpacity.setValue(0);
    bubbleTranslate.setValue(6);

    Animated.parallel([
      Animated.timing(bubbleOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(bubbleTranslate, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(bubbleOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bubbleTranslate, {
          toValue: 6,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setBubbleVisible(false);
        setBubbleText(null);
      });
    }, durationMs);
  }

  // initialize tip queue once
  useEffect(() => {
    if (!tipQueueRef.current || tipQueueRef.current.length === 0) {
      refillQueue();
    }
  }, []);

  // auto-show a tip once per session after login
  useEffect(() => {
    if (!user) return;
    if (hasAutoShownRef.current) return;

    const t = setTimeout(() => {
      if (!tipQueueRef.current || tipQueueRef.current.length === 0)
        refillQueue();
      const next = tipQueueRef.current.shift() ?? "Hello — tap to chat!";
      showBubble(next, 2500);
      hasAutoShownRef.current = true;
    }, 700); // slight delay for UX

    return () => clearTimeout(t);
  }, [user]);

  // when user taps once -> open chat modal (do not re-show bubble)
  const handlePress = () => setOpen(true);
  const handleLongPress = () => setOpen(true);

  const translateY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });
  const containerBg = colors?.glass ?? "transparent";

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[
          styles?.genback,
          {
            position: "absolute",
            right: 18,
            bottom: Platform.OS === "ios" ? 130 : 70,
            zIndex: 9999,
          },
        ]}
      >
        <Animated.View
          style={{
            transform: [{ translateY }, { scale: pulse }],
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {bubbleVisible && bubbleText ? (
            <Animated.View
              style={[
                localStyles.bubbleContainer,
                {
                  marginBottom: 8,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: bubbleOpacity,
                  transform: [{ translateY: bubbleTranslate }],
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 8,
                  elevation: 6,
                },
              ]}
            >
              <Text style={{ color: colors.text }}>{bubbleText}</Text>
            </Animated.View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.95}
            onPress={handlePress}
            onLongPress={handleLongPress}
            style={[
              localStyles.touchable,
              {
                backgroundColor: containerBg,
                borderColor: colors.border,
                borderWidth: 1,
                opacity: 0.92,
              },
            ]}
          >
            <Image
              source={kittyIdle}
              style={{ width: 54, height: 54, borderRadius: 27 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <KittyChatbot onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

const localStyles = StyleSheet.create({
  touchable: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleContainer: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 220,
  },
});
