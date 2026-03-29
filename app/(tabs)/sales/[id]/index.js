import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { BodyText, Card, SecondaryText } from "../../../../src/components/ThemeProvider/components";
import { getTransactionById } from "../../../../src/db/transactionsDb";
import { getTransactionItems } from "../../../../src/db/salesDb";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";

export default function SaleDetails() {
  const {globalStyles} = useThemeStyles()
  const isFocused = useIsFocused()
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
  }, [isFocused]);

  return (
    <View style={globalStyles.container}>
      <BodyText style={globalStyles.title}>
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