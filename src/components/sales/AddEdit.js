import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Modal,
} from "react-native";
import {
  Card,
  BodyText,
  SecondaryText,
  Input,
} from "../../../src/components/ThemeProvider/components";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getProducts } from "../../../src/db/inventoryDb";
import {
  createOrUpdateSale,
  getSaleItems,
  getSaleById,
} from "../../../src/db/salesDb";
import { getCategories } from "../../../src/db/categoriesDb";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";

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
  const [category, setCategory] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [cartExpanded, setCartExpanded] = useState(true);

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
      setTitle(t?.title);
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

  const updateItem = (updatedItem) => {
    setCart((prev) =>
      prev.map((c) =>
        c.product_id === updatedItem.product_id ? updatedItem : c
      )
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleSave = async () => {
    if (cart.length === 0) return Alert.alert("Add items first");

    await createOrUpdateSale(db, {
      items: cart,
      sale_id: id,
      title,
      category: category?.name,
      category_id: category?.id || null,
    });

    Alert.alert("Success", "Sale recorded");
    router.push("/sales");
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
        <BodyText>Total: {total.toFixed(2)}</BodyText>
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
                  setModalVisible(true);
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

      {/* FOOTER */}
      <View style={styles.footer}>
        <Pressable style={globalStyles.primaryBtn} onPress={handleSave}>
          <BodyText style={globalStyles.primaryBtnText}>
            Complete Sale
          </BodyText>
        </Pressable>
      </View>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <Card style={styles.modalCard}>
            <BodyText>Edit Item</BodyText>

            <SecondaryText>Price</SecondaryText>
            <Input
              keyboardType="numeric"
              value={String(selectedItem?.price || "")}
              onChangeText={(v) =>
                setSelectedItem({
                  ...selectedItem,
                  price: parseFloat(v) || 0,
                })
              }
            />

            <SecondaryText>Quantity</SecondaryText>
            <Input
              keyboardType="numeric"
              value={String(selectedItem?.quantity || "")}
              onChangeText={(v) =>
                setSelectedItem({
                  ...selectedItem,
                  quantity: parseFloat(v) || 0,
                })
              }
            />

            <Pressable
              style={globalStyles.primaryBtn}
              onPress={() => {
                updateItem(selectedItem);
                setModalVisible(false);
              }}
            >
              <BodyText style={globalStyles.primaryBtnText}>
                Save
              </BodyText>
            </Pressable>

            <Pressable onPress={() => setModalVisible(false)}>
              <BodyText>Cancel</BodyText>
            </Pressable>
          </Card>
        </View>
      </Modal>
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
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    padding: 16,
  },
});