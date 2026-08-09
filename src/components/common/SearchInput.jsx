import { Pressable, StyleSheet, View } from "react-native";
import { BodyText, Input } from "../ThemeProvider/components";

const SearchInput = ({ search, setSearch, placeholder = "Search..." }) => {
  return (
    <View style={styles.searchRow}>
      <Input
        placeholder={placeholder}
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      {search.length > 0 && (
        <Pressable onPress={() => setSearch("")} style={styles.clearBtn}>
          <BodyText style={styles.clearText}>✕</BodyText>
        </Pressable>
      )}
    </View>
  );
};

export default SearchInput;

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  searchInput: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    marginRight: 5,
  },

  clearBtn: {
    marginLeft: 5,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F4E1D2",
  },

  clearText: {
    color: "#FF6B6B",
    fontWeight: "bold",
  },
});
