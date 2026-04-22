import { useRouter, useLocalSearchParams  } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState , useEffect} from "react";
import { Alert, ScrollView, TouchableOpacity, Text, View} from "react-native";
import { BodyText, Card, FormLabel, Input , SecondaryText} from "../../../src/components/ThemeProvider/components";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { upsertProduct , getProductById} from "../../db/inventoryDb";

export default function AddProduct() {
  const {id} = useLocalSearchParams()
  const db = useSQLiteContext();
  const router = useRouter();
  const { globalStyles } = useThemeStyles();

  const [form, setForm] = useState({
    name: "",
    cost_price: "",
    selling_price: "",
    stock_quantity: "",
    created_at:"",
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.name) return Alert.alert("Name required");

    await upsertProduct(db, {
      ...form,
      cost_price: form.cost_price,
      selling_price: form.selling_price,
      stock_quantity: form.stock_quantity,
    });

    router.push("/inventory");
  };

   useEffect(() => {
      if (!id) return;
      (async () => {
        const data = await getProductById(db, id);
        console.log(data,"hello data")
        setForm(data)
      })();
    }, []);

  return (
    <ScrollView style={globalStyles.container}>
      <BodyText style={globalStyles.title}>Add Product</BodyText>

      <Card>
      <View style={globalStyles.formGroup}>
        <FormLabel>Name</FormLabel>
        <Input value={form.name} onChangeText={(v) => handleChange("name", v)} />
      </View>

        {
            id ? "" 
            :
            <View style={globalStyles.formGroup}>
              <FormLabel>Cost Price</FormLabel>
            < Input value={String(form.cost_price)} keyboardType="numeric" onChangeText={(v) => handleChange("cost_price", v)} />
          </View>
        }

        <View style={globalStyles.formGroup}>
          <FormLabel>Selling Price</FormLabel>
          <Input value={String(form.selling_price)} keyboardType="numeric" onChangeText={(v) => handleChange("selling_price", v)} />
        </View>

        {
          id ? "" 
          :
          <View style={globalStyles.formGroup}>
            <FormLabel>Stock Quantity</FormLabel>
            <Input value={String(form.stock_quantity)} keyboardType="numeric" onChangeText={(v) => handleChange("stock_quantity", v)} />
          </View>
        }
        {id && (
          <SecondaryText style={{marginTop:5, marginBottom:10,fontSize:14}}>
            Stock and cost are managed through restocking.
          </SecondaryText>
        )}

        <TouchableOpacity style={globalStyles.primaryBtn} onPress={handleSave}>
          <Text style={globalStyles.primaryBtnText}>
            {id ? "Update Product" : "Save Product"}
          </Text>
        </TouchableOpacity>

      </Card>
    </ScrollView>
  );
}