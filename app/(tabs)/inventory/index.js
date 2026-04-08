import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { BodyText, Card, SecondaryText } from "../../../src/components/ThemeProvider/components";
import { AddButton } from "../../../src/components/common/AddButton";
import { getProducts } from "../../../src/db/inventoryDb";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import EmptyState from "../../../src/components/common/EmptyState";
import { StatCard } from "../../../src/components/common/StatCard";

export default function ProductsListPage() {
  const db = useSQLiteContext();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { globalStyles } = useThemeStyles();

  const [products, setProducts] = useState([]);
  const [isLoading,setIsLoading] = useState(true)

  const fetchProducts = async () => {
    const data = await getProducts(db);
    setProducts(data);
  };

  useEffect(() => {
    if (isFocused) fetchProducts();
    setIsLoading(false)
  }, [isFocused]);

  const renderItem = ({ item }) => (
    <Pressable onPress={() => router.push(`/inventory/${item.id}`)}>
      <Card>
        <View style={styles.row}>
          <View style={styles.left}>
            <BodyText style={styles.title}>{item.name}</BodyText>
            <SecondaryText style={styles.meta}>
              Stock: {item.stock_quantity} • Cost: KES {item.cost_price}
            </SecondaryText>
          </View>

          <BodyText style={styles.price}>
            KES {item.selling_price}
          </BodyText>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <View style={globalStyles.container}>
      <BodyText style={globalStyles.title}>My Stock</BodyText>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 96 }}
        ListHeaderComponent={
          <ListHeader
            stats={{count:products.length}}
          />
        }
        ListEmptyComponent={
            <EmptyState 
              title="No products yet"
              description="Add products to start tracking your stock and sales."
            />
        }
      />

      <AddButton 
        primaryAction={{ route: "/inventory/add", label: "Add Product" }}
      />
    </View>
  );
}

const ListHeader = ({ stats}) => {
  return (
      <StatCard 
        label="Total Products"
        value={stats.count}
        subText="Items in stock"
      />
  )
  
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E8B8B",
  },
});