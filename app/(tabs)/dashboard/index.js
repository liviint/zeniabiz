import { View, ScrollView, RefreshControl } from "react-native";
import { useState } from "react";
import SummaryCards from "../../../src/components/dashboard/SummaryCards"
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { BodyText, SecondaryText } from "../../../src/components/ThemeProvider/components";
import CashflowChart from "../../../src/components/dashboard/CashflowChart";
import ExpenseBreakdown from "../../../src/components/dashboard/ExpenseBreakdown";
import TimeNavigator from "../../../src/components/common/TimeNavigator"
import { createRange } from "../../../src/utils/timeNavigatorHelpers";
import { useManualSync } from "../../../src/hooks/useManualSync";

export default function DashboardScreen() {
    const { globalStyles } = useThemeStyles()
    const { onRefresh, refreshing } = useManualSync();

    const [timeState, setTimeState] = useState(createRange("month"));

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