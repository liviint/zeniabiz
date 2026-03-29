import { Tabs } from 'expo-router';
import React from 'react';
import { HapticTab } from '../../src/components/haptic-tab';
import { useThemeStyles } from '../../src/hooks/useThemeStyles';

export default function TabLayout() {
  const {colors} = useThemeStyles()
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
        name="transactions"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="transactions-templates"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="settings/index"
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
