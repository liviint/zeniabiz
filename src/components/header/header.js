import { View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { useRouter} from "expo-router";

export default function Header({menuOpen, setMenuOpen}) {
    const router = useRouter();

    return (
        <View style={styles.headerContainer}>
            <TouchableOpacity 
                onPress={() => setMenuOpen(!menuOpen)} 
                style={styles.menuButton}
            >
                <Text style={styles.menuText}>{menuOpen ? "✖" : "☰"}</Text>
            </TouchableOpacity>

            <Pressable onPress={() => router.push("/")}>
                <Text style={styles.logoText}>ZeniaBiz</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: "#2E8B8B",
        height: 90,
        paddingTop:"20",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 999, 
    },
    logoText: {
        color: "#FAF9F7",
        fontSize: 22,
        fontWeight: "700",
    },
    menuButton: {
        padding: 8,
    },
    menuText: {
        color: "#FAF9F7",
        fontSize: 24,
        fontWeight: "bold",
    },
});
