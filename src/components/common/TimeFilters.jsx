import { View,  Pressable,StyleSheet } from "react-native";
import {  BodyText} from "../ThemeProvider/components";
import { useThemeStyles } from "../../hooks/useThemeStyles";

const TIME_FILTERS = [
    "7 days",
    "This Month",
    "30 days",
    "3 months",
    "6 months",
    "1 year",
];

const TimeFilters = ({ onPeriodChange,selectedPeriod }) => {
    const {colors} = useThemeStyles()
    const handleSelectPeriod = (period) => {
        if (onPeriodChange) onPeriodChange(period);
    };
    return <>
        <View style={styles.filterRow}>
            {TIME_FILTERS.map((period) => (
            <Pressable
                key={period}
                onPress={() => handleSelectPeriod(period)}
                style={{
                    ...styles.filterChip,
                    backgroundColor: selectedPeriod === period ? "#2E8B8B"  : colors.surface,
                }}
            >
                <BodyText
                style={{
                    ...styles.filterText,
                    color:selectedPeriod === period ? "#FFFFFF" : colors.text ,
                }}
                >
                {period}
                </BodyText>
            </Pressable>
            ))}
        </View>
    </>
}

const styles = StyleSheet.create({
    filterRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent:"center",
        gap: 8,
        marginVertical: 12,
    },

    filterChip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: "#F0F0F0",
    },

    filterText: {
        fontSize: 12,
        color: "#333",
    },
});

export default TimeFilters