import { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, use } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { BodyText, Card, SecondaryText } from "../../../../src/components/ThemeProvider/components";
import { getTransactionById } from "../../../../src/db/transactionsDb";
import { getTransactionItems } from "../../../../src/db/inventoryDb";

export default function SaleDetails() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams();

  const [sale, setSale] = useState({});
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const s = await getTransactionById(db, id);
      const i = await getTransactionItems(db, id);

      setSale(s);
      setItems(i);
    })();
  }, []);

  return (
    <View style={{ padding: 16 }}>
      <BodyText style={{ fontSize: 18, fontWeight: "700" }}>
        Sale Details
      </BodyText>

      <Card>
        <BodyText>Total: KES {sale.amount}</BodyText>
        <SecondaryText>{sale.date}</SecondaryText>
      </Card>

      {items.map((item) => (
        <Card key={item.id}>
          <BodyText>{item.name}</BodyText>
          <SecondaryText>
            {item.quantity} x KES {item.price}
          </SecondaryText>
        </Card>
      ))}
    </View>
  );
}