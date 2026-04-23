import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import SummaryCards from "../../../src/components/dashboard/SummaryCards"
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { BodyText, SecondaryText } from "../../../src/components/ThemeProvider/components";
import CashflowChart from "../../../src/components/dashboard/CashflowChart";
import ExpenseBreakdown from "../../../src/components/dashboard/ExpenseBreakdown";
import TimeNavigator from "../../../src/components/common/TimeNavigator"
import { createRange } from "../../../src/utils/timeNavigatorHelpers";

export default function DashboardScreen() {
    const { globalStyles } = useThemeStyles()
    const [refreshing, setRefreshing] = useState(false);

    const [timeState, setTimeState] = useState(createRange("day"));

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
            
            <TimeNavigator
                state={timeState}
                onChange={setTimeState}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <SummaryCards 
                    timeState={timeState}
                />

                <CashflowChart 
                    timeState={timeState}
                />

                <ExpenseBreakdown 
                    timeState={timeState}
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