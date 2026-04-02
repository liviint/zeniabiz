import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View , Modal } from "react-native";
import DeleteButton from "../../../../src/components/common/DeleteButton";
import { BodyText, Card, SecondaryText, Input } from "../../../../src/components/ThemeProvider/components";
import { deleteProduct, getProductById, restockProduct } from "../../../../src/db/inventoryDb";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";

export default function ProductViewPage() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { globalStyles } = useThemeStyles();
  const { id } = useLocalSearchParams();

  const [product, setProduct] = useState({});
  const [restockVisible, setRestockVisible] = useState(false);
  const [restockQty, setRestockQty] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const data = await getProductById(db, id);
      setProduct(data);
    })();
  }, []);

  const handleDelete = async () => {
    await deleteProduct(db, id);
    Alert.alert("Deleted", "Product removed");
    router.push("/inventory");
  };

  const handleRestockConfirm = async () => {
    const qty = parseInt(restockQty);

    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Invalid input", "Enter a valid quantity");
      return;
    }

    await restockProduct(db, id, qty);

    const updated = await getProductById(db, id);
    setProduct(updated);

    setRestockVisible(false);
    setRestockQty("");

    Alert.alert("Success", `Added ${qty} items to stock`);
  };

  return (
    <View style={globalStyles.container}>
      <BodyText style={globalStyles.title}>Product Details</BodyText>

      <Card style={styles.card}>
        <DetailRow label="Name" value={product.name} />
        <DetailRow label="Stock" value={product.stock_quantity} />
        <DetailRow label="Cost Price" value={`KES ${product.cost_price}`} />
        <DetailRow label="Selling Price" value={`KES ${product.selling_price}`} />
      </Card>

      <View style={styles.actionsRow}>
        <Pressable
          style={globalStyles.primaryBtn}
          onPress={() => setRestockVisible(true)}
        >
          <BodyText style={globalStyles.primaryBtnText}>Restock</BodyText>
        </Pressable>

        <Pressable
          style={globalStyles.editBtn}
          onPress={() => router.push(`/inventory/${id}/edit`)}
        >
          <BodyText style={globalStyles.editBtnText}>Edit</BodyText>
        </Pressable>

        <DeleteButton handleOk={handleDelete} item="product" />
      </View>
        <Modal
          visible={restockVisible}
          transparent
          animationType="fade"
        >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <BodyText style={styles.modalTitle}>Restock Product</BodyText>
            
            <View style={globalStyles.formGroup}>
              <Input
                placeholder="Enter quantity"
                keyboardType="numeric"
                value={restockQty}
                onChangeText={setRestockQty}
                style={styles.input}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setRestockVisible(false)}
              >
                <BodyText>Cancel</BodyText>
              </Pressable>

              <Pressable
                style={globalStyles.primaryBtn}
                onPress={handleRestockConfirm}
              >
                <BodyText style={globalStyles.primaryBtnText}>
                  Confirm
                </BodyText>
              </Pressable>
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const DetailRow = ({ label, value }) => (
  <View style={{ marginBottom: 12 }}>
    <SecondaryText>{label}</SecondaryText>
    <BodyText>{value}</BodyText>
  </View>
);

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
},

  modalContent: {
    width: "85%",
    padding: 20,
    borderRadius: 12,
  },

  modalTitle: {
    fontSize: 18,
    marginBottom: 12,
  },



  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },

  cancelBtn: {
    justifyContent: "center",
    paddingHorizontal: 10,
  },
});