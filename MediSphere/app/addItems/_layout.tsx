import { Slot } from "expo-router";
import React from "react";
import DarkLightButton from "../../components/darklight";
import { useTheme } from "../../hooks/useTheme";
import { useEffect } from "react";
import * as NavigationBar from "expo-navigation-bar";
export default function AddItemsLayout() {
   const { barStyle,colors,styles } = useTheme();
  
  
       useEffect(() => {
      NavigationBar.setButtonStyleAsync(
        barStyle === "dark-content" ? "dark" : "light"
      );
    }, [barStyle]);
  // This hides the tab icon while still rendering any screens inside addItems
  return <Slot />;
}
