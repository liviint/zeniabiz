import { View, ScrollView, RefreshControl } from "react-native";
import { useState } from "react";
import { useIsFocused} from "@react-navigation/native";
import SummaryCards from "../../../src/components/dashboard/SummaryCards"
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { BodyText, SecondaryText } from "../../../src/components/ThemeProvider/components";
import CashflowChart from "../../../src/components/dashboard/CashflowChart";
import ExpenseBreakdown from "../../../src/components/dashboard/ExpenseBreakdown";
import TimeNavigator from "../../../src/components/common/TimeNavigator"
import { createRange } from "../../../src/utils/timeNavigatorHelpers";
import { useManualSync } from "../../../src/hooks/useManualSync";
import PaymentMethodsBreakdown from "../../../src/components/dashboard/PaymentMethodsBreakdown";
import OnBoarding from "../../../src/components/onboarding";
import { useDeferredEffect } from "../../../src/hooks/useDeferredEffect";
import { useSQLiteContext } from "expo-sqlite";
import { getSetting } from "../../../src/db/query/settings";

export default function DashboardScreen() {
    const isFocused = useIsFocused();
    const db = useSQLiteContext();
    const { globalStyles } = useThemeStyles()
    const { onRefresh, refreshing } = useManualSync();
    const [timeState, setTimeState] = useState(createRange("month"));
    const [onboardingCompleted, setOnboardingCompleted] = useState(true);

    useDeferredEffect(async (isMounted) => {
        const completed = await getSetting(db, "onboarding_completion_acknowledged");

        if (!isMounted()) return;

        setOnboardingCompleted(Boolean(completed));
    }, [db, isFocused], {
        enabled: isFocused,
    });

    return (
        <View style={globalStyles.container}>
            <BodyText style={globalStyles.title}>Dashboard</BodyText>
            <SecondaryText style={globalStyles.subTitle}>Track your business performance</SecondaryText>

            {!onboardingCompleted &&  
                <OnBoarding />
            }
            
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

                <ExpenseBreakdown 
                    timeState={timeState}
                /> 

                <PaymentMethodsBreakdown 
                    timeState={timeState}
                />

                <CashflowChart 
                    timeState={timeState}
                />

                <View style={{ height: 24 }} />
            </ScrollView>
        </View>
    );
}