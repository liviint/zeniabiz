import { useEffect, useState } from "react";
import { View, FlatList, Pressable } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Card, BodyText, SecondaryText } from "../../../src/components/ThemeProvider/components";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter } from "expo-router";
import { getTransactions } from "../../../src/db/transactionsDb";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { AddButton } from "../../../src/components/common/AddButton";

export default function SalesList() {
    const {globalStyles} = useThemeStyles()
    const isFocused = useIsFocused()
    const db = useSQLiteContext();
    const router = useRouter();

    const [sales, setSales] = useState([]);

    useEffect(() => {
        (async () => {
            const data = await getTransactions(db);
            console.log(data,"hello data")
            setSales(data.filter((t) => t.type === "income"));
        })();
    }, [isFocused]);

    return (
        <View style={globalStyles.container}>
            <BodyText style={globalStyles.title}>
                Sales
            </BodyText>

            <FlatList
                data={sales}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                <Pressable onPress={() => router.push(`/sales/${item.id}`)}>
                    <Card>
                    <BodyText>KES {item.amount}</BodyText>
                    <SecondaryText>{item.date}</SecondaryText>
                    </Card>
                </Pressable>
                )}
            />
            <AddButton 
                primaryAction={{route:"/sales/add",label:"Add a Sale"}}
            />
        </View>
    );
}