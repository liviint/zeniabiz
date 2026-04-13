import { View, ScrollView, StyleSheet, Text, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import SummaryCards from "../../../src/components/dashboard/SummaryCards"
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { BodyText, SecondaryText } from "../../../src/components/ThemeProvider/components";
import CashflowChart from "../../../src/components/dashboard/CashflowChart";
import ExpenseBreakdown from "../../../src/components/dashboard/ExpenseBreakdown";

export default function DashboardScreen() {
    const { globalStyles } = useThemeStyles()
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);

        setTimeout(() => {
        setRefreshing(false);
        }, 800);
    }, []);

    return (
        <View style={globalStyles.container}>
            <BodyText style={globalStyles.title}>Dashboard</BodyText>
            <SecondaryText style={globalStyles.subTitle}>Track your business performance</SecondaryText>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <SummaryCards />

                <CashflowChart />

                <ExpenseBreakdown /> 

                <View style={{ height: 24 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({

  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333333",
  },

  subtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },
});