// app/(tabs)/home.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../providers/AuthProvider";
import { useTheme } from "../../hooks/useTheme";
import { useRouter } from "expo-router";
import BASE_URL from "../../lib/apiconfig";
import { authFetch } from "../../lib/auth";
import {
  initNotificationScheduler,
  getScheduledNotifications,
} from "../../hooks/notificationHelper";

type ReminderItem = {
  id: string;
  title: string;
  date_time: string;
  is_active?: number | null;
};

type ActionItem = {
  id: string;
  label: string;
  icon: string;
  to?: string;
  bgGradient: readonly [string, string];
};

export default function Home() {
  // ---- Hooks (always at top-level) ----
  const { styles, colors, sizes, mode } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();

  // ---- State (always declared) ----
  const [recordsCount, setRecordsCount] = useState<number | null>(null);
  const [remindersCount, setRemindersCount] = useState<number | null>(null);
  const [nextReminder, setNextReminder] = useState<ReminderItem | null>(null);
  const [scheduledLocal, setScheduledLocal] = useState<ReminderItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // ---- Route guard (effect) ----
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/(auth)/login");
    }
  }, [loading, user, router]);

  // ---- Init notification scheduler & hydrate persisted list ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        initNotificationScheduler();
        const list = await getScheduledNotifications();
        if (!mounted) return;
        // normalise unknown -> ReminderItem[]
        setScheduledLocal(Array.isArray(list) ? (list as ReminderItem[]) : []);
      } catch (e) {
        console.warn("initNotificationScheduler error", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ---- Fetch dashboard data ----
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setLoadingData(true);

    (async () => {
      try {
        // records
        try {
          const recRes = await authFetch(`${BASE_URL}/records`);
          if (!mounted) return;
          if (recRes.ok) {
            const recJson = await recRes.json();
            setRecordsCount(
              Array.isArray(recJson.records) ? recJson.records.length : 0
            );
          } else {
            setRecordsCount(0);
          }
        } catch (e) {
          console.warn("records fetch error", e);
          if (mounted) setRecordsCount(0);
        }

        // reminders (public)
        try {
          const r = await fetch(`${BASE_URL}/reminders`);
          if (!mounted) return;
          if (r.ok) {
            const json = await r.json();
            const list: ReminderItem[] =
              json.reminders ||
              (Array.isArray(json) ? (json as any) : json.data) ||
              [];
            const active = list.filter((it) => it && it.is_active !== 0);
            setRemindersCount(active.length);
            const upcoming = active.sort(
              (a, b) =>
                new Date(a.date_time).getTime() -
                new Date(b.date_time).getTime()
            );
            setNextReminder(upcoming.length ? upcoming[0] : null);
          } else {
            setRemindersCount(0);
          }
        } catch (e) {
          console.warn("reminders fetch error", e);
          if (mounted) setRemindersCount(0);
        }
      } catch (err) {
        console.warn("dashboard fetch error", err);
      } finally {
        if (mounted) setLoadingData(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  // ---- Early returns for loading / missing user are safe AFTER hooks ----
  if (loading) {
    return (
      <View style={styles.screen}>
        <Text style={styles.mutedText}>Loading...</Text>
      </View>
    );
  }
  if (!user) return null;

  // ---- Render values ----
  const avatarUri = (user as any).avatar_url || (user as any).avatar || null;
  const screenBg = mode === "dark" ? "#050505" : colors.background;

  const quickActions: ActionItem[] = [
    {
      id: "newRecord",
      label: "Create Record",
      icon: "file-plus",
      to: "../addItems/newRecord",
      bgGradient: [
        colors.primary,
        colors.primaryVariant || colors.primary,
      ] as const,
    },
    {
      id: "newReminder",
      label: "Create Reminder",
      icon: "bell-plus",
      to: "../addItems/newReminders",
      bgGradient: ["#FFD7A8", "#FFB36F"] as const,
    },
    {
      id: "askKitty",
      label: "Ask Kitty",
      icon: "message-circle",
      to: "/chat",
      bgGradient: ["#DDE7FF", "#BFCFFF"] as const,
    },
  ];

  const renderAction = ({ item }: { item: ActionItem }) => (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => (item.to ? router.push(item.to as any) : null)}
      style={[
        local.actionCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <LinearGradient
        colors={item.bgGradient as readonly [string, string]}
        style={local.actionIconWrap}
        start={[0, 0]}
        end={[1, 1]}
      >
        <Feather name={item.icon as any} size={20} color="#fff" />
      </LinearGradient>
      <Text style={[styles.text, { fontWeight: "700", marginTop: 8 }]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.screen, local.container, { backgroundColor: screenBg }]}
    >
      <LinearGradient
        colors={
          [colors.primary, colors.primaryVariant || colors.primary] as const
        }
        style={[local.header, { borderRadius: 16 }]}
      >
        <View style={local.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heading, { color: "#fff", fontSize: 22 }]}>
              Hi, {user.username}
            </Text>
            <Text style={[styles.mutedText, { color: "#fff", marginTop: 6 }]}>
              Overview
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            style={local.avatarWrap}
            activeOpacity={0.85}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={local.avatar} />
            ) : (
              <View style={[local.avatar, { backgroundColor: "#fff" }]}>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>
                  {user.username?.charAt(0)?.toUpperCase() ?? "U"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{
          padding: sizes.gap,
          paddingTop: 12,
          backgroundColor: screenBg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* top stats */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <TouchableOpacity
            style={[
              local.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => router.push("/(tabs)/records")}
          >
            <Text style={[styles.mutedText, { fontSize: 12 }]}>Records</Text>
            <Text style={[styles.heading, { marginTop: 6 }]}>
              {recordsCount === null ? <ActivityIndicator /> : recordsCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              local.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => router.push("/(tabs)/reminders")}
          >
            <Text style={[styles.mutedText, { fontSize: 12 }]}>Reminders</Text>
            <Text style={[styles.heading, { marginTop: 6 }]}>
              {remindersCount === null ? <ActivityIndicator /> : remindersCount}
            </Text>
          </TouchableOpacity>

          <View
            style={[
              local.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.mutedText, { fontSize: 12 }]}>Scheduled</Text>
            <Text style={[styles.heading, { marginTop: 6 }]}>
              {scheduledLocal.length}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.heading}>Quick Actions</Text>
          <FlatList
            data={quickActions}
            numColumns={2}
            keyExtractor={(i) => i.id}
            scrollEnabled={false}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginTop: 12,
            }}
            renderItem={({ item }) => renderAction({ item } as any)}
          />
        </View>

        {/* Next reminder */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.heading}>Next Reminder</Text>
          {nextReminder ? (
            <>
              <Text style={[styles.text, { marginTop: 8 }]}>
                {nextReminder.title}
              </Text>
              <Text style={[styles.mutedText, { marginTop: 6 }]}>
                {new Date(nextReminder.date_time).toLocaleString()}
              </Text>
              <View style={{ marginTop: 10, width: 140 }}>
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/addItems/newReminders?id=${nextReminder.id}`)
                  }
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>View</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={[styles.mutedText, { marginTop: 8 }]}>
              No upcoming reminders.
            </Text>
          )}
        </View>

        {/* Scheduled local */}
        <View style={[styles.card, { marginTop: 12, marginBottom: 24 }]}>
          <Text style={styles.heading}>Scheduled (Local)</Text>
          {scheduledLocal.length > 0 ? (
            scheduledLocal.map((s) => (
              <View key={String(s.id)} style={{ marginTop: 12 }}>
                <View
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={styles.text}>{s.title}</Text>
                  <Text style={styles.mutedText}>
                    {new Date(s.date_time).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.mutedText, { marginTop: 8 }]}>
              No scheduled notifications.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 18,
    paddingTop: Platform.OS === "ios" ? 52 : 28,
    margin: 12,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarWrap: { width: 52, height: 52, borderRadius: 12, overflow: "hidden" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statCard: {
    width: "32%",
    padding: 12,
    borderRadius: 12,
    alignItems: "flex-start",
    justifyContent: "center",
    borderWidth: 1,
  },
  actionCard: { width: "48%", padding: 12, borderRadius: 12, borderWidth: 1 },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 28,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});
