// MediSphere/app/(tabs)/profile.tsx
import React, { useEffect, useState, useMemo, JSX } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../providers/AuthProvider";
import AppButton from "../../components/appButton";
import { router } from "expo-router";
import { authFetch } from "../../lib/auth";
import BASE_URL from "../../lib/apiconfig";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import Svg, { Circle } from "react-native-svg";

/* -------------------- Helpers -------------------- */

function buildProfileUrl(userId: number | string) {
  const base = (BASE_URL || "").replace(/\/+$/, "");
  const hasApiSegment = /\/api(\/|$)/.test(base);
  const prefix = hasApiSegment ? base : `${base}/api`;
  return `${prefix}/profile/${userId}`;
}
function formatDateToYMD(d: Date | null) {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function parseYMDToDate(s?: string | null) {
  if (!s) return null;
  const parts = s.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map((p) => parseInt(p, 10));
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  return new Date(y, m - 1, d);
}
function calcAgeFromDate(d?: Date | null) {
  if (!d) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 ? age : null;
}

/* -------------------- Progress Ring Component -------------------- */

function ProgressRing({
  size = 100,
  strokeWidth = 6,
  progress = 0,
  backgroundColor = "#eee",
  progressColor = "#4caf50",
}: {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  backgroundColor?: string;
  progressColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <Svg width={size} height={size}>
      <Circle
        stroke={backgroundColor}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      <Circle
        stroke={progressColor}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

/* -------------------- Main Component -------------------- */

export default function ProfileScreen(): JSX.Element {
  const { styles, colors } = useTheme();
  const {
    user,
    logout,
    loading: authLoading,
    notifyProfileUpdated,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [dob, setDob] = useState<string>("");
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [age, setAge] = useState<number | null>(null);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (user) fetchUserinfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    setDob(formatDateToYMD(dobDate));
    setAge(calcAgeFromDate(dobDate));
  }, [dobDate]);

  /* Fetch profile */
  const fetchUserinfo = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const endpoint = buildProfileUrl(user.id);
      const res = await authFetch(endpoint);
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        console.warn("Profile: parse JSON failed", e);
      }

      if (res.status === 401) {
        await logout();
        router.replace("/(auth)/login");
        return;
      }

      if (!res.ok) {
        Alert.alert("Error", data?.message || "Failed to fetch profile");
        return;
      }

      const u = (data && data.userinfo) || {};
      const baseUser = (data && data.user) || {};

      setFirstName(u.first_name || "");
      setLastName(u.last_name || "");
      setGender(u.gender || "");
      setPhone(u.phone || "");
      setDob(u.dob || "");
      const parsed = parseYMDToDate(u.dob);
      setDobDate(parsed);
      setAge(calcAgeFromDate(parsed));

      setAvatarUri(baseUser.avatar_url || null);
    } catch (err) {
      console.error("fetchUserinfo error:", err);
      Alert.alert("Error", "Network or server error while loading profile");
    } finally {
      setLoading(false);
    }
  };

  /* Avatar pick/crop/upload */
  const pickImageAndUpload = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission required",
          "Please allow access to photos to set an avatar."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled) return;

      const uri = (result as any).assets?.[0]?.uri || (result as any).uri;
      if (!uri) return;

      const resized = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      const square = await ImageManipulator.manipulateAsync(
        resized.uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      setAvatarUri(square.uri);
      setUploadingAvatar(true);

      const form = new FormData();
      const filename = square.uri.split("/").pop() || `avatar_${user?.id}.jpg`;
      form.append("avatar", {
        uri: square.uri,
        name: filename,
        type: "image/jpeg",
      } as any);

      const uploadUrl = `${BASE_URL}/profile/${user?.id}/avatar`;
      const res = await authFetch(uploadUrl, {
        method: "POST",
        body: form,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.warn("avatar upload failed", json);
        Alert.alert(
          "Upload failed",
          json?.message || "Failed to upload avatar"
        );
        return;
      }

      if (json?.avatar_url) setAvatarUri(json.avatar_url);

      // notify others (home) that profile changed
      notifyProfileUpdated();

      Alert.alert("Success", "Profile picture updated");
      fetchUserinfo();
    } catch (err) {
      console.error("pickImageAndUpload error:", err);
      Alert.alert("Error", "Failed to pick or upload image");
    } finally {
      setUploadingAvatar(false);
    }
  };

  /* Remove avatar (calls DELETE route) */
  const removeAvatar = async () => {
    if (!user) return;
    Alert.alert(
      "Remove photo",
      "Do you really want to remove your profile photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const url = `${BASE_URL}/profile/${user.id}/avatar`;
              const res = await authFetch(url, { method: "DELETE" });
              const json = await res.json().catch(() => null);
              if (!res.ok) {
                console.warn("Avatar removal failed", json);
                Alert.alert(
                  "Error",
                  json?.message || "Failed to remove avatar"
                );
                return;
              }
              setAvatarUri(null);
              // notify others
              notifyProfileUpdated();
              Alert.alert("Removed", "Your profile photo has been removed.");
              fetchUserinfo();
            } catch (err) {
              console.error("removeAvatar error:", err);
              Alert.alert("Error", "Failed to remove avatar");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  /* Save profile */
  const handleSave = async () => {
    if (!user) return;
    if (phone && !/^[0-9+\- ]{7,20}$/.test(phone)) {
      Alert.alert("Validation", "Phone looks invalid");
      return;
    }
    setLoading(true);
    try {
      const endpoint = buildProfileUrl(user.id);
      const body = {
        userinfo: {
          first_name: firstName || null,
          last_name: lastName || null,
          gender: gender || null,
          phone: phone || null,
          dob: dob || null,
        },
      };
      const res = await authFetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);

      if (res.status === 401) {
        await logout();
        router.replace("/(auth)/login");
        return;
      }
      if (!res.ok) {
        Alert.alert("Error", json?.message || "Failed to save profile");
        return;
      }

      // notify others (home)
      notifyProfileUpdated();

      Alert.alert("Saved", "Profile updated");
      setEditing(false);
      fetchUserinfo();
    } catch (err) {
      console.error("handleSave error:", err);
      Alert.alert("Error", "Network or server error");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- Completion percent calculation -------------------- */
  // Items: first_name, last_name, gender, phone, dob, avatar -> 6 items
  const completionPercent = useMemo(() => {
    const items = [
      firstName && firstName.trim().length > 0,
      lastName && lastName.trim().length > 0,
      gender && gender.trim().length > 0,
      phone && phone.trim().length > 0,
      dob && dob.trim().length > 0,
      !!avatarUri,
    ];
    const done = items.filter(Boolean).length;
    return done / items.length; // 0..1
  }, [firstName, lastName, gender, phone, dob, avatarUri]);

  if (authLoading) {
    return (
      <View
        style={[
          styles.screen,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.screen}>
        <Text style={styles.text}>Not signed in</Text>
        <AppButton
          title="Go to login"
          onPress={() => router.replace("/(auth)/login")}
        />
      </View>
    );
  }

  /* Small typed subcomponents */
  type FieldProps = { label: string; value?: string | null };
  const Field: React.FC<FieldProps> = ({ label, value }) => (
    <View style={local.row}>
      <Text style={[styles.text, local.label]}>{label}</Text>
      <Text style={[styles.text, local.value]}>{value ?? "-"}</Text>
    </View>
  );

  type LabelInputProps = {
    label: string;
    value?: string | null;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  const LabelInput: React.FC<LabelInputProps> = ({
    label,
    value,
    onChange,
    placeholder,
  }) => (
    <>
      <Text style={[styles.text, local.inputLabel]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface }]}
        value={value ?? ""}
        onChangeText={onChange}
        placeholder={placeholder}
      />
    </>
  );

  /* -------------------- Render UI -------------------- */
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[local.container, { paddingBottom: 40 }]}
    >
      {/* Header card with ring + avatar */}
      <View style={[styles.card, local.headerCard]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={local.ringWrap}>
            <ProgressRing
              size={100}
              strokeWidth={6}
              progress={completionPercent}
              backgroundColor={colors.border || "#eee"}
              progressColor={colors.primary || "#4caf50"}
            />
            <TouchableOpacity
              onPress={pickImageAndUpload}
              activeOpacity={0.85}
              style={local.avatarTouchable}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={local.avatar} />
              ) : (
                <View
                  style={[
                    local.avatar,
                    {
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#e8e8e8",
                    },
                  ]}
                >
                  <Text style={local.avatarText}>
                    {(firstName || lastName || user.username || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={local.percentLabel}>
              <Text style={{ color: colors.text, fontSize: 12 }}>
                {Math.round(completionPercent * 100)}%
              </Text>
            </View>
          </View>

          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.text, local.username]}>{user.username}</Text>
            <Text style={[styles.text, local.role]}>{user.role}</Text>

            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setEditing((p) => !p)}
                style={{ marginRight: 10 }}
              >
                <View style={[styles.card, { padding: 8 }]}>
                  <Text style={[styles.text, { fontWeight: "700" }]}>
                    {editing ? "Cancel" : "Edit"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={removeAvatar}>
                <View style={[styles.card, { padding: 8 }]}>
                  <Text
                    style={[styles.text, { fontWeight: "700", color: "#c00" }]}
                  >
                    Remove Photo
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Personal Info */}
      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={[styles.text, local.sectionTitle]}>
          Contact & Personal
        </Text>

        {!editing ? (
          <>
            <Field label="First name" value={firstName} />
            <Field label="Last name" value={lastName} />
            <Field label="Gender" value={gender} />
            <Field label="Phone" value={phone} />
            <Field label="DOB" value={dob} />
            <Field
              label="Age"
              value={age !== null && age !== undefined ? String(age) : "-"}
            />

            <View style={{ marginTop: 10 }}>
              <AppButton title="Refresh" onPress={fetchUserinfo} />
            </View>
          </>
        ) : (
          <>
            <LabelInput
              label="First name"
              value={firstName}
              onChange={setFirstName}
            />
            <LabelInput
              label="Last name"
              value={lastName}
              onChange={setLastName}
            />
            <LabelInput
              label="Gender"
              value={gender}
              onChange={setGender}
              placeholder="male / female / other"
            />
            <LabelInput
              label="Phone"
              value={phone}
              onChange={setPhone}
              placeholder="+91 9xxxxxxxxx"
            />

            <Text style={[styles.text, local.inputLabel]}>
              DOB (tap to pick)
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={local.datePickerBtn}
            >
              <Text style={[styles.text]}>{dob || "Select date"}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dobDate || new Date(1990, 0, 1)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, selectedDate) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (selectedDate) setDobDate(selectedDate);
                }}
                maximumDate={new Date()}
              />
            )}

            <Text style={[styles.text, { marginTop: 8 }]}>Age</Text>
            <Text style={[styles.text, { fontWeight: "600", marginBottom: 8 }]}>
              {age !== null && age !== undefined ? `${age} years` : "-"}
            </Text>

            <View style={{ marginTop: 8 }}>
              <AppButton
                title={loading ? "Saving..." : "Save"}
                onPress={handleSave}
                disabled={loading}
              />
              <AppButton
                title="Cancel"
                onPress={() => {
                  setEditing(false);
                  fetchUserinfo();
                }}
              />
            </View>
          </>
        )}
      </View>

      {/* Account card */}
      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={[styles.text, local.sectionTitle]}>Account</Text>
        <View style={local.row}>
          <Text style={[styles.text, local.label]}>Username</Text>
          <Text style={[styles.text, local.value]}>{user.username}</Text>
        </View>
        <View style={local.row}>
          <Text style={[styles.text, local.label]}>Role</Text>
          <Text style={[styles.text, local.value]}>{user.role}</Text>
        </View>

        <View style={{ marginTop: 10 }}>
          <AppButton
            title="Logout"
            onPress={async () => {
              await logout();
              router.replace("/(auth)/login");
            }}
          />
        </View>
      </View>

      {(loading || uploadingAvatar) && (
        <View style={{ marginTop: 12 }}>
          <ActivityIndicator />
        </View>
      )}
    </ScrollView>
  );
}

/* -------------------- Styles -------------------- */

const local = StyleSheet.create({
  container: { padding: 12, paddingBottom: 40, backgroundColor: "transparent" },
  headerCard: { padding: 12, marginBottom: 8 },
  ringWrap: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarTouchable: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#e8e8e8",
  },
  avatarText: { fontSize: 34, fontWeight: "700" },
  percentLabel: { position: "absolute", bottom: -18, alignSelf: "center" },
  username: { fontSize: 18, fontWeight: "700" },
  role: { marginTop: 4, opacity: 0.8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", paddingVertical: 8, alignItems: "center" },
  label: { flex: 0.45, opacity: 0.9 },
  value: { flex: 0.55 },
  inputLabel: { marginTop: 8, marginBottom: 6 },
  input: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
  },
  datePickerBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
    marginBottom: 8,
  },
});
