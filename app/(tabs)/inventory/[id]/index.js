import { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Card, BodyText, SecondaryText } from "../../../../src/components/ThemeProvider/components";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { getProductById, deleteProduct } from "../../../../src/db/productsDb";
import DeleteButton from "../../../../src/components/common/DeleteButton";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";

export default function ProductViewPage() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { globalStyles } = useThemeStyles();
  const { id } = useLocalSearchParams();

  const [product, setProduct] = useState({});

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
        <DetailRow label="Cost Price" value={`KES ${product.cost_price}`} />
        <DetailRow label="Selling Price" value={`KES ${product.selling_price}`} />
      </Card>

      <View style={styles.actionsRow}>
        <Pressable
          style={globalStyles.editBtn}
          onPress={() => router.push(`/inventory/${id}/edit`)}
        >
          <BodyText style={globalStyles.editBtnText}>Edit</BodyText>
        </Pressable>

        <DeleteButton handleOk={handleDelete} item="product" />
      </View>
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