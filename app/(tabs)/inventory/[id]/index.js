import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View, ScrollView } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import DeleteButton from "../../../../src/components/common/DeleteButton";
import { BodyText, Card, SecondaryText } from "../../../../src/components/ThemeProvider/components";
import { deleteProduct, getProductById, getProductBatches } from "../../../../src/db/query/inventory";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import RestockForm from "../../../../src/components/inventory/RestockForm";
import { dateFormat } from "../../../../utils/dateFormat";

export default function ProductViewPage() {
  const db = useSQLiteContext();
  const isFocused = useIsFocused()
  const router = useRouter();
  const { globalStyles } = useThemeStyles();
  const { id } = useLocalSearchParams();

  const [product, setProduct] = useState({});
  const [stockBatches,setStockBatches] = useState([])
  const [restockVisible, setRestockVisible] = useState(false);
  const [reloadBatches,setReoloadBatches] = useState(0)
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    if (!id) return;
    const getProduct = async() => {
      const data = await getProductById(db, id);
      data && setProduct(data);
    }

    const getBatches = async() => {
      const data = await getProductBatches(db, id);
      setStockBatches(data);
    }

    getProduct()
    getBatches()
  }, [reloadBatches, isFocused]);

  const isService = product?.item_type === "service";

  const handleDelete = async () => {
    await deleteProduct(db, id);
    let message = isService ? "Service removed" : "Product removed"
    Alert.alert("Deleted", message);
    router.push("/inventory");
  };

  return (
    <ScrollView style={globalStyles.container}>
      <BodyText style={globalStyles.title}>
        {isService ? "Service Details" : "Product Details"}
      </BodyText>

        <Card style={styles.card}>
          <DetailRow label="Name" value={product?.name} />
          {!isService && 
            <DetailRow
              label="Barcode"
              value={product?.barcode || "-"}
            />
          }
          <DetailRow label="Selling Price" value={product?.selling_price} />

          {!isService && (
            <>
              <DetailRow label="Stock" value={product?.stock_quantity} />
              <DetailRow label="Minimum Quantity" value={product?.minimum_quantity} />
            </>
          )}

          {isService && (
            <DetailRow
              label="Unit"
              value={product?.unit || product?.service_unit || "-"}
            />
          )}
        </Card>

      {stockBatches.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <BodyText style={globalStyles.title}>Stock Batches</BodyText>

          {stockBatches.map((batch) => (
            <Card key={batch.id} style={styles.batchCard}>
              <DetailRow
                label="Quantity"
                value={batch?.quantity_on_hand}
              />

              <DetailRow
                label="Cost Price"
                value={batch?.cost_price}
              />

              <DetailRow
                label="Selling Price"
                value={batch?.selling_price}
              />

              <DetailRow
                label="Added"
                value={batch.purchase_date ? dateFormat(batch.purchase_date): "-"}
              />

              <DetailRow
                label="Batch Number"
                value={batch.batch_number ? batch.batch_number : "-"}
              />

              <DetailRow
                label="Expiry Date"
                value={batch.expiry_date ? dateFormat(batch.expiry_date) : "-"}
              />

              <View style={styles.editBtnContainer}>
                <Pressable
                  style={globalStyles.editBtn}
                  onPress={() => {
                    setSelectedBatch(batch);
                    setRestockVisible(true);
                  }}
                >
                  <BodyText style={globalStyles.editBtnText}>
                    Edit
                  </BodyText>
                </Pressable>
              </View>

            </Card>
          ))}
        </View>
      )}

      <View style={styles.actionsRow}>

        {!isService && 
          <Pressable
            style={globalStyles.primaryBtn}
            onPress={() => setRestockVisible(true)}
          >
            <BodyText style={globalStyles.primaryBtnText}>Restock</BodyText>
          </Pressable>
        }     

        <Pressable
          style={globalStyles.editBtn}
          onPress={
            isService ? () => router.push(`/inventory/${id}/edit/service`) 
            :
            () => router.push(`/inventory/${id}/edit`)
          }
        >
          <BodyText style={globalStyles.editBtnText}>Edit</BodyText>
        </Pressable>

        <DeleteButton 
          handleOk={handleDelete} 
          item={isService ? "service" : "product"} 
        />
      </View>

      <RestockForm 
        restockVisible={restockVisible}
        product={product}
        setRestockVisible={setRestockVisible}
        setProduct={setProduct}
        setReoloadBatches={setReoloadBatches}
        batch={selectedBatch}
        setSelectedBatch={setSelectedBatch}
      />
    </ScrollView>
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
    paddingBottom:20,
    justifyContent:"flex-end",
  },
  batchCard: {
    padding: 14,
    marginTop: 10,
  },
  editBtnContainer:{
    flexDirection: "row",
    marginTop: 3,
    paddingBottom:3,
    justifyContent:"flex-end",
  },
});