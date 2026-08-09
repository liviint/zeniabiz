import { useMemo, useState } from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View,
    Modal,
    Pressable,
    Platform,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import { BodyText } from "../ThemeProvider/components";

import {
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
    { key: "year", label: "Last 12 Months" },
    { key: "all", label: "All Time" },
    { key: "custom", label: "Custom Range" },
];

const TimeNavigator = ({ state, onChange }) => {
    const { colors } = useThemeStyles();

    const [open, setOpen] = useState(false);
    const [customOpen, setCustomOpen] = useState(false);

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const [picker, setPicker] = useState(null);

    const today = new Date();

    const isAllTime =
        state.type === "all" ||
        state.type === "year";

    const isNextDisabled =
        isAllTime ||
        (
            state.endDate &&
            new Date(state.endDate).getTime() > today.getTime()
        );

    const isPrevDisabled = isAllTime;

    const label = useMemo(
        () => formatLabel(state),
        [state]
    );

    const goPrev = () => {
        if (isPrevDisabled) return;

        onChange(
            shiftRange(state, "prev")
        );
    };

    const goNext = () => {
        if (isNextDisabled) return;

        onChange(
            shiftRange(state, "next")
        );
    };

    const selectOption = (key) => {
        if (key === "custom") {
            const initialStart = state.startDate
                ? new Date(state.startDate)
                : new Date();

            const initialEnd = state.endDate
                ? new Date(state.endDate)
                : new Date();

            setStartDate(initialStart);
            setEndDate(initialEnd);

            setOpen(false);
            setCustomOpen(true);

            return;
        }

        const newRange = createRange(key);

        onChange(newRange);
        setOpen(false);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    /**
     * Returns YYYY-MM-DD using local time.
     * Avoids timezone problems caused by toISOString().
     */
    const formatDateForDatabase = (date) => {
        const year = date.getFullYear();
        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    /**
     * Since getSales() uses:
     *
     * date >= startDate
     * AND date < endDate
     *
     * the end date needs to be the NEXT day.
     */
    const getExclusiveEndDate = (date) => {
        const nextDay = new Date(date);

        nextDay.setDate(
            nextDay.getDate() + 1
        );

        return formatDateForDatabase(nextDay);
    };

    const handleDateChange = (event, selectedDate) => {
        // Android closes the native picker automatically.
        if (Platform.OS === "android") {
            setPicker(null);
        }

        if (!selectedDate) return;

        if (picker === "start") {
            setStartDate(selectedDate);

            // Keep the range valid.
            if (selectedDate > endDate) {
                setEndDate(selectedDate);
            }
        }

        if (picker === "end") {
            // Don't allow end before start.
            if (selectedDate < startDate) {
                setEndDate(startDate);
            } else {
                setEndDate(selectedDate);
            }
        }
    };

    const applyCustomRange = () => {
        if (startDate > endDate) {
            return;
        }

        const range = {
            type: "custom",
            startDate: formatDateForDatabase(startDate),
            endDate: getExclusiveEndDate(endDate),
        };

        onChange(range);

        setCustomOpen(false);
        setPicker(null);
    };

    const cancelCustomRange = () => {
        setCustomOpen(false);
        setPicker(null);
    };

    return (
        <View style={styles.container}>

            {/* Navigation */}
            <View style={styles.nav}>
                <TouchableOpacity
                    onPress={goPrev}
                    disabled={isPrevDisabled}
                >
                    <BodyText
                        style={[
                            styles.arrow,
                            isPrevDisabled &&
                                styles.disabled,
                        ]}
                    >
                        ◀
                    </BodyText>
                </TouchableOpacity>

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
                            isNextDisabled &&
                                styles.disabled,
                        ]}
                    >
                        ▶
                    </BodyText>
                </TouchableOpacity>
            </View>

            {/* Preset options */}
            <Modal
                visible={open}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setOpen(false)
                }
            >
                <Pressable
                    style={styles.backdrop}
                    onPress={() => setOpen(false)}
                >
                    <Pressable
                        style={[
                            styles.card,
                            {
                                backgroundColor:
                                    colors.surface,
                            },
                        ]}
                        onPress={() => {}}
                    >
                        <View style={styles.dropdown}>
                            {OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={styles.option}
                                    onPress={() =>
                                        selectOption(
                                            opt.key
                                        )
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
            </Modal>

            {/* Custom Range */}
            <Modal
                visible={customOpen}
                transparent
                animationType="fade"
                onRequestClose={cancelCustomRange}
            >
                <Pressable
                    style={styles.backdrop}
                    onPress={cancelCustomRange}
                >
                    <Pressable
                        style={[
                            styles.customCard,
                            {
                                backgroundColor:
                                    colors.surface,
                            },
                        ]}
                        onPress={() => {}}
                    >
                        <BodyText style={styles.customTitle}>
                            Custom Range
                        </BodyText>

                        {/* Start Date */}
                        <View style={styles.dateSection}>
                            <BodyText
                                style={styles.dateLabel}
                            >
                                Start Date
                            </BodyText>

                            <TouchableOpacity
                                style={[
                                    styles.dateInput,
                                    {
                                        borderColor:
                                            colors.border,
                                    },
                                ]}
                                onPress={() =>
                                    setPicker("start")
                                }
                            >
                                <BodyText>
                                    {formatDate(
                                        startDate
                                    )}
                                </BodyText>
                            </TouchableOpacity>
                        </View>

                        {/* End Date */}
                        <View style={styles.dateSection}>
                            <BodyText
                                style={styles.dateLabel}
                            >
                                End Date
                            </BodyText>

                            <TouchableOpacity
                                style={[
                                    styles.dateInput,
                                    {
                                        borderColor:
                                            colors.border,
                                    },
                                ]}
                                onPress={() =>
                                    setPicker("end")
                                }
                            >
                                <BodyText>
                                    {formatDate(
                                        endDate
                                    )}
                                </BodyText>
                            </TouchableOpacity>
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={
                                    cancelCustomRange
                                }
                            >
                                <BodyText>
                                    Cancel
                                </BodyText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.applyButton,
                                    {
                                        backgroundColor:
                                            colors.secondary,
                                    },
                                ]}
                                onPress={
                                    applyCustomRange
                                }
                            >
                                <BodyText
                                    style={
                                        styles.applyText
                                    }
                                >
                                    Apply
                                </BodyText>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Native Calendar */}
            {picker && (
                <DateTimePicker
                    value={
                        picker === "start"
                            ? startDate
                            : endDate
                    }
                    mode="date"
                    display={
                        Platform.OS === "ios"
                            ? "inline"
                            : "calendar"
                    }
                    maximumDate={today}
                    minimumDate={
                        picker === "end"
                            ? startDate
                            : undefined
                    }
                    onChange={
                        handleDateChange
                    }
                />
            )}
        </View>
    );
};

export default TimeNavigator;

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
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
        backgroundColor: "rgba(0,0,0,0.25)",
    },

    card: {
        borderRadius: 16,
        padding: 16,
        width: 220,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3,

        elevation: 3,
    },

    dropdown: {
        width: "100%",
    },

    option: {
        paddingVertical: 12,
    },

    /* Custom Range */

    customCard: {
        width: "88%",
        maxWidth: 380,

        borderRadius: 16,
        padding: 20,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 6,

        elevation: 5,
    },

    customTitle: {
        fontSize: 19,
        fontWeight: "700",
        marginBottom: 20,
    },

    dateSection: {
        marginBottom: 16,
    },

    dateLabel: {
        fontSize: 13,
        marginBottom: 7,
    },

    dateInput: {
        height: 46,

        borderWidth: 1,
        borderRadius: 10,

        paddingHorizontal: 14,

        justifyContent: "center",
    },

    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",

        marginTop: 8,
        gap: 10,
    },

    cancelButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 9,
    },

    applyButton: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 9,
    },

    applyText: {
        color: "#FFFFFF",
        fontWeight: "600",
    },
});