import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { View, TouchableOpacity, Text } from "react-native";
import { useLocalSearchParams , useRouter} from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { BodyText, Card, SecondaryText } from "../../../../src/components/ThemeProvider/components";
import { getSaleById, getSaleItems, deleteSale } from "../../../../src/db/salesDb";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import DeleteButton from "../../../../src/components/common/DeleteButton";
import { dateFormat } from "../../../../src/utils/dateFormat";

export default function SaleDetails() {
  const { globalStyles } = useThemeStyles();
  const isFocused = useIsFocused();
  const db = useSQLiteContext();
  const router = useRouter();
  const { id: sale_id } = useLocalSearchParams();

  const [sale, setSale] = useState({});
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!sale_id) return;

    (async () => {
      const s = await getSaleById(db, sale_id);
      setSale(s);

      // Load sale items
      const i = await getSaleItems(db, sale_id);
      setItems(i);
    })();
  }, [sale_id, isFocused]);

  const handleDelete = async () => {
    await deleteSale(db, sale_id);
    router.back();
  };

  return (
    <View style={globalStyles.container}>
      <BodyText style={globalStyles.title}>
        Sale Details
      </BodyText>

      <Card>
        <BodyText>Total: {sale?.amount}</BodyText>
        <SecondaryText>{dateFormat(sale?.date)}</SecondaryText>
      </Card>

      {items.map((item) => (
        <Card key={item.id}>
          <BodyText>{item.name}</BodyText>
          <SecondaryText>
            {item.quantity} x {item.price}
          </SecondaryText>
        </Card>
      ))}

      <View style={{ gap: 12, marginTop: 20 }}>
        <TouchableOpacity
          onPress={() => router.push(`/sales/${sale_id}/edit`)}
          style={globalStyles.editBtn}
        >
          <Text style={globalStyles.editBtnText}>
            Edit
          </Text>
        </TouchableOpacity>

        <DeleteButton 
          handleOk={handleDelete}
          item="sale"
        />
      </View>
    </View>
  );
}