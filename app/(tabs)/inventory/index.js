import { useIsFocused } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { 
    FlatList, 
    Pressable, 
    StyleSheet, 
    View , 
    RefreshControl, 
    InteractionManager 
} from "react-native";
import { BodyText, Card, SecondaryText } from "../../../src/components/ThemeProvider/components";
import { AddButton } from "../../../src/components/common/AddButton";
import { getProducts } from "../../../src/db/query/inventory";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import EmptyState from "../../../src/components/common/EmptyState";
import { StatCard } from "../../../src/components/common/StatCard";
import { useDebounce } from "../../../src/hooks/useDebounce";
import { useManualSync } from "../../../src/hooks/useManualSync";
import FilterComponent from "../../../src/components/common/FilterComponent";
import SortComponent from "../../../src/components/common/SortComponent";
import { formatNumber } from "../../../src/db/utils";
import { canViewReports } from "../../../src/utils/rolesAndPermissions"
import SearchProducts from "../../../src/components/barcodeScanner/searchProducts";
import { useDeferredEffect } from "../../../src/hooks/useDeferredEffect";
import { TourGuideZone, useTourGuideController } from "react-native-tourguide";

export default function ProductsListPage() {
  const db = useSQLiteContext();
  const { start } = useTourGuideController();
  const { onRefresh, refreshing } = useManualSync();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { globalStyles } = useThemeStyles();

  const lastSyncedAt = useSelector(state => state.sync.lastSyncedAt);
  const user = useSelector((state) => state.user.userDetails);

  const [isAllowedToViewReports,setIsAllowedToViewReports] = useState(canViewReports())

  const [products, setProducts] = useState([]);
  const [stats,setStats] = useState({})
  const [isLoading,setIsLoading] = useState(true)
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest")

  const filterOptions = [
    {
      label:"All",
      action:() => setFilter("all"),
      key:"all",
    },
    {
      label:"Products",
      action:() => setFilter("products"),
      key:"products",
    },
    {
      label:"Services",
      action:() => setFilter("services"),
      key:"services",
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
      label: "Expiring Soon(< 30 days)",
      action: () => setFilter("expiring_soon"),
      key: "expiring_soon",
    },
    {
      label: "Expired",
      action: () => setFilter("expired"),
      key: "expired",
    }
  ]

  const sortOptions = [
  { 
    label: "Newest", 
    key: "newest", 
    action: () => setSort("newest") 
  },
  { 
    label: "Oldest", 
    key: "oldest", 
    action: () => setSort("oldest") 
  },
  { 
    label: "Low Stock", 
    key: "low_stock",
    action: () => setSort("low_stock") 
  },
  { 
    label: "High Stock", 
    key: "high_stock", 
    action: () => setSort("high_stock") 
  },
  { 
    label: "Price(High-Low)", 
    key: "price_high", 
    action: () => setSort("price_high") 
  },
  { 
    label: "Price(Low-High)", 
    key: "price_low", 
    action: () => setSort("price_low") 
  },
];

  useDeferredEffect(async (isMounted) => {
    if (isMounted()) setIsLoading(true);
    
    try {
      const data = await getProducts(db, {
        search: debouncedSearch,
        filter,
        sort,
      });

      if (isMounted()) {
        setProducts(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch sales:", error);
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  }, [
    isFocused,
    db,
    debouncedSearch,
    filter,
    lastSyncedAt,
    sort,
  ],
{enabled: isFocused,});

  useEffect(() => {
    setIsAllowedToViewReports(canViewReports())
  },[user])

  useEffect(() => {
    setStats({
      count:products.length,
      stockValue:products.reduce((sum,product) => sum + (product.cost_price * product.stock_quantity),0)
    })
  },[products])

  const shouldShowTour = products.length === 0 
  useEffect(() => {
    if (!shouldShowTour) return;
    const task = InteractionManager.runAfterInteractions(() => {
        start();
    });
    return () => task.cancel();
  }, [shouldShowTour,isFocused]);

  const renderItem = ({ item }) => {
    const isService = item?.item_type === "service";

  return (
    <Pressable onPress={() => router.push(`/inventory/${item?.id}`)}>
      <Card>
        <View style={styles.row}>
          <View style={styles.left}>
            <BodyText style={styles.title}>
              {item?.name}
            </BodyText>

            <SecondaryText style={styles.meta}>
              {isService
                ? `Service • ${item?.unit || "unit"}`
                : `Stock: ${item?.stock_quantity}`}
            </SecondaryText>
          </View>

          <BodyText style={styles.price}>
            {item?.selling_price}
          </BodyText>
        </View>
      </Card>
    </Pressable>
  );
};

  return (
    <View style={globalStyles.container}>
      <BodyText style={globalStyles.title}>Products & Services</BodyText>
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
            sortOptions={sortOptions}
            sort={sort}
            globalStyles={globalStyles}
            isAllowedToViewReports={isAllowedToViewReports}
          />
        }
        ListEmptyComponent={
            <EmptyState 
              title="No products yet"
              description="Try adjusting your filters or add a new product."
            />
        }
      />

      <TourGuideZone
          zone={1}
          text="Tap here to add your first product."
      >
        <AddButton 
            primaryAction={{ route: "/inventory/add", label: "Add Product" }}
            secondaryActions={[
              {route:"/inventory/add/service",label: "Add Service"},
            ]}
          />
    </TourGuideZone>
    </View>
  );
}

const ListHeader = ({ 
  stats, 
  search, 
  filter, 
  setSearch, 
  setFilter,
  filterOptions,
  sortOptions,
  sort,
  globalStyles,
  isAllowedToViewReports,
}) => {
  return (
    <>
      <View style={styles.filtersContainer}>
          <SearchProducts 
            search={search}
            setSearch={setSearch}
          />

          <View style={globalStyles.filterSortContainer}>
            <FilterComponent 
              filterOptions={filterOptions}
              activeFilter={filter}
            />

            <SortComponent 
              sortOptions={sortOptions}
              activeSort={sort}
            />
          </View>

      </View>
      {isAllowedToViewReports && <View style={styles.row}>
        <StatCard 
          label="Stock Value"
          value={formatNumber(stats.stockValue)}

        />
        <StatCard 
          label="Products"
          value={formatNumber(stats.count)}
        />
      </View>}

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