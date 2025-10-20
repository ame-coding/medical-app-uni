// app/(auth)/register.tsx
import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import BASE_URL from "../../lib/apiconfig";
import AppButton from "@/components/appButton";
import { KeyboardTypeOptions } from "react-native";

export default function RegisterScreen() {
  const { styles, sizes } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    gender: "",
    phone: "",
    dob: "", // ✅ renamed
  });

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
      <Text style={styles.heading}>Register</Text>

      {[
        { key: "username", label: "Username" },
        { key: "password", label: "Password", secure: true },
        { key: "first_name", label: "First Name" },
        { key: "last_name", label: "Last Name" },
        { key: "gender", label: "Gender" },
        { key: "phone", label: "Phone Number", keyboardType: "phone-pad" },
        { key: "dob", label: "Date of Birth (YYYY-MM-DD)" }, // ✅ renamed + hint
      ].map((f) => (
        <View key={f.key} style={{ marginTop: sizes.gap }}>
          <Text style={{ fontSize: 14, color: "#666", fontWeight: "500", marginBottom: 4 }}>
            {f.label}
          </Text>
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

      <View style={{ marginTop: sizes.gap * 1.5 }}>
        <AppButton title="Register" onPress={handleSubmit} />
      </View>
    </ScrollView>
  );
}
