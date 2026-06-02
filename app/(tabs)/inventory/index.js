import { useIsFocused } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View , RefreshControl} from "react-native";
import { BodyText, Card, SecondaryText, Input } from "../../../src/components/ThemeProvider/components";
import { AddButton } from "../../../src/components/common/AddButton";
import { getProducts } from "../../../src/db/inventoryDb";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import EmptyState from "../../../src/components/common/EmptyState";
import { StatCard } from "../../../src/components/common/StatCard";
import { useDebounce } from "../../../src/hooks/useDebounce";
import { useManualSync } from "../../../src/hooks/useManualSync";
import FilterComponent from "../../../src/components/common/FilterComponent";

export default function ProductsListPage() {
  const db = useSQLiteContext();
  const { onRefresh, refreshing } = useManualSync();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { globalStyles } = useThemeStyles();
  const lastSyncedAt = useSelector(state => state.sync.lastSyncedAt);

  const [products, setProducts] = useState([]);
  const [stats,setStats] = useState({})
  const [isLoading,setIsLoading] = useState(true)
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [filter, setFilter] = useState("all");

  const filterOptions = [
    {
      label:"All",
      action:() => setFilter("all"),
      key:"all",
    },
    {
      label:"Low Stock",
      action:() => setFilter("low_stock"),
      key:"low_stock",
    },
    {
      label:"Out of Stock",
      action:() => setFilter("out_of_stock"),
      key:"out_of_stock",
    },
    {
      label: "Expiring Soon",
      action: () => setFilter("expiring_soon"),
      key: "expiring_soon",
    },
    {
      label: "Expired",
      action: () => setFilter("expired"),
      key: "expired",
    }
  ]

  const fetchProducts = async () => {
    setIsLoading(true);
    const data = await getProducts(db, { search: debouncedSearch, filter });
    setProducts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isFocused) fetchProducts();
  }, [isFocused, debouncedSearch, filter,lastSyncedAt]);

  useEffect(() => {
    setStats({
      count:products.length,
      stockValue:products.reduce((sum,product) => sum + (product.cost_price * product.stock_quantity),0)
    })
  },[products])

  const renderItem = ({ item }) => (
    <Pressable onPress={() => router.push(`/inventory/${item?.id}`)}>
      <Card>
        <View style={styles.row}>
          <View style={styles.left}>
            <BodyText style={styles.title}>{item?.name}</BodyText>
            <SecondaryText style={styles.meta}>
              Stock: {item?.stock_quantity}
            </SecondaryText>
          </View>

          <BodyText style={styles.price}>
            {item?.selling_price}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 96 }}
        ListHeaderComponent={
          <ListHeader
            stats={stats}
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
            filterOptions={filterOptions}
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

const ListHeader = ({ 
  stats, 
  search, 
  filter, 
  setSearch, 
  setFilter,
  filterOptions
}) => {
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

        <FilterComponent 
          filterOptions={filterOptions}
          activeFilter={filter}
        />

      </View>
      <View style={styles.row}>
        <StatCard 
          label="Stock Value"
          value={stats.stockValue}

        />
        <StatCard 
          label="Products"
          value={stats.count}
        />
      </View>
    </>
      
  )
  
}

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