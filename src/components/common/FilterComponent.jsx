import { Pressable, View } from "react-native";
import { BodyText } from "../ThemeProvider/components";

const FilterComponent = ({filterOptions,activeFilter}) => {
    return (
        <View style={styles.chipsRow}>
            {
                filterOptions.map(option => (
                    <FilterChip 
                        key={option.key} 
                        label={option.label} 
                        active={activeFilter === option.key} 
                        onPress={option.action} 
                    />
                ))
            }
        </View>
    );
};

const FilterChip = ({ label, active, onPress }) => {
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.chip,
                { backgroundColor: active ? "#2E8B8B" : "#F4E1D2" },
            ]}
        >
            <BodyText style={{ color: active ? "#fff" : "#333" }}>
                {label}
            </BodyText>
        </Pressable>
    );
};

export default FilterComponent

const styles = {
    chipsRow: {
        flexDirection: "row",
        gap: 8,
        paddingVertical: 8,
        flexWrap:"wrap",
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
}