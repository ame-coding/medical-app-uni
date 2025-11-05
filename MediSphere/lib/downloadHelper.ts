import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

/**
 * Secure download helper for Android + iOS (Expo SDK 52+)
 * - Android: saves to user-selected Downloads folder
 * - iOS: saves locally, opens Share sheet
 */
export const downloadWithAuth = async (
  id: number,
  filenameHint: string | undefined,
  token: string,
  BASE_URL: string
) => {
  try {
    const url = `${BASE_URL}/records/download/${id}`;
    const filename = filenameHint || `record-${id}.pdf`;
    let targetUri = "";

    // --- Android: use StorageAccessFramework dynamically ---
    if (Platform.OS === "android") {
      const SAF: any = (FileSystem as any).StorageAccessFramework;

      if (!SAF) {
        Alert.alert("Error", "StorageAccessFramework unavailable on this platform.");
        return;
      }

      const permissions = await SAF.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        Alert.alert("Permission Denied", "Cannot access storage to save file.");
        return;
      }

      const fileUri = await SAF.createFileAsync(
        permissions.directoryUri,
        filename,
        "application/octet-stream"
      );

      const downloadResumable = FileSystem.createDownloadResumable(url, fileUri, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await downloadResumable.downloadAsync();
      if (!result || result.status !== 200) throw new Error("Download failed");

      targetUri = result.uri;
    }

    // --- iOS and others ---
    // --- iOS and others ---
else {
  // Access dynamically to avoid TS export errors
  const fsAny = FileSystem as any;
  const docsDir = fsAny.documentDirectory ?? fsAny.cacheDirectory ?? "";
  targetUri = `${docsDir}${filename}`;

  const result = await FileSystem.downloadAsync(url, targetUri, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!result || result.status !== 200) throw new Error("Download failed");
}

    // --- Optional Share dialog for iOS ---
    if (Platform.OS === "ios" && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(targetUri);
    }

    Alert.alert("Downloaded", `Saved to: ${targetUri}`);
  } catch (err) {
    console.error("Download error:", err);
    Alert.alert("Error", "Could not download file.");
  }
};
