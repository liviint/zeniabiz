import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import DeleteButton from "../../../../src/components/common/DeleteButton";
import { BodyText, Card, SecondaryText } from "../../../../src/components/ThemeProvider/components";
import { deleteProduct, getProductById } from "../../../../src/db/inventoryDb";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import RestockForm from "../../../../src/components/inventory/RestockForm";

export default function ProductViewPage() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { globalStyles } = useThemeStyles();
  const { id } = useLocalSearchParams();

  const [product, setProduct] = useState({});
  const [restockVisible, setRestockVisible] = useState(false);

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

  return (
    <View style={globalStyles.container}>
      <BodyText style={globalStyles.title}>Product Details</BodyText>

      <Card style={styles.card}>
        <DetailRow label="Name" value={product.name} />
        <DetailRow label="Stock" value={product.stock_quantity} />
        <DetailRow label="Cost Price" value={` ${product.cost_price}`} />
        <DetailRow label="Selling Price" value={` ${product.selling_price}`} />
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
      <RestockForm 
        restockVisible={restockVisible}
        product={product}
        setRestockVisible={setRestockVisible}
        setProduct={setProduct}
      />
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
});