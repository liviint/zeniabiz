import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Pressable,
    Linking,
    StyleSheet,
} from "react-native";
import { useRouter, usePathname } from "expo-router";

export default function Header({ menuOpen, setMenuOpen }) {
    const router = useRouter();
    const pathname = usePathname();

    const items = [
        { label: "Credit", path: "/credits", type: "internal" },
        { label: "Customers", path: "/customers", type: "internal" },
        { label: "My Business", path: "/business", type: "internal" },
        { label: "Settings", path: "/settings", type: "internal" },
        { label: "Profile", path: "/auth/profile", type: "internal" },
        { label: "Feedback", path: "/feedback", type: "internal" },

        {
            label: "Learning Center",
            path: "https://zeniabiz.com/learning-center",
            type: "external",
        },
    ];

    const handlePress = (item) => {
        setMenuOpen(false);

        if (item.type === "external") {
            Linking.openURL(item.path);
        } else {
            router.push(item.path);
        }
    };

    return (
        <View>
            <Modal
                visible={menuOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuOpen(false)}
            >
                {/* BACKDROP */}
                <Pressable
                    style={styles.backdrop}
                    onPress={() => setMenuOpen(false)}
                >
                    {/* DRAWER */}
                    <Pressable style={styles.drawer}>
                        {items.map((item) => (
                            <TouchableOpacity
                                key={item.label}
                                style={[
                                    styles.link,
                                    pathname === item.path && styles.active,
                                ]}
                                onPress={() => handlePress(item)}
                            >
                                <Text style={styles.linkText}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        flexDirection: "row",
    },

    drawer: {
        width: 280,
        backgroundColor: "#2E8B8B",
        paddingTop: 60,
        paddingHorizontal: 20,
    },

    link: {
        paddingVertical: 14,
    },

    linkText: {
        color: "#FAF9F7",
        fontSize: 17,
        fontWeight: "600",
    },

    active: {
        borderLeftWidth: 4,
        borderLeftColor: "#FF6B6B",
        paddingLeft: 10,
    },
});