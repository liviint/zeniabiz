import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import SummaryCards from "../../../src/components/dashboard/SummaryCards"
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { BodyText, SecondaryText } from "../../../src/components/ThemeProvider/components";
import CashflowChart from "../../../src/components/dashboard/CashflowChart";
import ExpenseBreakdown from "../../../src/components/dashboard/ExpenseBreakdown";
import TimeFilters from "../../../src/components/common/TimeFilters"

export default function DashboardScreen() {
    const { globalStyles } = useThemeStyles()
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date());

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
            
            <TimeFilters
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <SummaryCards 
                    selectedMonth={selectedMonth}
                />

                <CashflowChart 
                    selectedMonth={selectedMonth}
                />

                <ExpenseBreakdown 
                    selectedMonth={selectedMonth}
                /> 

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