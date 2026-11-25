
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Tabs } from "expo-router";

import { IconSymbol } from "@/src/components/ui/icon-symbol.ios";
import { useThemeStyles } from "../../src/hooks/useThemeStyles";
import { canViewReports } from "../../src/utils/rolesAndPermissions";

export default function TabLayout() {
    const { colors } = useThemeStyles();

    const user = useSelector(
        (state) => state.user.userDetails
    );

    const [isAllowedToViewReports, setIsAllowedToViewReports] =
        useState(canViewReports());

    useEffect(() => {
        setIsAllowedToViewReports(canViewReports());
    }, [user]);

    return (
        <Tabs
            backBehavior="history"
            screenOptions={{
                headerShown: false,

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
            {/* Internal homepage route */}
            <Tabs.Screen
                name="index"
                options={{
                    href: null,
                }}
            />

            {/* Dashboard */}
            <Tabs.Screen
                name="dashboard"
                options={{
                    href: isAllowedToViewReports ? undefined : null,
                    title: "Dashboard",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={24}
                            name="dashboard"
                            color={color}
                        />
                    ),
                }}
            />

            {/* Sales */}
            <Tabs.Screen
                name="sales"
                options={{
                    title: "Sales",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={24}
                            name="sales"
                            color={color}
                        />
                    ),
                }}
            />

            {/* Expenses */}
            <Tabs.Screen
                name="expenses"
                options={{
                    title: "Expenses",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={24}
                            name="expenses"
                            color={color}
                        />
                    ),
                }}
            />

            {/* Inventory */}
            <Tabs.Screen
                name="inventory"
                options={{
                    title: "Items",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={24}
                            name="stock"
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
