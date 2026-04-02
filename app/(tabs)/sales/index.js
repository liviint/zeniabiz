import { useEffect, useState } from "react";
import { View, FlatList, Pressable } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import {
  Card,
  BodyText,
  SecondaryText,
} from "../../../src/components/ThemeProvider/components";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter } from "expo-router";
import { getSales } from "../../../src/db/salesDb"; 
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { AddButton } from "../../../src/components/common/AddButton";
import EmptyState from "../../../src/components/common/EmptyState";
import TimeFilters from "../../../src/components/common/TimeFilters";

export default function SalesList() {
  const { globalStyles } = useThemeStyles();
  const isFocused = useIsFocused();
  const db = useSQLiteContext();
  const router = useRouter();

  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    if (!db) return;
    (async () => {
      setIsLoading(true);
      const data = await getSales(db, selectedMonth);
      setSales(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setIsLoading(false);
    })();
  }, [isFocused, selectedMonth]);

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString("en-KE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={globalStyles.container}>
      <BodyText style={globalStyles.title}>My Sales</BodyText>

      <TimeFilters 
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const fallbackTitle = `Sale - KES ${item.amount}`;

          return (
            <Pressable onPress={() => router.push(`/sales/${item.id}`)}>
              <Card style={{ marginBottom: 10 }}>
                <BodyText style={{ fontWeight: "600" }}>
                  {item.title || fallbackTitle}
                </BodyText>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <SecondaryText>{formatDate(item.date)}</SecondaryText>
                  <BodyText style={{ fontWeight: "700" }}>
                    KES {item.amount}
                  </BodyText>
                </View>
              </Card>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState 
            title="No sales yet"
            description="Start by recording your first sale to track your business."
          />
        }
      />

      <AddButton
        primaryAction={{ route: "/sales/add", label: "Add a Sale" }}
      />
    </View>
  );
}