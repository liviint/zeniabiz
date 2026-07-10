import { useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
    FlatList,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import {
    BodyText,
    Card,
    SecondaryText,
} from "../../../../src/components/ThemeProvider/components";
import { getProducts } from "../../../db/query/inventory";
import { useSQLiteContext } from "expo-sqlite";
import { useDebounce } from "../../../../src/hooks/useDebounce";
import { useDeferredEffect } from "../../../hooks/useDeferredEffect";
import SearchProducts from "../../barcodeScanner/searchProducts";

export default function ProductsList({
    setSale,
    setCart
}) {

    const isFocused = useIsFocused();
    const db = useSQLiteContext();

    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);

    useDeferredEffect(async (isMounted) => {
    
        const fetchedProducts = await getProducts(db, { search: debouncedSearch });

        if (isMounted()) {
            setProducts(fetchedProducts || []);
        }

    }, [isFocused, debouncedSearch],{enabled: isFocused,});

    const addToCart = (product) => {
        setSale(null)
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
            item_type:product.item_type
            },
        ];
        });
    };

    return (
        <>
            <SearchProducts 
                search={search}
                setSearch={setSearch}
            />
            <View style={styles.productsContainer}>
                <FlatList
                    data={products}
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
        </>
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
});