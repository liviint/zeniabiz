
import { usePathname, useRouter } from "expo-router";
import {
    Linking,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSubscription } from "../AppDataProvider/PremiumSubscriptionsProvider";

export default function Header({ menuOpen, setMenuOpen }) {
    const { hasPremium, hasPremiumPlus } = useSubscription();
    const router = useRouter();
    const pathname = usePathname();

    const items = [
        { label: "Customers", path: "/customers", type: "internal" },
        { label: "Suppliers", path: "/suppliers", type: "internal" },
        { label: "Credit", path: "/credits", type: "internal" },
        { label: "Business", path: "/business", type: "internal" },
        { label: "Data Backup & Sync", path: "/data-backup", type: "internal" },
        {
            label: "Learning Center",
            path: "https://zeniabiz.com/learning-center",
            type: "external",
        },
        { label: "Feedback", path: "/feedback", type: "internal" },
        { label: "Settings", path: "/settings", type: "internal" },
        {
            label: hasPremiumPlus
                ? "Premium Plus"
                : hasPremium
                ? "Premium"
                : "✨ Premium",
            path: "/subscriptions",
            type: "internal",
        },
    ];

    const handlePress = async (item) => {
        setMenuOpen(false);

        if (item.type === "external") {
            try {
                await Linking.openURL(item.path);
            } catch (error) {
                console.error("Failed to open external link:", error);
            }
            return;
        }

        router.push(item.path);
    };

    const isActive = (path) => {
        return pathname === path || pathname.startsWith(`${path}/`);
    };

    return (
        <View>
            <Modal
                visible={menuOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuOpen(false)}
            >
                <Pressable
                    style={styles.backdrop}
                    onPress={() => setMenuOpen(false)}
                >
                    <Pressable
                        style={styles.drawer}
                        onPress={(event) => event.stopPropagation()}
                    >
                        {items.map((item) => (
                            <TouchableOpacity
                                key={item.path}
                                style={[
                                    styles.link,
                                    item.type === "internal" &&
                                        isActive(item.path) &&
                                        styles.active,
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
