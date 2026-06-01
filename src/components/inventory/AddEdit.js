import { useRouter, useLocalSearchParams  } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState , useEffect} from "react";
import { 
  Alert, 
  TouchableOpacity, 
  Text, 
  View,
} from "react-native";
import { BodyText, Card, FormLabel, Input , SecondaryText} from "../../../src/components/ThemeProvider/components";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { upsertProduct , getProductById} from "../../db/inventoryDb";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import DateTimePicker from "@react-native-community/datetimepicker";

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
    minimum_quantity:"",
    created_at:"",
    expiry_date:null,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const updated = new Date();
      updated.setFullYear(selectedDate.getFullYear());
      updated.setMonth(selectedDate.getMonth());
      updated.setDate(selectedDate.getDate());
      setForm(prev => ({...prev,expiry_date:updated}))
    }
  };

  const handleSave = async () => {
    if (!form.name) return Alert.alert("Name required");
    try {
        await upsertProduct(db, { ...form })
    } catch (error) {
      console.log(error,"hello restock error")
    }
    router.push("/inventory");
  };

   useEffect(() => {
      if (!id) return;
      (async () => {
        const data = await getProductById(db, id);
        setForm(data)
      })();
    }, []);

  return (
    <KeyboardAwareScrollView
      style={globalStyles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      enableOnAndroid
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
        <BodyText style={globalStyles.title}>
          {id ? "Update" : "Add"} Product
        </BodyText>
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
            <Input 
              value={String(form.stock_quantity)} 
              keyboardType="numeric" onChangeText={(v) => handleChange("stock_quantity", v)} 
            />
          </View>
        }

        <View style={globalStyles.formGroup}>
          <FormLabel>Minimum Quantity</FormLabel>
          <Input 
            value={String(form.minimum_quantity)} 
            keyboardType="numeric" 
            onChangeText={(v) => handleChange("minimum_quantity", v)} 
          />
        </View>

        <View style={globalStyles.formGroup}>
          <FormLabel>Sell By Date</FormLabel>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 4,
                alignItems: "center",
                ...globalStyles.formBorder
              }}
            >
              <BodyText>
                {form?.expiry_date
                  ? new Date(form.expiry_date).toDateString()
                  : "Select date"}
              </BodyText>
            </TouchableOpacity>

            
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={form.expiry_date || new Date()}
              mode="date"
              display="calendar"
              onChange={handleDateChange}
            />
          )}

        </View>

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
    </KeyboardAwareScrollView>
  );
}