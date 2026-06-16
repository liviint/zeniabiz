import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Pressable,
} from "react-native";
import { useRouter, usePathname } from "expo-router";

export default function Header({ menuOpen, setMenuOpen }) {
    const router = useRouter();
    const pathname = usePathname();

    const items = [
        { label: "Credit", path: "/credits" },
        { label: "Customers", path: "/customers" },
        { label: "Settings", path: "/settings" },
        { label: "Profile", path: "/auth/profile" },
        { label: "Feedback", path: "/feedback" },
    ];

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
                {/* DRAWER (stop propagation so clicks inside don’t close) */}
                <Pressable style={styles.drawer}>
                    {items.map((item) => (
                    <TouchableOpacity
                        key={item.path}
                        style={[
                        styles.link,
                        pathname === item.path && styles.active,
                        ]}
                        onPress={() => {
                        setMenuOpen(false);
                        router.push(item.path);
                        }}
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