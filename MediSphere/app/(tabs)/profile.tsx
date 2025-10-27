// app/(admin_tabs)/profile.tsx
import React, { useEffect, useState } from "react";
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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../providers/AuthProvider";
import AppButton from "../../components/appButton";
import { router } from "expo-router";
import { authFetch } from "../../lib/auth";
import BASE_URL from "../../lib/apiconfig";

/**
 * Build endpoint safely even if BASE_URL already contains '/api'
 */
function buildProfileUrl(userId: number | string) {
  const base = (BASE_URL || "").replace(/\/+$/, "");
  const hasApiSegment = /\/api(\/|$)/.test(base);
  const prefix = hasApiSegment ? base : `${base}/api`;
  return `${prefix}/profile/${userId}`;
}

/** format Date -> YYYY-MM-DD */
function formatDateToYMD(d: Date | null) {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** parse YYYY-MM-DD -> Date or null */
function parseYMDToDate(s?: string | null) {
  if (!s) return null;
  const parts = s.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map((p) => parseInt(p, 10));
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

/** calculate age in years given a Date */
function calcAgeFromDate(d?: Date | null) {
  if (!d) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export default function ProfileScreen() {
  const { styles } = useTheme();
  const { user, logout, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState(""); // YYYY-MM-DD string
  const [dobDate, setDobDate] = useState<Date | null>(null); // Date object for picker
  const [age, setAge] = useState<number | null>(null);

  // date picker controls
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode] = useState<"date">("date");

  useEffect(() => {
    console.log("ProfileScreen mounted, user:", user);
    if (!user) return;
    fetchUserinfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // whenever dobDate changes, update dob string + age
  useEffect(() => {
    const ymd = formatDateToYMD(dobDate);
    setDob(ymd);
    const computed = calcAgeFromDate(dobDate);
    setAge(computed);
  }, [dobDate]);

  const fetchUserinfo = async () => {
    if (!user) return;
    setLoading(true);
    const endpoint = buildProfileUrl(user.id);
    console.log("fetchUserinfo: endpoint ->", endpoint);
    try {
      const res = await authFetch(endpoint);
      console.log("fetchUserinfo: response status =", res.status);

      const raw = await res.text();
      console.log("fetchUserinfo: raw response ->", raw);

      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
        console.log("fetchUserinfo: parsed JSON ->", data);
      } catch (e) {
        console.warn("fetchUserinfo: JSON parse failed:", e);
      }

      if (res.status === 401) {
        console.warn("fetchUserinfo: unauthorized -> logging out");
        await logout();
        router.replace("/(auth)/login");
        return;
      }

      if (!res.ok) {
        const msg = data?.message || "Failed to fetch profile";
        console.error("fetchUserinfo: server error:", msg);
        Alert.alert("Error", msg);
        return;
      }

      const u = (data && data.userinfo) || null;
      setFirstName(u?.first_name || "");
      setLastName(u?.last_name || "");
      setGender(u?.gender || "");
      setPhone(u?.phone || "");
      setDob(u?.dob || "");
      const parsed = parseYMDToDate(u?.dob);
      setDobDate(parsed);
      setAge(calcAgeFromDate(parsed));
    } catch (err) {
      console.error("fetchUserinfo: network/unexpected error:", err);
      Alert.alert("Error", "Network or server error");
    } finally {
      setLoading(false);
      console.log("fetchUserinfo: done");
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // dob should already be in YYYY-MM-DD from dobDate effect, but validate
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      Alert.alert("Validation", "DOB must be YYYY-MM-DD");
      return;
    }
    if (phone && !/^[0-9+\- ]{7,20}$/.test(phone)) {
      Alert.alert("Validation", "Phone looks invalid");
      return;
    }

    setLoading(true);
    const endpoint = buildProfileUrl(user.id);
    console.log("handleSave: endpoint ->", endpoint);
    try {
      const body = {
        userinfo: {
          first_name: firstName === "" ? null : firstName.trim(),
          last_name: lastName === "" ? null : lastName.trim(),
          gender: gender === "" ? null : gender.trim(),
          phone: phone === "" ? null : phone.trim(),
          dob: dob === "" ? null : dob,
        },
      };

      console.log("handleSave: body ->", body);
      const res = await authFetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log("handleSave: response status =", res.status);
      const raw = await res.text();
      console.log("handleSave: raw ->", raw);

      let json = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.warn("handleSave: parse failed", e);
      }

      if (res.status === 401) {
        await logout();
        router.replace("/(auth)/login");
        return;
      }

      if (!res.ok) {
        const msg = json?.message || "Failed to update profile";
        Alert.alert("Error", msg);
        return;
      }

      await fetchUserinfo();
      setEditing(false);
      Alert.alert("Success", "Profile updated");
    } catch (err) {
      console.error("handleSave: error:", err);
      Alert.alert("Error", "Network or server error");
    } finally {
      setLoading(false);
      console.log("handleSave: finished");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  // Date picker change handler
  const onChangeDate = (_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios"); // keep open on iOS, close on Android
    if (selectedDate) {
      setDobDate(selectedDate);
    }
  };

  // show date picker (Android opens native picker; iOS shows inline)
  const openDatePicker = () => {
    setShowDatePicker(true);
  };

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

  const Field = ({
    label,
    value,
  }: {
    label: string;
    value?: string | null;
  }) => (
    <View style={localStyles.row}>
      <Text style={[styles.text, localStyles.label]}>{label}</Text>
      <Text style={[styles.text, localStyles.value]}>{value ?? "-"}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[localStyles.container, { flexGrow: 1 }]}
    >
      <View style={[styles.card, localStyles.headerCard]}>
        <View style={localStyles.avatar}>
          <Text style={[styles.text, localStyles.avatarText]}>
            {(firstName || lastName || user.username || "?")
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>
        <View style={localStyles.headerInfo}>
          <Text style={[styles.text, localStyles.username]}>
            {user.username}
          </Text>
          <Text style={[styles.text, localStyles.role]}>{user.role}</Text>
        </View>
      </View>

      <View style={[styles.card, localStyles.card]}>
        <Text style={[styles.text, localStyles.sectionTitle]}>
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

            <View style={localStyles.buttons}>
              <AppButton
                title="Edit Profile"
                onPress={() => setEditing(true)}
              />
              <AppButton title="Refresh" onPress={fetchUserinfo} />
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.text, localStyles.inputLabel]}>
              First name
            </Text>
            <TextInput
              style={[styles.input, localStyles.input]}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />

            <Text style={[styles.text, localStyles.inputLabel]}>Last name</Text>
            <TextInput
              style={[styles.input, localStyles.input]}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />

            <Text style={[styles.text, localStyles.inputLabel]}>Gender</Text>
            <TextInput
              style={[styles.input, localStyles.input]}
              value={gender}
              onChangeText={setGender}
              placeholder="male / female / other"
              autoCapitalize="none"
            />

            <Text style={[styles.text, localStyles.inputLabel]}>Phone</Text>
            <TextInput
              style={[styles.input, localStyles.input]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 9xxxxxxxxx"
            />

            <Text style={[styles.text, localStyles.inputLabel]}>
              DOB (tap to pick)
            </Text>
            <TouchableOpacity
              onPress={openDatePicker}
              style={localStyles.datePickerBtn}
            >
              <Text style={[styles.text, localStyles.dateText]}>
                {dob || "Select date"}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dobDate || new Date(1990, 0, 1)}
                mode={datePickerMode}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onChangeDate}
                maximumDate={new Date()} // can't pick future
              />
            )}

            <Text style={[styles.text, localStyles.inputLabel]}>Age:</Text>
            <Text style={[styles.text, localStyles.ageDisplay]}>
              {age !== null && age !== undefined ? `${age} years` : "-"}
            </Text>

            <View style={localStyles.buttons}>
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

      <View style={[styles.card, localStyles.card]}>
        <Text style={[styles.text, localStyles.sectionTitle]}>Account</Text>
        <Field label="Username" value={user.username} />
        <Field label="Role" value={user.role} />
        <AppButton title="Logout" onPress={handleLogout} />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  container: { padding: 12, paddingBottom: 40 },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
  },
  headerInfo: { marginLeft: 12, flex: 1 },
  username: { fontSize: 18, fontWeight: "700" },
  role: { fontSize: 13, opacity: 0.8 },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },
  avatarText: { fontSize: 28, fontWeight: "700" },
  card: { padding: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", paddingVertical: 8, alignItems: "center" },
  label: { flex: 0.45, opacity: 0.9 },
  value: { flex: 0.55 },
  inputLabel: { marginTop: 8, marginBottom: 4 },
  input: { marginBottom: 8, padding: 8, borderRadius: 6 },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  datePickerBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f2f2f2",
    marginBottom: 8,
  },
  dateText: { fontSize: 14 },
  ageDisplay: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
});
