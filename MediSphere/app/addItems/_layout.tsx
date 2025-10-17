import { Slot } from "expo-router";
import React from "react";

export default function AddItemsLayout() {
  // This hides the tab icon while still rendering any screens inside addItems
  return <Slot />;
}
