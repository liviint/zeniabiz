import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { View, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { Card, BodyText, SecondaryText, Input } from "../../../src/components/ThemeProvider/components";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getProducts } from "../../../src/db/inventoryDb";
import { createOrUpdateSale, getTransactionItems } from "../../../src/db/salesDb";
import { getTransactionById } from "../../../src/db/transactionsDb";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";

export default function SellPage() {
  const db = useSQLiteContext();
  const {id} = useLocalSearchParams()
  const isFocused = useIsFocused()
  const router = useRouter();
  const { globalStyles } = useThemeStyles();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    (async () => {
      const data = await getProducts(db);
      setProducts(data);
    })();
  }, [isFocused]);

  useEffect(() => {
      if(!id) return
      (async () => {
        const i = await getTransactionItems(db, id);
        setCart(i);
      })();
    }, [isFocused]);

    useEffect(() => {
      if(cart.length === 0) return
      (async () => {
        const t = await getTransactionById(db, id);
        setTitle(t?.title)
      })();
    }, [isFocused,cart]);

    useEffect(() => {
      if (cart.length === 0 || id) return;

      const topItem = cart.sort((a, b) => b.quantity - a.quantity)[0];

      const finalTitle = `${topItem?.name || "Sale"} - KES ${total}`;

      setTitle(finalTitle);
    }, [cart]);
  

  const addToCart = (product) => {
    const exists = cart.find((c) => c.product_id === product.id);

    if (exists) {
      setCart((prev) =>
        prev.map((c) =>
          c.product_id === product.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.selling_price,
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (product_id, value) => {
    const qty = parseFloat(value) || 0;

    setCart((prev) =>
      prev.map((c) =>
        c.product_id === product_id ? { ...c, quantity: qty } : c
      )
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleSave = async () => {
    if (cart.length === 0) return Alert.alert("Add items first");

    await createOrUpdateSale(db, { items: cart ,transaction_id:id, title,});

    Alert.alert("Success", "Sale recorded");
    router.back();
  };

  return (
    <View style={globalStyles.container}>
        <BodyText style={globalStyles.title}>
            {id ? "Update" : "Record"} Sale
        </BodyText>

      <BodyText style={styles.sectionTitle}>Products</BodyText>
      <FlatList
        horizontal
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => addToCart(item)}>
            <Card style={styles.productCard}>
              <BodyText>{item?.name}</BodyText>
              <SecondaryText>KES {item.selling_price}</SecondaryText>
            </Card>
          </Pressable>
        )}
      />

      <BodyText style={styles.sectionTitle}>Title</BodyText>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="Enter sale title"
        />
      <BodyText style={styles.sectionTitle}>Cart</BodyText>

      {cart.map((item) => (
        <Card key={item.product_id} style={styles.cartItem}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <BodyText>{item?.name}</BodyText>
              <SecondaryText>KES {item.price}</SecondaryText>
            </View>

            <Input
              style={styles.qtyInput}
              keyboardType="numeric"
              value={String(item.quantity)}
              onChangeText={(v) => updateQuantity(item.product_id, v)}
            />
          </View>
        </Card>
      ))}

      {/* TOTAL */}
      <Card style={styles.totalCard}>
        <BodyText>Total</BodyText>
        <BodyText style={styles.total}>KES {total}</BodyText>
      </Card>

      {/* SAVE */}
      <Pressable style={globalStyles.primaryBtn} onPress={handleSave}>
        <BodyText style={globalStyles.primaryBtnText}>
            {id ? "Update Sale" : "Save Sale"}
        </BodyText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  productCard: {
    marginRight: 8,
    padding: 12,
  },
  cartItem: {
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyInput: {
    width: 60,
    textAlign: "center",
  },
  totalCard: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  total: {
    fontWeight: "700",
    fontSize: 18,
  },
});