import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { BodyText, Card, FormLabel, Input } from "../../../src/components/ThemeProvider/components";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { upsertProduct } from "../../db/inventoryDb";

export default function AddProduct() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { globalStyles } = useThemeStyles();

  const [form, setForm] = useState({
    name: "",
    cost_price: "",
    selling_price: "",
    stock_quantity: "",
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.name) return Alert.alert("Name required");

    await upsertProduct(db, {
      ...form,
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      stock_quantity: Number(form.stock_quantity),
    });

    router.push("/inventory");
  };

  return (
    <ScrollView style={globalStyles.container}>
      <BodyText style={globalStyles.title}>Add Product</BodyText>

      <Card>
        <FormLabel>Name</FormLabel>
        <Input value={form.name} onChangeText={(v) => handleChange("name", v)} />

        <FormLabel>Cost Price</FormLabel>
        <Input keyboardType="numeric" onChangeText={(v) => handleChange("cost_price", v)} />

        <FormLabel>Selling Price</FormLabel>
        <Input keyboardType="numeric" onChangeText={(v) => handleChange("selling_price", v)} />

        <FormLabel>Stock Quantity</FormLabel>
        <Input keyboardType="numeric" onChangeText={(v) => handleChange("stock_quantity", v)} />

        <View style={{ marginTop: 20 }}>
          <BodyText style={globalStyles.primaryBtnText} onPress={handleSave}>
            Save Product
          </BodyText>
        </View>
      </Card>
    </ScrollView>
  );
}