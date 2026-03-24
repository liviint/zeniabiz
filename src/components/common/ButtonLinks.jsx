import {
    View,
    Pressable,
    StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { SecondaryText } from "../../../src/components/ThemeProvider/components";
import { IconSymbol } from "@/src/components/ui/icon-symbol";

const ButtonLinks = ({ links, align = "right" }) => {
    const router = useRouter();

    return (
        <View
            style={{
                ...styles.container,
                justifyContent: align === "right" ? "flex-end" : "flex-start",
            }}
        >
            {links.map((link) => (
                <Pressable
                    key={link.name}
                    onPress={() => router.push(link.route)}
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.pressed,
                    ]}
                >
                    <SecondaryText style={styles.text}>
                        {link.name}{" "}
                    </SecondaryText>
                    <SecondaryText style={styles.text}>
                        <IconSymbol size={16} name="arrow-right" />
                    </SecondaryText>
                </Pressable>
            ))}
        </View>
    );
};

export default ButtonLinks;

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 10,
        marginTop: 8,
        marginBottom: 12,
    },
    button: {
        borderWidth: 1,
        borderColor: "#2E8B8B33",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 18,
        backgroundColor: "transparent",
        display:"flex",
        flexDirection:"row",
        alignItems:"center",
    },
    pressed: {
        backgroundColor: "#2E8B8B10",
    },
    text: {
        fontSize: 14,
        fontWeight: "700",
        color: "#2E8B8B",
        display:"flex",
        alignContent:"center",
        alignItems:"center",
    },
});