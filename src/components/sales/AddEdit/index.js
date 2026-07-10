import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
  InteractionManager,
} from "react-native";
import {
  BodyText,
} from "../../../../src/components/ThemeProvider/components";
import { getCategories } from "../../../../src/db/query/categories";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import {
  createOrUpdateSale,
  getSaleById,
  getSaleItems,
} from "../../../db/query/sales";
import CreditDiscountForm from "../CreditDiscountForm";
import { AnalyticsService } from "../../../utils/analyticsService";
import ProductsList from "./Products";
import Cart from "./Cart";


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
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);

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

        <Cart 
          cart={cart}
          setCart={setCart}
          id={id}
          date={date}
          setDate={setDate}
        />

      <View style={styles.footer}>

        <Pressable
          style={globalStyles.primaryBtn} 
          onPress={() => setCheckoutModalVisible(true)}
        >
          <BodyText style={globalStyles.primaryBtnText}>
            Checkout
          </BodyText>
        </Pressable>

      </View>

      <CreditDiscountForm 
        markedPrice={markedPrice}
        handleSave={handleSave}
        checkoutModalVisible={checkoutModalVisible}
        setCheckoutModalVisible={setCheckoutModalVisible}
        paymentsForm={paymentsForm}
        setPaymentsForm={setPaymentsForm}
      />

    </View>
  );
}

const styles = StyleSheet.create({
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