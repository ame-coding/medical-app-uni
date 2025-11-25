// MediSphere/app/(tabs)/home.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../providers/AuthProvider";
import { useTheme } from "../../hooks/useTheme";
import { useRouter } from "expo-router";
import AppButton from "@/components/appButton";
import BASE_URL from "../../lib/apiconfig";
import {
  initNotificationScheduler,
  getScheduledNotifications,
} from "../../hooks/notificationHelper";
import { authFetch } from "../../lib/auth";

type ReminderItem = {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  date_time: string;
  is_active?: number | null;
};

type RecommendationItem = {
  id?: string | number;
  rule?: string;
  text: string;
  level?: "urgent" | "warn" | "info";
  actions?: string[];
  recordId?: number | string;
  // allow other shapes
  [k: string]: any;
};

type ActionItem = {
  id: string;
  label: string;
  icon: string;
  to?: string;
  bgGradient: readonly [string, string];
};

/* -------------------- Profile Sidebar Component -------------------- */
/**
 * Minimal, tappable profile sidebar used on Home page.
 * Shows avatar / initial, username+role, and a small percent + progress bar.
 */
function ProfileSidebar({
  user,
  avatarUri,
  profilePercent,
}: {
  user: any;
  avatarUri: string | null;
  profilePercent: number;
}) {
  const { styles, colors } = useTheme();
  const router = useRouter();

  const percent = Math.max(0, Math.min(100, Math.round(profilePercent)));

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push("/(tabs)/profile")}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 8,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Avatar */}
      <View style={{ marginRight: 12 }}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={{ width: 56, height: 56, borderRadius: 12 }}
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
            </Text>
          </View>
        )}
      </View>

      {/* Username + Role */}
      <View style={{ flex: 1 }}>
        <Text style={[styles.heading, { fontSize: 16 }]} numberOfLines={1}>
          {user?.username}
        </Text>
        <Text style={[styles.mutedText, { marginTop: 2 }]} numberOfLines={1}>
          {user?.role}
        </Text>
      </View>

      {/* Percent + small bar */}
      <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
        <Text style={[styles.text, { fontWeight: "700", marginBottom: 6 }]}>
          {percent}%
        </Text>

        <View
          style={{
            height: 8,
            width: 76,
            borderRadius: 6,
            backgroundColor: colors.background,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${percent}%`,
              backgroundColor: colors.secondary || colors.primary,
            }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* -------------------- Main Home Component -------------------- */

export default function Home() {
  const { styles, colors, sizes, mode } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [recordsCount, setRecordsCount] = useState<number | null>(null);
  const [remindersCount, setRemindersCount] = useState<number | null>(null);
  const [nextReminder, setNextReminder] = useState<ReminderItem | null>(null);
  const [scheduledLocal, setScheduledLocal] = useState<any[]>([]);
  const [topRecs, setTopRecs] = useState<RecommendationItem[]>([]);
  const [profilePercent, setProfilePercent] = useState<number>(0);
  const [loadingData, setLoadingData] = useState(false);

  // Protect route
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/(auth)/login");
    }
  }, [loading, user, router]);

  // local scheduler
  useEffect(() => {
    initNotificationScheduler();
    getScheduledNotifications().then((list) => setScheduledLocal(list || []));
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (!user) return;
    setLoadingData(true);

    (async () => {
      try {
        // Records
        try {
          const recRes = await authFetch(`${BASE_URL}/records`);
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
          setRecordsCount(0);
        }

        // Reminders (public)
        try {
          const r = await fetch(`${BASE_URL}/reminders`);
          if (r.ok) {
            const json = await r.json();
            const list: ReminderItem[] =
              json.reminders || (Array.isArray(json) ? json : json.data) || [];
            const active = list.filter((it) => it && it.is_active !== 0);
            setRemindersCount(active.length);
            const upcoming = list
              .filter((item) => item && item.is_active !== 0)
              .sort(
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
          setRemindersCount(0);
        }

        // Recommendations (auth)
        try {
          const rec = await authFetch(`${BASE_URL}/recommendations/${user.id}`);
          if (rec.ok) {
            const recJson = await rec.json();
            // ensure array
            setTopRecs(
              Array.isArray(recJson.recommendations)
                ? recJson.recommendations
                : []
            );
          } else {
            setTopRecs([]);
          }
        } catch (e) {
          console.warn("recommendations fetch error", e);
          setTopRecs([]);
        }

        // Profile completeness
        try {
          const p = await authFetch(`${BASE_URL}/profile/${user.id}`);
          if (p.ok) {
            const pj = await p.json();
            const uinfo = pj.userinfo || {};
            const fields = [
              "first_name",
              "last_name",
              "gender",
              "phone",
              "dob",
              "avatar_url",
              "avatar",
            ];
            let filled = 0;
            for (const f of fields) {
              if (uinfo[f] || (user as any)[f]) filled++;
            }
            const percent = Math.round((filled / fields.length) * 100);
            setProfilePercent(percent);
          } else {
            setProfilePercent(0);
          }
        } catch (e) {
          console.warn("profile fetch error", e);
          setProfilePercent(0);
        }
      } catch (err) {
        console.warn("dashboard fetch error", err);
      } finally {
        setLoadingData(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <Text style={styles.mutedText}>Loading...</Text>
      </View>
    );
  }
  if (!user) return null;

  // avatar
  const avatarUri = (user as any).avatar_url || (user as any).avatar || null;

  // dark-mode near-black background
  const screenBg = mode === "dark" ? "#050505" : colors.background;

  // Quick actions (kept small)
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
      id: "uploadFile",
      label: "Upload File",
      icon: "upload-cloud",
      to: "../addItems/newRecord",
      bgGradient: ["#D1FFD6", "#9CE8B8"] as const,
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
      onPress={() =>
        item.to ? router.push(item.to as any) : Alert.alert(item.label)
      }
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
      <Text style={[styles.mutedText, { marginTop: 6, fontSize: 12 }]}>
        {item.id === "newRecord" ? "Add a medical file" : "Shortcut"}
      </Text>
    </TouchableOpacity>
  );

  // Recommendation row renderer — small right-attached "View" pill
  const renderRecommendationRow = useCallback(
    ({ item, index }: { item: RecommendationItem; index: number }) => {
      const onPressView = () => {
        const id = item.recordId ?? item.record_id ?? item.recordId ?? item.id;
        if (id) {
          router.push(
            `/addItems/viewRecord?id=${encodeURIComponent(String(id))}`
          );
        } else {
          // fallback: open chat for discussion
          router.push("/chat");
        }
      };

      return (
        <View
          key={item.id ?? index}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 14,
            borderBottomWidth: index === topRecs.length - 1 ? 0 : 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text
            style={[styles.text, { flex: 1, paddingRight: 12, lineHeight: 20 }]}
          >
            {item.text}
          </Text>

          <TouchableOpacity
            onPress={onPressView}
            activeOpacity={0.85}
            style={{
              backgroundColor: colors.primaryVariant || colors.primary,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
              alignSelf: "flex-start",
              minWidth: 72,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
              View
            </Text>
          </TouchableOpacity>
        </View>
      );
    },
    [router, topRecs, styles.text, colors]
  );

  return (
    <View
      style={[styles.screen, local.container, { backgroundColor: screenBg }]}
    >
      {/* header */}
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
              Welcome back — quick summary.
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
          <View
            style={[
              local.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.mutedText, { fontSize: 12 }]}>Records</Text>
            <Text style={[styles.heading, { marginTop: 6 }]}>
              {recordsCount === null ? <ActivityIndicator /> : recordsCount}
            </Text>
            <Text style={[styles.mutedText, { marginTop: 8, fontSize: 12 }]}>
              Your medical files
            </Text>
          </View>

          <View
            style={[
              local.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.mutedText, { fontSize: 12 }]}>Reminders</Text>
            <Text style={[styles.heading, { marginTop: 6 }]}>
              {remindersCount === null ? <ActivityIndicator /> : remindersCount}
            </Text>
            <Text style={[styles.mutedText, { marginTop: 8, fontSize: 12 }]}>
              {nextReminder
                ? new Date(nextReminder.date_time).toLocaleString()
                : "No upcoming"}
            </Text>
          </View>

          <View
            style={[
              local.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.mutedText, { fontSize: 12 }]}>
              Recommendations
            </Text>
            <Text style={[styles.heading, { marginTop: 6 }]}>
              {topRecs.length}
            </Text>
            <Text style={[styles.mutedText, { marginTop: 8, fontSize: 12 }]}>
              Actionable tips
            </Text>
          </View>
        </View>

        {/* Profile Sidebar (replaces the previous ring + text) */}
        {profilePercent < 100 && (
          <View
            style={[
              styles.card,
              {
                marginTop: 6,
                padding: 12,
              },
            ]}
          >
            <ProfileSidebar
              user={user}
              avatarUri={avatarUri}
              profilePercent={profilePercent}
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.heading}>Quick Actions</Text>
          <Text style={styles.mutedText}>
            Common tasks you may need right now
          </Text>

          <View style={{ marginTop: 14 }}>
            <FlatList
              data={quickActions}
              numColumns={2}
              keyExtractor={(i) => i.id}
              scrollEnabled={false}
              columnWrapperStyle={{
                justifyContent: "space-between",
                marginBottom: 12,
              }}
              renderItem={({ item }) => renderAction({ item })}
            />
          </View>
        </View>

        {/* Next reminder (compact) */}
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
                <AppButton
                  title="View"
                  onPress={() =>
                    router.push(`/addItems/newReminders?id=${nextReminder.id}`)
                  }
                />
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
              <View key={s.id} style={{ marginTop: 12 }}>
                <Text style={styles.text}>{s.title}</Text>
                <Text style={styles.mutedText}>
                  {new Date(s.date_time).toLocaleString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.mutedText, { marginTop: 8 }]}>
              No scheduled notifications.
            </Text>
          )}
        </View>
        {/* Quick Recommendations */}
        <View style={[styles.card, { marginTop: 12, padding: 12 }]}>
          <Text style={styles.heading}>Quick Recommendations</Text>
          <Text style={[styles.mutedText, { marginTop: 6 }]}>
            Tap View to open the related record or discuss.
          </Text>

          <View style={{ marginTop: 12 }}>
            {topRecs.length === 0 ? (
              <Text style={[styles.mutedText]}>
                No recommendations right now.
              </Text>
            ) : (
              <FlatList
                data={topRecs}
                keyExtractor={(r, i) => String(r.id ?? i)}
                renderItem={renderRecommendationRow}
                scrollEnabled={false}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating action button */}
      <TouchableOpacity
        onPress={() => router.push("../addItems/newRecord")}
        style={[
          local.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 10,
          },
        ]}
        activeOpacity={0.9}
      >
        <Feather name="plus" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const local = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    padding: 12,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "flex-start",
  },
  divider: {
    width: 1,
    height: 44,
    backgroundColor: "#EAEAEA",
    marginHorizontal: 10,
  },
  actionCard: {
    width: "48%",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statCard: {
    width: "32%",
    padding: 12,
    borderRadius: 12,
    alignItems: "flex-start",
    justifyContent: "center",
    borderWidth: 1,
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
