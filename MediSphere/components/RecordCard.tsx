import React from "react";
import { View, Text } from "react-native";
import AppButton from "./appButton";
import { useTheme } from "../hooks/useTheme";

type Props = {
  record: any;
  onDelete?: (id: number) => void;
};

export default function RecordCard({ record, onDelete }: Props) {
  const { styles, sizes } = useTheme();

  return (
    <View style={[styles.card, { marginBottom: sizes.gap }]}>
      <Text style={styles.heading}>{record.record_title}</Text>
      <Text style={styles.mutedText}>{record.date}</Text>
      {record.description ? (
        <Text style={styles.mutedText}>{record.description}</Text>
      ) : null}

      <View
        style={{
          marginTop: 12,
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
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
