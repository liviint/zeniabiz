import { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { BodyText } from "../../../src/components/ThemeProvider/components";

const TimeFilters = ({
    selectedMonth,
    onMonthChange,
}) => {

    const [isPrevDisabled, setIsPrevDisabled] = useState(selectedMonth <= sixMonthsAgo - 1)
    const [isNextDisabled, setIsNextDisabled] = useState(selectedMonth >= today)


    const monthLabel = selectedMonth?.toLocaleString("default", {
        month: "long",
        year: "numeric",
    });

    const today = new Date();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6); 

    const goPrevMonth = () => {
        const d = new Date(selectedMonth);
        d.setMonth(d.getMonth() - 1);

        setIsPrevDisabled(d < sixMonthsAgo)
        if (d < sixMonthsAgo) return;
        setIsNextDisabled(false)

        onMonthChange(d);
    };

    const goNextMonth = () => {
        const d = new Date(selectedMonth);
        d.setMonth(d.getMonth() + 1);

        setIsNextDisabled(d > today)
        if (d > today) return;
        setIsPrevDisabled(false)

        onMonthChange(d);
    };

    return (
        <View style={styles.container}>
            <View style={styles.monthNav}>
                <TouchableOpacity disabled={isPrevDisabled} onPress={goPrevMonth}>
                    <BodyText style={[styles.arrow, isPrevDisabled && {opacity:0.3}]}>◀</BodyText>
                </TouchableOpacity>

                <BodyText style={styles.monthText}>
                    {monthLabel}
                </BodyText>

                <TouchableOpacity disabled={isNextDisabled} onPress={goNextMonth}>
                    <BodyText style={[styles.arrow, isNextDisabled && {opacity:0.3}]}>▶</BodyText>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default TimeFilters;

const styles = StyleSheet.create({
    container: {
        gap: 14,
        marginBottom: 10,
    },

    monthNav: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },

    monthText: {
        fontSize: 16,
        fontWeight: "700",
    },

    arrow: {
        fontSize: 18,
        paddingHorizontal: 10,
    },
});
