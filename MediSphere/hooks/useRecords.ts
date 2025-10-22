import { useState, useCallback } from "react";
import { authFetch } from "../lib/auth";
import BASE_URL from "../lib/apiconfig";
import { Alert } from "react-native";

export default function useRecords() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/records`);
      const data = await res.json();
      if (data.ok) setRecords(data.records || []);
      else Alert.alert("Error", data.message || "Failed to fetch records");
    } catch (err) {
      console.error("Load records error:", err);
      Alert.alert("Error", "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRecord = useCallback(async (id: number) => {
    try {
      const res = await authFetch(`${BASE_URL}/records/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) setRecords((prev) => prev.filter((r) => r.id !== id));
      else Alert.alert("Error", data.message || "Failed to delete record");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Network error");
    }
  }, []);

  return { records, loading, loadRecords, deleteRecord };
}
