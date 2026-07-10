import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  InteractionManager,
} from "react-native";
import {
  BodyText,
  Card,
  SecondaryText,
  Input
} from "../../../../src/components/ThemeProvider/components";
import { getCategories } from "../../../../src/db/query/categories";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import {
  createOrUpdateSale,
  getSaleById,
  getSaleItems,
} from "../../../db/query/sales";
import CreditDiscountForm from "../CreditDiscountForm";
import EditSaleForm from "../EditSaleForm";
import { AnalyticsService } from "../../../utils/analyticsService";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ProductsList from "./Products";


export default function SellPage() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams();
  const isFocused = useIsFocused();
  const router = useRouter();
  const { globalStyles } = useThemeStyles();

  const [cart, setCart] = useState([]);
  const [title, setTitle] = useState("");
  const [sale,setSale] = useState(null)

  const [date,setDate] = useState(new Date())

  const [category, setCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editSaleModalVisible, setEditSaleModalVisible] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const [cartExpanded, setCartExpanded] = useState(true);

  const [paymentsForm,setPaymentsForm] = useState({
    amountPaid:0,
    paymentMethod:"",
    discount:"",
    customer_id:null,
    payments:[],
  })

  // Auto title
  useEffect(() => {
    if (cart.length === 0 || id) return;
    const topItem = [...cart].sort((a, b) => b.quantity - a.quantity)[0];
    setTitle(`${topItem?.name || "Sale"} - ${total}`);
  }, [cart]);


  useEffect(() => {
    let isMounted = true;
    const fetchCategoryMetadata = async () => {
      try {
        const data = await getCategories(db);
        const cat = data?.find((c) => c.name === "Product Sales");
        if (isMounted && cat) {
          setCategory(cat);
        }
      } catch (error) {
        console.error("Failed to fetch category:", error);
      }
    };
    fetchCategoryMetadata();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!isFocused) return;

    let isMounted = true;
    
    const hydrateScreenData = async () => {
      try {
        if (!isMounted) return;

        // If editing an existing sale, fetch everything in parallel to protect thread execution
        if (id) {
          const [saleItems, saleDetails] = await Promise.all([
            getSaleItems(db, id),
            getSaleById(db, id)
          ]);

          if (!isMounted) return;

          if (saleItems) setCart(saleItems);
          if (saleDetails) {
            setSale(saleDetails);
            setTitle(saleDetails.title || "");
            setDate(saleDetails.date ? new Date(saleDetails.date) : new Date());
          }
        }
      } catch (error) {
        console.error("Failed to load screen data securely:", error);
      }
    };

    // Stagger execution until native slide transition animations finish completely
    const task = InteractionManager.runAfterInteractions(() => {
      hydrateScreenData();
    });

    return () => {
      isMounted = false;
      task.cancel();
    };
  }, [isFocused, id]);

  useEffect(() => {
    setPaymentsForm(prev => ({
      ...prev,
      amountPaid: markedPrice,
    }));
  }, [cart]);

  useEffect(() => {
    if (sale) {
      setPaymentsForm({
        amountPaid: sale.amount_paid ?? 0,
        discount: sale.discount ?? 0,
        customer_id: sale.customer_id ?? null,
      });
    } 
  }, [sale]);

  const updateQuantity = (product_id, quantity) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((c) => c.product_id !== product_id));
      return;
    }

    setCart((prev) =>
      prev.map((c) =>
        c.product_id === product_id ? { ...c, quantity } : c
      )
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,0);

  const markedPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,0);

  const handleSave = async (
    fromCreditDiscount = false,
    draftForm = null,
     paymentMethods = []
  ) => {
    const form = draftForm || paymentsForm;
    if (!fromCreditDiscount && (sale?.balance_due ?? 0) > 0) {
      return Alert.alert(
        "Unpaid Balance",
        `This sale has a credit of ${sale.balance_due}. Please handle it using Credit/Discount button.`
      );
    }
    try {
      if (cart.length === 0) {
        return Alert.alert("Add items first");
      }

      const discountedPrice = Math.max(
        markedPrice - (form.discount || 0),
        0
      );

      const totalAmount = Math.max(
        discountedPrice,
        form.amountPaid || 0
      );

      const credit = Math.max(
        totalAmount - (form.amountPaid || 0),
        0
      );

      const saleData = {
        items: cart,
        sale_id: id,

        title,
        category: category?.name,
        category_id: category?.id || null,

        date,

        markedPrice:markedPrice,
        customer_id: form.customer_id,
        discount: form.discount || 0,
        total_amount: totalAmount,
        amount_paid:  form.amountPaid || 0,
        balance_due: credit,
        payment_status:
          credit === 0 ? "PAID" : form.amountPaid > 0 ? "PARTIAL" : "UNPAID",
        payments: paymentMethods,
      };

      await createOrUpdateSale(db, saleData);
      await AnalyticsService.logFirstEvent('first_sale_added');
      Alert.alert("Success", "Sale recorded");

      router.push("/sales");
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Error",
        error?.message || "Failed to save sale"
      );
    }
  };

  return (
    <View style={globalStyles.container}>
      <BodyText style={globalStyles.title}>
        {id ? "Update" : "Record"} Sale
      </BodyText>

        <ProductsList 
          setSale={setSale}
          setCart={setCart}
        />

      {/* CART HEADER */}
      <Pressable
        style={styles.cartHeader}
        onPress={() => setCartExpanded((prev) => !prev)}
      >
        <BodyText style={{ fontWeight: "600" }}>
          Cart ({cart.length}) {cartExpanded ? "▼" : "▲"}
        </BodyText>
        <BodyText>Total: {markedPrice.toFixed(2)}</BodyText>
      </Pressable>

      {/* CART LIST */}
      {cartExpanded && (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.product_id}
          style={styles.cartList}
          renderItem={({ item }) => (
            <Card style={styles.cartItem}>
  <View style={styles.cartTop}>
    <Pressable
      style={styles.cartInfo}
      onPress={() => {
        setSelectedItem(item);
        setEditSaleModalVisible(true);
      }}
    >
      <BodyText>{item.name}</BodyText>
      <SecondaryText>
        {item.price} x {item.quantity} ={" "}
        {(item.price * item.quantity).toFixed(2)}
      </SecondaryText>
    </Pressable>

    <Pressable
      style={styles.editButton}
      onPress={() => {
        setSelectedItem(item);
        setEditSaleModalVisible(true);
      }}
    >
      <MaterialIcons name="edit" size={22} color="#666" />
    </Pressable>
  </View>

  <View style={styles.qtyRow}>
    <Pressable
      style={styles.qtyButton}
      onPress={() =>
        updateQuantity(item.product_id, item.quantity - 1)
      }
    >
      <BodyText style={styles.qtyButtonText}>−</BodyText>
    </Pressable>

    <Input
      value={String(item.quantity)}
      keyboardType="numeric"
      style={styles.qtyInput}
      onChangeText={(text) => {
        const qty = parseInt(text, 10);
        updateQuantity(item.product_id, isNaN(qty) ? 0 : qty);
      }}
    />

    <Pressable
      style={styles.qtyButton}
      onPress={() =>
        updateQuantity(item.product_id, item.quantity + 1)
      }
    >
      <BodyText style={styles.qtyButtonText}>+</BodyText>
    </Pressable>
  </View>
</Card>
          )}
        />
      )}

      <View style={styles.footer}>

        <Pressable
          style={globalStyles.primaryBtn} 
          onPress={() => setCheckoutModalVisible(true)}
        >
          <BodyText style={globalStyles.primaryBtnText}>
            Checkout
          </BodyText>
        </Pressable>

        {/* <Pressable 
          style={globalStyles.primaryBtn} 
          onPress={() => handleSave()}
        >
          <BodyText style={globalStyles.primaryBtnText}>
            Complete Sale
          </BodyText>
        </Pressable> */}
      </View>

      <EditSaleForm 
        styles={styles}
        modalVisible={editSaleModalVisible}
        setModalVisible={setEditSaleModalVisible}
        setCart={setCart}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        date={date}
        setDate={setDate}
      />

      <CreditDiscountForm 
        markedPrice={markedPrice}
        handleSave={handleSave}
        checkoutModalVisible={checkoutModalVisible}
        setCheckoutModalVisible={setCheckoutModalVisible}
        paymentsForm={paymentsForm}
        setPaymentsForm={setPaymentsForm}
        setPaymentModalVisible={setPaymentModalVisible}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  cartList: {
    maxHeight: 200,
  },
  cartItem: {
  marginBottom: 8,
  padding: 12,
},

cartTop: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
},

cartInfo: {
  flex: 1,
},

editButton: {
  padding: 6,
  marginLeft: 8,
},

qtyRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 12,
  width: 140,
},

qtyButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#f2f2f2",
},

qtyButtonText: {
  fontSize: 22,
  fontWeight: "600",
},
  footer: {
    marginTop: 8,
    display:"flex",
    width:"100%",
    flexDirection:"row",
    justifyContent:"flex-end",
    gap:8,
    flexWrap:"wrap",
  },
});