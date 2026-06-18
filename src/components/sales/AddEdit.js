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
} from "react-native";
import {
  BodyText,
  Card,
  Input,
  SecondaryText,
} from "../../../src/components/ThemeProvider/components";
import { getCategories } from "../../../src/db/query/categories";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { getProducts } from "../../db/query/inventory";
import {
  createOrUpdateSale,
  getSaleById,
  getSaleItems,
} from "../../db/query/sales";
import CreditDiscountForm from "./CreditDiscountForm";
import EditSaleForm from "./EditSaleForm";

export default function SellPage() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams();
  const isFocused = useIsFocused();
  const router = useRouter();
  const { globalStyles } = useThemeStyles();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
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

  // Fetch products
  useEffect(() => {
    (async () => {
      const data = await getProducts(db);
      setProducts(data);
    })();
  }, [isFocused]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Load sale if editing
  useEffect(() => {
    if (!id) return;
    (async () => {
      const items = await getSaleItems(db, id);
      setCart(items);
    })();
  }, [isFocused]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const t = await getSaleById(db, id);
      console.log(t,"hello sale")
      setDate(new Date(t.date))
      setTitle(t?.title);
      setSale(t)
    })();
  }, [isFocused]);

  // Auto title
  useEffect(() => {
    if (cart.length === 0 || id) return;
    const topItem = [...cart].sort((a, b) => b.quantity - a.quantity)[0];
    setTitle(`${topItem?.name || "Sale"} - ${total}`);
  }, [cart]);

  // Fetch category
  useEffect(() => {
    (async () => {
      const data = await getCategories(db);
      const cat = data.find((c) => c.name === "Product Sales");
      setCategory(cat);
    })();
  }, []);

  const addToCart = (product) => {
    setSale(null)
    setCart((prev) => {
      const exists = prev.find((c) => c.product_id === product.id);
      if (exists) {
        return prev.map((c) =>
          c.product_id === product.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.selling_price,
          quantity: 1,
          item_type:product.item_type
        },
      ];
    });
  };

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

  const handleSave = async (fromCreditDiscount = false,draftForm = null) => {
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
      };

      await createOrUpdateSale(db, saleData);

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

      {/* SEARCH */}
      <Input
        placeholder="Search products..."
        value={search}
        onChangeText={setSearch}
        style={{ marginBottom: 8 }}
      />

      {/* PRODUCTS */}
      <View style={styles.productsContainer}>
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.gridItem}
              onPress={() => addToCart(item)}
            >
              <Card style={styles.productCard}>
                <BodyText>{item.name}</BodyText>
                <SecondaryText>{item.selling_price}</SecondaryText>
              </Card>
            </Pressable>
          )}
        />
      </View>

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
              <Pressable
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

              <View style={styles.qtyRow}>
                <Pressable
                  onPress={() =>
                    updateQuantity(item.product_id, item.quantity - 1)
                  }
                >
                  <BodyText>-</BodyText>
                </Pressable>

                <BodyText>{item.quantity}</BodyText>

                <Pressable
                  onPress={() =>
                    updateQuantity(item.product_id, item.quantity + 1)
                  }
                >
                  <BodyText>+</BodyText>
                </Pressable>
              </View>
            </Card>
          )}
        />
      )}

      <View style={styles.footer}>
        <Pressable
          style={globalStyles.secondaryBtn}
          onPress={() => setPaymentModalVisible(true)}
        >
          <BodyText style={globalStyles.secondaryBtnText}>
            Payments
          </BodyText>
        </Pressable>

        <Pressable
          style={globalStyles.secondaryBtn}
          onPress={() => setCheckoutModalVisible(true)}
        >
          <BodyText style={globalStyles.secondaryBtnText}>
            Credit / Discount
          </BodyText>
        </Pressable>

        <Pressable 
          style={globalStyles.primaryBtn} 
          onPress={() => handleSave()}
        >
          <BodyText style={globalStyles.primaryBtnText}>
            Complete Sale
          </BodyText>
        </Pressable>
      </View>

      <View style={styles.footer}>
        
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
        styles={styles}
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
  productsContainer: {
    flex: 1,
  },
  productCard: {
    padding: 12,
  },
  gridItem: {
    flex: 1,
    marginBottom: 8,
    marginHorizontal: 4,
  },
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
  },
  qtyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    width: 100,
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
  modalContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    padding: 16,
  },
});