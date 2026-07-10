import { useState } from "react";
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
    Input
} from "../../../../src/components/ThemeProvider/components";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import EditSaleForm from "../EditSaleForm";


export default function Cart({
    cart,
    setCart,
    id,
    date,
    setDate
}) {
    const [selectedItem, setSelectedItem] = useState(null);
    const [editSaleModalVisible, setEditSaleModalVisible] = useState(false);

    const [cartExpanded, setCartExpanded] = useState(true);



    const updateQuantity = (product_id, quantity) => {
        if (quantity <= 0) {
        setCart((prev) => prev.filter((c) => c.product_id !== product_id));
        return;
        }

        setCart((prev) =>
        prev.map((c) =>
            c.product_id === product_id ? { ...c, quantity } : c
        )
        );
    };

    const markedPrice = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,0);



return (
    <>
        <Pressable
            style={styles.cartHeader}
            onPress={() => setCartExpanded((prev) => !prev)}
            >
            <BodyText style={{ fontWeight: "600" }}>
                Cart ({cart.length}) {cartExpanded ? "▼" : "▲"}
            </BodyText>
            <BodyText>Total: {markedPrice.toFixed(2)}</BodyText>
        </Pressable>
        {cartExpanded && (
            <FlatList
                data={cart}
                keyExtractor={(item) => item.product_id}
                style={styles.cartList}
                renderItem={({ item }) => (
                    <Card style={styles.cartItem}>
                        <View style={styles.cartTop}>
                            <Pressable
                                style={styles.cartInfo}
                                onPress={() => {
                                    setSelectedItem(item);
                                    setEditSaleModalVisible(true);
                                }}
                            >
                            <BodyText>{item.name}</BodyText>
                            <SecondaryText>
                                {item.price} x {item.quantity} ={" "}
                                {(item.price * item.quantity).toFixed(2)}
                            </SecondaryText>
                            </Pressable>

                            <Pressable
                            style={styles.editButton}
                            onPress={() => {
                                setSelectedItem(item);
                                setEditSaleModalVisible(true);
                            }}
                            >
                            <MaterialIcons name="edit" size={22} color="#666" />
                            </Pressable>
                        </View>

                        <View style={styles.qtyRow}>
                            <Pressable
                            style={styles.qtyButton}
                            onPress={() =>
                                updateQuantity(item.product_id, item.quantity - 1)
                            }
                            >
                            <BodyText style={styles.qtyButtonText}>−</BodyText>
                            </Pressable>

                            <Input
                            value={String(item.quantity)}
                            keyboardType="numeric"
                            style={styles.qtyInput}
                            onChangeText={(text) => {
                                const qty = parseInt(text, 10);
                                updateQuantity(item.product_id, isNaN(qty) ? 0 : qty);
                            }}
                            />

                            <Pressable
                            style={styles.qtyButton}
                            onPress={() =>
                                updateQuantity(item.product_id, item.quantity + 1)
                            }
                            >
                            <BodyText style={styles.qtyButtonText}>+</BodyText>
                            </Pressable>
                        </View>
                    </Card>
                )}
            />
        )}

        <EditSaleForm 
            styles={styles}
            modalVisible={editSaleModalVisible}
            setModalVisible={setEditSaleModalVisible}
            setCart={setCart}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            date={date}
            setDate={setDate}
        />
    </>
);
}

const styles = StyleSheet.create({
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  cartList: {
    maxHeight: 200,
  },
  cartItem: {
  marginBottom: 8,
  padding: 12,
},

cartTop: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
},

cartInfo: {
  flex: 1,
},

editButton: {
  padding: 6,
  marginLeft: 8,
},

qtyRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 12,
  width: 140,
},

qtyButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#f2f2f2",
},

qtyButtonText: {
  fontSize: 22,
  fontWeight: "600",
},
  footer: {
    marginTop: 8,
    display:"flex",
    width:"100%",
    flexDirection:"row",
    justifyContent:"flex-end",
    gap:8,
    flexWrap:"wrap",
  },
});