import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { BodyText, Card, SecondaryText, Input } from "../../../src/components/ThemeProvider/components";
import { AddButton } from "../../../src/components/common/AddButton";
import { getProducts } from "../../../src/db/inventoryDb";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import EmptyState from "../../../src/components/common/EmptyState";
import { StatCard } from "../../../src/components/common/StatCard";
import { useDebounce } from "../../../src/hooks/useDebounce";

export default function ProductsListPage() {
  const db = useSQLiteContext();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { globalStyles } = useThemeStyles();

  const [products, setProducts] = useState([]);
  const [isLoading,setIsLoading] = useState(true)
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [filter, setFilter] = useState("all");

  const fetchProducts = async () => {
    setIsLoading(true);
    const data = await getProducts(db, { search: debouncedSearch, filter });
    console.log(data,"hello data")
    setProducts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isFocused) fetchProducts();
  }, [isFocused, debouncedSearch, filter]);

  const renderItem = ({ item }) => (
    <Pressable onPress={() => router.push(`/inventory/${item.id}`)}>
      <Card>
        <View style={styles.row}>
          <View style={styles.left}>
            <BodyText style={styles.title}>{item.name}</BodyText>
            <SecondaryText style={styles.meta}>
              Stock: {item.stock_quantity}
            </SecondaryText>
          </View>

          <BodyText style={styles.price}>
            {item.selling_price}
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
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
          />
        }
        ListEmptyComponent={
            <EmptyState 
              title="No products yet"
              description="Try adjusting your filters or add a new product."
            />
        }
      />

      <AddButton 
        primaryAction={{ route: "/inventory/add", label: "Add Product" }}
      />
    </View>
  );
}

const ListHeader = ({ stats, search, filter, setSearch, setFilter}) => {
  return (
    <>
      <View style={styles.filtersContainer}>
        <View style={styles.searchRow}>
          <Input
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} style={styles.clearBtn}>
              <BodyText style={styles.clearText}>✕</BodyText>
            </Pressable>
          )}
        </View>

        <View style={styles.chipsRow}>
          <FilterChip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
          <FilterChip label="Low Stock" active={filter === "low_stock"} onPress={() => setFilter("low_stock")} />
          <FilterChip label="Out of Stock" active={filter === "out_of_stock"} onPress={() => setFilter("out_of_stock")} />
        </View>
      </View>
      <StatCard 
        label="Products"
        value={stats.count}
        subText={
          filter === "all"
            ? "All items"
            : filter === "low_stock"
            ? "Low stock items"
            : "Out of stock items"
        }
      />
    </>
      
  )
  
}

const FilterChip = ({ label, active, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? "#2E8B8B" : "#F4E1D2" },
      ]}
    >
      <BodyText style={{ color: active ? "#fff" : "#333" }}>
        {label}
      </BodyText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  filtersContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom:10,
  },

searchInput: {
  flex: 1,
  padding: 12,
  borderRadius: 12,
},

clearBtn: {
  marginLeft: 8,
  padding: 10,
  borderRadius: 10,
  backgroundColor: "#F4E1D2",
},

clearText: {
  color: "#FF6B6B",
  fontWeight: "bold",
},

  chipsRow: {
    flexDirection: "row",
    gap: 8,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
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