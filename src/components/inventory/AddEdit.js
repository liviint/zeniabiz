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
import { upsertProductAndRestocking , getProductById} from "../../db/query/inventory";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import DateTimePicker from "@react-native-community/datetimepicker";
import BarcodeScanner from "../../../src/components/barcodeScanner";
import { AnalyticsService } from "../../utils/analyticsService";

export default function AddProduct({isProduct=true}) {
  const {id} = useLocalSearchParams()
  const db = useSQLiteContext();
  const router = useRouter();
  const { globalStyles } = useThemeStyles();

  const [form, setForm] = useState({
    name: "",
    barcode:"",
    cost_price: "",
    selling_price: "",
    stock_quantity: "",
    minimum_quantity:"",
    created_at:"",
    expiry_date:null,
    batch_number:"",
    unit:"",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [scannerVisible, setScannerVisible] = useState(false);

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
  if (!form.name?.trim()) {
    return Alert.alert("Validation Error", "Product name is required.");
  }

  const costPrice = Number(form.cost_price);
  const sellingPrice = Number(form.selling_price);
  const stockQuantity = Number(form.stock_quantity);
  const minimumQuantity = Number(form.minimum_quantity);

  if (isNaN(costPrice) || costPrice < 0) {
    return Alert.alert(
      "Validation Error",
      "Enter a valid cost price."
    );
  }

  if (isNaN(sellingPrice) || sellingPrice <= 0) {
    return Alert.alert(
      "Validation Error",
      "Enter a valid selling price."
    );
  }

  if (sellingPrice <= costPrice) {
    return Alert.alert(
      "Validation Error",
      "Selling price should be higher than cost price."
    );
  }

  if (isNaN(stockQuantity) || stockQuantity < 0) {
    return Alert.alert(
      "Validation Error",
      "Stock quantity cannot be negative."
    );
  }

  if (isNaN(minimumQuantity) || minimumQuantity < 0) {
    return Alert.alert(
      "Validation Error",
      "Minimum quantity cannot be negative."
    );
  }

  try {
    await upsertProductAndRestocking(db, {
      ...form,
      cost_price: costPrice,
      selling_price: sellingPrice,
      stock_quantity: stockQuantity,
      minimum_quantity: minimumQuantity,
      item_type:isProduct ? 'product' : 'service'
    });

    await AnalyticsService.logFirstEvent('first_product_added');

    router.push("/inventory");
  } catch (error) {
    if (error?.message?.includes("UNIQUE constraint")) {
      Alert.alert(
        "Barcode Exists",
        "Another product already uses this barcode."
      );
      return;
    }
    Alert.alert(
      "Error",
      "Failed to save item. Please try again."
    );
  }
};

  const isEditing = Boolean(id);

  const showInventoryFields =
    isProduct && !isEditing;

  const handleBarcodeScanning =() => {
    
  }

  useEffect(() => {
    if (!isEditing) return;
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
          {isEditing ? "Update" : "Add"} {isProduct ? "Product" : "Service"}
        </BodyText>
        <Card>
        <View style={globalStyles.formGroup}>
          <FormLabel>Name</FormLabel>
          <Input 
            value={form.name} 
            onChangeText={(v) => handleChange("name", v)} 
          />
        </View>

      {
        isProduct &&
          <View style={globalStyles.formGroup}>
            <FormLabel>Barcode</FormLabel>

            <View
              style={{
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
              }}
            >
              <Input
                style={{ flex: 1 }}
                value={form.barcode}
                onChangeText={(v) =>
                  handleChange("barcode", v)
                }
                placeholder="Scan or enter barcode"
              />

              <TouchableOpacity
                style={globalStyles.primaryBtn}
                onPress={() => setScannerVisible(true)}
              >
                <Text style={globalStyles.primaryBtnText}>
                  Scan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }

        {
            showInventoryFields &&
            <View style={globalStyles.formGroup}>
              <FormLabel>Cost Price</FormLabel>
            < Input 
              value={String(form.cost_price)} 
              keyboardType="numeric" onChangeText={(v) => handleChange("cost_price", v)} 
            />
          </View>
        }

        <View style={globalStyles.formGroup}>
          <FormLabel>Selling Price</FormLabel>
          <Input 
            value={String(form.selling_price)} 
            keyboardType="numeric" onChangeText={(v) => handleChange("selling_price", v)} 
          />
        </View>

        {
          showInventoryFields &&
          <View style={globalStyles.formGroup}>
            <FormLabel>Stock Quantity</FormLabel>
            <Input 
              value={String(form.stock_quantity)} 
              keyboardType="numeric" onChangeText={(v) => handleChange("stock_quantity", v)} 
            />
          </View>
        }

        {
          showInventoryFields &&
          <View style={globalStyles.formGroup}>
            <FormLabel>Minimum Quantity</FormLabel>
            <Input 
              value={String(form.minimum_quantity)} 
              keyboardType="numeric" 
              onChangeText={(v) => handleChange("minimum_quantity", v)} 
            />
          </View>
        }

        {
          showInventoryFields &&
          <View style={globalStyles.formGroup}>
            <FormLabel>Batch Number</FormLabel>
            <Input 
              value={form.batch_number} 
              onChangeText={(v) => handleChange("batch_number", v)} 
            />
          </View>
        }

        {
          !showInventoryFields && !isProduct &&
          <View style={globalStyles.formGroup}>
            <FormLabel>Service Unit</FormLabel>
            <Input 
              value={String(form.unit)} 
              onChangeText={(v) => handleChange("unit", v)} 
            />
          </View>
        }

        {showInventoryFields && 
        <View style={globalStyles.formGroup}>
          <FormLabel>Expiry Date</FormLabel>
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

        </View>}

        {isEditing && showInventoryFields && (
          <SecondaryText style={{marginTop:5, marginBottom:10,fontSize:14}}>
            Stock and cost are managed through restocking.
          </SecondaryText>
        )}

        <TouchableOpacity style={globalStyles.primaryBtn} onPress={handleSave}>
          <Text style={globalStyles.primaryBtnText}>
            {isEditing ? "Update" : "Save"}  {isProduct ? "Product" : "Service"}
          </Text>
        </TouchableOpacity>

        </Card>

        <BarcodeScanner
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onScan={(barcode) => {
            handleChange("barcode", barcode);
          }}
        />

    </KeyboardAwareScrollView>
  );
}