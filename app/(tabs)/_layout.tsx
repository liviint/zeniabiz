import { IconSymbol } from "@/src/components/ui/icon-symbol.ios";
import { Tabs } from "expo-router";
import React from "react";
import { HapticTab } from "../../src/components/haptic-tab";
import { useThemeStyles } from "../../src/hooks/useThemeStyles";

export default function TabLayout() {
  const { colors } = useThemeStyles();
  return (
    <>
      <Tabs
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 100,
            paddingBottom: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="dashboard" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="sales"
          options={{
            title: "Sales",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="sales" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: "Expenses",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="expenses" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="inventory"
          options={{
            title: "Stock",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="stock" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="settings/index"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="support/index"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="[...notfound]"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
