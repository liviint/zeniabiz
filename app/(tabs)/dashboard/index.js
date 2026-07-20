import { View, ScrollView, RefreshControl } from "react-native";
import { useState } from "react";
import { useSelector } from "react-redux";
import SummaryCards from "../../../src/components/dashboard/SummaryCards"
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { BodyText, SecondaryText } from "../../../src/components/ThemeProvider/components";
import CashflowChart from "../../../src/components/dashboard/CashflowChart";
import ExpenseBreakdown from "../../../src/components/dashboard/ExpenseBreakdown";
import TimeNavigator from "../../../src/components/common/TimeNavigator"
import { createRange } from "../../../src/utils/timeNavigatorHelpers";
import { useManualSync } from "../../../src/hooks/useManualSync";
import PaymentMethodsBreakdown from "../../../src/components/dashboard/PaymentMethodsBreakdown";
import { useDeferredEffect } from "../../../src/hooks/useDeferredEffect";
import { getFinancialStats } from "../../../src/db/query/dashboard";
import { useSQLiteContext } from "expo-sqlite";
import { useIsFocused } from "@react-navigation/native";
import PageLoader from "../../../src/components/common/PageLoader"
import OnBoarding from "../../../src/components/onboarding";
import { hasProducts } from "../../../src/db/query/inventory";

export default function DashboardScreen() {
    const db = useSQLiteContext();
    const isFocused = useIsFocused();
    const { globalStyles } = useThemeStyles()
    const lastSyncedAt = useSelector(state => state.sync.lastSyncedAt);
    const { onRefresh, refreshing } = useManualSync();
    const [isLoading,setIsloading] = useState(true)
    const [timeState, setTimeState] = useState(createRange("month"));

    const [stats, setStats] = useState({
        revenue: 0,
        expenses: 0,
        cashCollected:0,
        outstandingCredit:0,
        cost: 0,
        grossProfit: 0,
        netProfit: 0,
        stockValue: 0,
        hasProducts:0,
    });

    useDeferredEffect(async (isMounted) => {
        const summary = await getFinancialStats(db, timeState);
    
        if (isMounted()) {
            if(summary.revenue === 0 && summary.expenses === 0){
                let areProductsAvailable = await hasProducts(db)
                setStats(prev => ({...summary,hasProducts:areProductsAvailable}))
            }
            else setStats(summary);
        }
        setIsloading(false)
    }, [db, isFocused, timeState, lastSyncedAt],{enabled: isFocused,});

    const isNewBusiness =  stats.revenue === 0 && stats.expenses === 0 && !stats.hasProducts;
    
    if(isLoading) return <PageLoader message={"Loading..."} />
    if(isNewBusiness) return <OnBoarding type="add_product" />

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
                    stats={stats}
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