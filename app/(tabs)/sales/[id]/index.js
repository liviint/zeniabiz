import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { View, TouchableOpacity, Text } from "react-native";
import { useLocalSearchParams , useRouter} from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { BodyText, Card, SecondaryText } from "../../../../src/components/ThemeProvider/components";
import { getTransactionById } from "../../../../src/db/transactionsDb";
import { getTransactionItems } from "../../../../src/db/salesDb";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import DeleteButton from "../../../../src/components/common/DeleteButton";


export default function SaleDetails() {
  const {globalStyles} = useThemeStyles()
  const isFocused = useIsFocused()
  const db = useSQLiteContext();
  const router = useRouter()
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

  const handleDelete = () => {
    
  }

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

      <View style={{ gap: 12 }}>
                  
                  <TouchableOpacity
                      onPress={() => router.push(`/sales/${id}/edit`)}
                      style={globalStyles.editBtn}
                  >
                    <Text style={globalStyles.editBtnText}>
                        Edit
                    </Text>
                  </TouchableOpacity>
      
                  <DeleteButton 
                      handleOk={handleDelete}
                      item={"category"}
                  />
              </View>
    </View>
  );
}