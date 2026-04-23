import { useMemo, useState } from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View,
    Modal,
    Pressable,
} from "react-native";
import { BodyText } from "../ThemeProvider/components";

import {
    startOfDay,
    shiftRange,
    formatLabel,
    createRange,
} from "../../utils/timeNavigatorHelpers";
import { useThemeStyles } from "../../hooks/useThemeStyles";

const OPTIONS = [
    { key: "day", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "range", label: "Last 3 Months" },
    { key: "all", label: "All Time" },
];

const TimeNavigator = ({ state, onChange }) => {
    const { colors } = useThemeStyles()
    const [open, setOpen] = useState(false);

    const today = new Date();

    const isAllTime = state.type === "all";

    const isNextDisabled =
        isAllTime ||
        (state.endDate &&
            startOfDay(new Date(state.endDate)) >=
                startOfDay(today));

    const isPrevDisabled = isAllTime;

    const label = useMemo(
        () => formatLabel(state),
        [state]
    );

    const goPrev = () => {
        if (isPrevDisabled) return;
        onChange(shiftRange(state, "prev"));
    };

    const goNext = () => {
        if (isNextDisabled) return;
        onChange(shiftRange(state, "next"));
    };

    const selectOption = (key) => {
        const newRange = createRange(key);
        onChange(newRange);
        setOpen(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.nav}>
                <TouchableOpacity
                    onPress={goPrev}
                    disabled={isPrevDisabled}
                >
                    <BodyText
                        style={[
                            styles.arrow,
                            isPrevDisabled && styles.disabled,
                        ]}
                    >
                        ◀
                    </BodyText>
                </TouchableOpacity>

                {/* 🔥 CLICKABLE LABEL */}
                <TouchableOpacity
                    onPress={() => setOpen(true)}
                >
                    <BodyText style={styles.label}>
                        {label} ▼
                    </BodyText>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={goNext}
                    disabled={isNextDisabled}
                >
                    <BodyText
                        style={[
                            styles.arrow,
                            isNextDisabled && styles.disabled,
                        ]}
                    >
                        ▶
                    </BodyText>
                </TouchableOpacity>
            </View>

            {/* ---------------- DROPDOWN ---------------- */}
            <Modal
                visible={open}
                transparent
                animationType="fade"
            >
                <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
                    <Pressable style={{...styles.card ,backgroundColor: colors.surface}} onPress={() => {}}>
                        <Pressable
                            onPress={() => setOpen(false)}
                        >
                        <View style={styles.dropdown}>
                            {OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={styles.option}
                                    onPress={() =>
                                        selectOption(opt.key)
                                    }
                                >
                                    <BodyText>
                                        {opt.label}
                                    </BodyText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Pressable>
                </Pressable>
                </Pressable>

            </Modal>
        </View>
    );
};

export default TimeNavigator;

// -------------------- Styles --------------------

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
    },
    card:{
        borderRadius: 16,
        padding: 16,

        shadowColor: "#000",
        shadowOffset: "0 2",
        shadowOpacity: 0.15,
        shadowRadius: 3,

        elevation: 3,
        marginBottom: 16,
    },

    nav: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    label: {
        fontSize: 16,
        fontWeight: "700",
    },

    arrow: {
        fontSize: 18,
        paddingHorizontal: 10,
    },

    disabled: {
        opacity: 0.3,
    },

    backdrop: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    dropdown: {
        padding: 12,
        borderRadius: 12,
        width: 220,
    },

    option: {
        paddingVertical: 12,
    },
});