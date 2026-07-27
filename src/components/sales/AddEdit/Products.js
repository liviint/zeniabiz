import { useState } from "react";
import {
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

    const db = useSQLiteContext();

    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const [productsExpanded, setProductsExpanded] = useState(true);

    useDeferredEffect(async (isMounted) => {
        setProducts([])
        if(!debouncedSearch) return
    
        const fetchedProducts = await getProducts(db, { search: debouncedSearch });

        if (isMounted()) {
            setProducts(fetchedProducts || []);
        }

    }, [debouncedSearch]);

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

            <Pressable
                style={styles.productsHeader}
                onPress={() => setProductsExpanded(prev => !prev)}
            >
                <BodyText style={{ fontWeight: "600" }}>
                    Products {productsExpanded ? "▼" : "▲"}
                </BodyText>
            </Pressable>

            {productsExpanded && 
            <View style={styles.productsContainer}>
                <View style={styles.grid}>
                    {products.map((item) => (
                    <Pressable
                        key={item.id}
                        style={styles.gridItem}
                        onPress={() => addToCart(item)}
                    >
                        <Card style={styles.productCard}>
                        <BodyText>{item.name}</BodyText>
                        <SecondaryText>{item.selling_price}</SecondaryText>
                        </Card>
                    </Pressable>
                    ))}
                </View>
            </View>}
        </>
    );
}

const styles = StyleSheet.create({
    productsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    gridItem: {
        marginHorizontal: 4,
    },
});