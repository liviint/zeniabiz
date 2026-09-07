
import React from "react";
import {
    View,
    Pressable,
    ActivityIndicator,
    StyleSheet,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

const ExportButton = ({
    onExport,
    loading = false,
    disabled = false,
}) => {
    const handleExport = async () => {
        if (loading || disabled) return;

        if (onExport) {
            await onExport("pdf");
        }
    };

    const isDisabled = loading || disabled;

    return (
        <View style={styles.wrapper}>
            <Pressable
                onPress={handleExport}
                disabled={isDisabled}
                style={({ pressed }) => [
                    styles.exportButton,
                    isDisabled && styles.disabled,
                    pressed && !isDisabled && styles.pressed,
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
                        size={20}
                        color="#333333"
                    />
                )}
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignSelf: "flex-start",
    },

    exportButton: {
        width: 40,
        height: 30,

        alignItems: "center",
        justifyContent: "center",

        borderRadius: 20,

        borderWidth: 1,
        borderColor: "#DDDDDD",

        backgroundColor: "#F4E1D2",
    },

    disabled: {
        opacity: 0.6,
    },

    pressed: {
        opacity: 0.8,
    },
});

export default ExportButton;

