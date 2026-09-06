import React, { useState } from "react";
import {
    View,
    Text,
    Pressable,
    ActivityIndicator,
    StyleSheet,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

const ExportButton = ({
    onExport,
    label = "Export",
    loading = false,
    disabled = false,
}) => {
    const [open, setOpen] = useState(false);

    const handleExport = async (format) => {
        if (loading || disabled) return;

        setOpen(false);

        if (onExport) {
            await onExport(format);
        }
    };

    const isDisabled = loading || disabled;

    return (
        <View style={styles.wrapper}>

            <Pressable
                onPress={() =>
                    setOpen((prev) => !prev)
                }
                disabled={isDisabled}
                style={({ pressed }) => [
                    styles.exportButton,
                    isDisabled && styles.disabled,
                    pressed &&
                        !isDisabled &&
                        styles.pressed,
                ]}
            >

                {loading ? (
                    <ActivityIndicator
                        size="small"
                        color="#333333"
                    />
                ) : (
                    <MaterialIcons
                        name="file-download"
                        size={18}
                        color="#333333"
                    />
                )}

                <Text style={styles.buttonText}>
                    {loading
                        ? "Exporting..."
                        : label}
                </Text>

                {!loading && (
                    <MaterialIcons
                        name="keyboard-arrow-down"
                        size={18}
                        color="#333333"
                    />
                )}

            </Pressable>

            {open && !loading && (
                <View style={styles.menu}>

                    <Pressable
                        onPress={() =>
                            handleExport("pdf")
                        }
                        style={({ pressed }) => [
                            styles.menuItem,
                            pressed &&
                                styles.menuItemPressed,
                        ]}
                    >

                        <MaterialIcons
                            name="picture-as-pdf"
                            size={18}
                            color="#333333"
                        />

                        <Text
                            style={
                                styles.menuItemText
                            }
                        >
                            Export as PDF
                        </Text>

                    </Pressable>

                </View>
            )}

        </View>
    );
};

const styles = StyleSheet.create({

    wrapper: {
        position: "relative",
        alignSelf: "flex-start",
        zIndex: 1000,
    },

    exportButton: {
        flexDirection: "row",
        alignItems: "center",

        gap: 7,

        paddingVertical: 8,
        paddingHorizontal: 12,

        borderRadius: 20,

        borderWidth: 1,
        borderColor: "#DDDDDD",

        backgroundColor: "#F4E1D2",
    },

    buttonText: {
        fontSize: 14,
        fontWeight: "400",
        color: "#333333",
    },

    disabled: {
        opacity: 0.6,
    },

    pressed: {
        opacity: 0.95,
    },

    menu: {
        position: "absolute",

        top: "100%",
        right: 0,

        marginTop: 8,

        minWidth: 220,

        padding: 6,

        backgroundColor: "#FFFFFF",

        borderWidth: 1,
        borderColor: "#DDDDDD",

        borderRadius: 12,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.12,
        shadowRadius: 24,

        elevation: 8,

        zIndex: 1000,
    },

    menuItem: {
        flexDirection: "row",
        alignItems: "center",

        gap: 9,

        paddingVertical: 10,
        paddingHorizontal: 12,

        borderRadius: 8,
    },

    menuItemPressed: {
        backgroundColor: "#F4E1D2",
    },

    menuItemText: {
        fontSize: 14,
        color: "#333333",
    },

});

export default ExportButton;