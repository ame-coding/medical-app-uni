// app/components/RecordCard.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import AppButton from "./appButton";
import { useTheme } from "../hooks/useTheme";
import { useRouter } from "expo-router";

type Props = {
  record: any;
  onDelete?: (id: number) => void;
};

export default function RecordCard({ record, onDelete }: Props) {
  const { styles, sizes, colors } = useTheme();
  const router = useRouter();

  const openView = () => {
    router.push({
      pathname: "/addItems/viewRecord",
      params: { id: record.id },
    });
  };

  const openEdit = () => {
    router.push({
      pathname: "/addItems/editRecord",
      params: { id: record.id },
    });
  };

  return (
    <View style={[styles.card, { marginBottom: sizes.gap }]}>
      <Text style={styles.heading}>{record.record_title}</Text>
      <Text style={styles.mutedText}>{record.date}</Text>

      {record.description ? (
        <Text numberOfLines={2} style={styles.mutedText}>
          {record.description}
        </Text>
      ) : null}

      <View
        style={{
          marginTop: 12,
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={openView}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={openEdit}>
          <Text style={{ color: colors.secondary, fontWeight: "700" }}>
            Edit
          </Text>
        </TouchableOpacity>

        {onDelete && (
          <AppButton
            title="Delete"
            onPress={() => onDelete(record.id)}
            bgColor="red"
            textColor="white"
          />
        )}
      </View>
    </View>
  );
}
