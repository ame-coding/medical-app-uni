import { Slot } from "expo-router";
import React from "react";
import DarkLightButton from "../../components/darklight";
export default function AddItemsLayout() {
  // This hides the tab icon while still rendering any screens inside addItems
  return <Slot />;
}
