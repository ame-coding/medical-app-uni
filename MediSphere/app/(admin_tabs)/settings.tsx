// app/(admin_tabs)/settings.tsx
import React from "react";
import { View, Text, Switch } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export default function SettingsScreen() {
  const { styles, colors, sizes } = useTheme();
  const [notifications, setNotifications] = React.useState(true);
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Settings</Text>

      <View style={[styles.card, { marginBottom: sizes.gap }]}>
        <Text style={styles.text}>Enable Notifications</Text>
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          thumbColor={notifications ? colors.primaryVariant : "#ccc"}
        />
      </View>

      <View style={[styles.card, { marginBottom: sizes.gap }]}>
        <Text style={styles.text}>Maintenance Mode</Text>
        <Switch
          value={maintenanceMode}
          onValueChange={setMaintenanceMode}
          thumbColor={maintenanceMode ? colors.primaryVariant : "#ccc"}
        />
      </View>

      <View style={[styles.card, { marginBottom: sizes.gap }]}>
        <Text style={styles.text}>Version</Text>
        <Text style={styles.mutedText}>v1.0.0</Text>
      </View>
    </View>
  );
}
