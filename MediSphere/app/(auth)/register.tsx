import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker"; // ✅ added
import { useRouter } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import BASE_URL from "../../lib/apiconfig";
import AppButton from "@/components/appButton";
import { KeyboardTypeOptions } from "react-native";

export default function RegisterScreen() {
  const { styles, sizes, colors } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    gender: "",
    phone: "",
    dob: "", // date string
  });

  const [showDatePicker, setShowDatePicker] = useState(false); // ✅ added

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      Alert.alert("Error", "Username and password are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/register/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.ok) {
        Alert.alert("Success", "Registration successful!", [
          { text: "Go to Login", onPress: () => router.replace("/(auth)/login") },
        ]);
      } else {
        Alert.alert("Error", data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      Alert.alert("Error", "Network error");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <ScrollView contentContainerStyle={{ padding: sizes.gap }} style={[styles.screen, { padding: 5 }]}>
      {[
        { key: "username", label: "Username" },
        { key: "password", label: "Password", secure: true },
        { key: "first_name", label: "First Name" },
        { key: "last_name", label: "Last Name" },
        { key: "gender", label: "Gender" },
        { key: "phone", label: "Phone Number", keyboardType: "phone-pad" },
      ].map((f) => (
        <View key={f.key} style={{ marginTop: sizes.gap }}>
          <Text style={styles.text}>{f.label}</Text>
          <TextInput
            style={styles.input}
            placeholder={f.label}
            secureTextEntry={f.secure}
            keyboardType={(f.keyboardType as KeyboardTypeOptions) || "default"}
            value={form[f.key as keyof typeof form]}
            onChangeText={(v) => handleChange(f.key, v)}
          />
        </View>
      ))}

      {/* ✅ Date of Birth Picker */}
      <View style={{ marginTop: sizes.gap }}>
        <Text style={styles.text}>Date of Birth</Text>

        {Platform.OS === "web" ? (
          <input
            type="date"
            value={form.dob}
            onChange={(e) => handleChange("dob", e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface,
              color: colors.text,
            }}
          />
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.input,
                {
                  justifyContent: "center",
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text style={{ color: colors.text }}>
                {form.dob || "Select Date of Birth"}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                mode="date"
                display="default"
                value={form.dob ? new Date(form.dob) : new Date()}
                onChange={(_, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate)
                    handleChange("dob", selectedDate.toISOString().slice(0, 10));
                }}
              />
            )}
          </>
        )}
      </View>

      <View style={{ marginTop: sizes.gap * 1.5 }}>
        <AppButton title="Register" onPress={handleSubmit} />
      </View>
    </ScrollView>
  );
}
