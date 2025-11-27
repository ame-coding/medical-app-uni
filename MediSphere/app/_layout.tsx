// MediSphere/app/_layout.tsx
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../providers/AuthProvider";
import { ThemeProvider } from "../hooks/useTheme";
import { StatusBar } from "react-native";
import KittyFloating from "../components/kitty/kittyFloating";
import { ChatbotProvider } from "../providers/ChatbotProvider";

import * as Notifications from "expo-notifications";
import {
  initNotificationScheduler,
  ensurePermissionsAndChannel,
} from "../hooks/notificationHelper";
import { useRouter } from "expo-router";

/**
 * AppInit runs once and wires up notifications -> navigation
 */
function AppInit() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await ensurePermissionsAndChannel();
        await initNotificationScheduler();
      } catch (e) {
        console.warn("notification init error", e);
      }
    })();

    const respSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        try {
          const rawData = (response.notification.request.content.data ??
            {}) as any;

          // prefer direct route, else look into __local_meta
          const route =
            (rawData && (rawData.route as string)) ||
            (rawData.__local_meta &&
              rawData.__local_meta.data &&
              rawData.__local_meta.data.route) ||
            null;

          if (route) {
            // navigate to the route encoded in the notification
            try {
              router.push(route);
            } catch (e) {
              console.warn(
                "router.push failed for notification route",
                route,
                e
              );
            }
          } else {
            // fallback if you want: open reminders tab
            // router.push("/(tabs)/reminders");
            console.log(
              "Notification tapped but no route in payload:",
              rawData
            );
          }
        } catch (e) {
          console.warn("notification response handler error", e);
        }
      }
    );

    return () => {
      try {
        respSub.remove();
      } catch {}
    };
  }, [router]);

  return null;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatbotProvider>
          <StatusBar />
          <AppInit />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="(admin_tabs)"
              options={{ headerShown: false }}
            />
          </Stack>
        </ChatbotProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
