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
import { getTransactions } from "../../../src/db/transactionsDb";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { AddButton } from "../../../src/components/common/AddButton";

export default function SalesList() {
  const { globalStyles } = useThemeStyles();
  const isFocused = useIsFocused();
  const db = useSQLiteContext();
  const router = useRouter();

  const [sales, setSales] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getTransactions(db);

      setSales(
        data
          .filter((t) => t.type === "income")
          .sort((a, b) => new Date(b.date) - new Date(a.date)) // 🔥 newest first
      );
    })();
  }, [isFocused]);

  // 🧠 Format date nicely
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
      <BodyText style={globalStyles.title}>Sales</BodyText>

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const fallbackTitle = `Sale - KES ${item.amount}`;

          return (
            <Pressable onPress={() => router.push(`/sales/${item.id}`)}>
              <Card style={{ marginBottom: 10 }}>
                {/* 🔥 TITLE */}
                <BodyText style={{ fontWeight: "600" }}>
                  {item.title || fallbackTitle}
                </BodyText>

                {/* 🔥 META ROW */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <SecondaryText>
                    {formatDate(item.date)}
                  </SecondaryText>

                  <BodyText style={{ fontWeight: "700" }}>
                    KES {item.amount}
                  </BodyText>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />

      <AddButton
        primaryAction={{ route: "/sales/add", label: "Add a Sale" }}
      />
    </View>
  );
}