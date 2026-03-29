import { useEffect, useState } from "react";
import { View, FlatList, Pressable } from "react-native";
import { Card, BodyText, SecondaryText } from "../../../src/components/ThemeProvider/components";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter } from "expo-router";
import { getTransactions } from "../../../src/db/transactionsDb";

export default function SalesList() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [sales, setSales] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getTransactions(db);
      setSales(data.filter((t) => t.type === "income"));
    })();
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <BodyText style={{ fontSize: 18, fontWeight: "700" }}>
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
    </View>
  );
}