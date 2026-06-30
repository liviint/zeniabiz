import { IconSymbol } from "@/src/components/ui/icon-symbol.ios";
import React,{ useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Tabs } from "expo-router";
import { HapticTab } from "../../src/components/haptic-tab";
import { useThemeStyles } from "../../src/hooks/useThemeStyles";
import {  canViewReports } from "../../src/utils/rolesAndPermissions/index"

export default function TabLayout() {
  const { colors } = useThemeStyles();

  const user = useSelector((state) => state.user.userDetails);

  const [isAllowedToViewReports,setIsAllowedToViewReports] = useState(canViewReports())


  useEffect(() => {
    setIsAllowedToViewReports(canViewReports())
  },[user])

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

        {isAllowedToViewReports ? 
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="dashboard" color={color} />
            ),
          }}
        />
        :
        <Tabs.Screen
          name="dashboard"
          options={{
            href: null,
          }}
        />
      }

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
            title: "Items",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="stock" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="auth"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="feedback"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="credits"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="customers"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="suppliers"
          options={{
            href: null,
          }}
        />
      <Tabs.Screen
          name="business/index"
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
