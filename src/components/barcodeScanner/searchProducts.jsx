import {useState} from 'react'
import { 
    Pressable, 
    StyleSheet, 
    View ,  
    TouchableOpacity
} from "react-native";
import { 
    BodyText,
    Input 
} from "../../../src/components/ThemeProvider/components";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import BarcodeScanner from './index';

const SearchProducts = ({
    search,
    setSearch,
}) => {

    const { globalStyles } = useThemeStyles();
    const [scannerVisible, setScannerVisible] = useState(false);

    return (
        <View style={styles.searchRow}>
                  <Input
                    placeholder="Search name or barcode..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                  />
        
                  <TouchableOpacity
                    style={globalStyles.primaryBtn}
                    onPress={() => setScannerVisible(true)}
                  >
                    <BodyText style={globalStyles.primaryBtnText}>
                      Scan
                    </BodyText>
                  </TouchableOpacity>
        
                  {search.length > 0 && (
                    <Pressable onPress={() => setSearch("")} style={styles.clearBtn}>
                      <BodyText style={styles.clearText}>✕</BodyText>
                    </Pressable>
                  )}
                  <BarcodeScanner
                          visible={scannerVisible}
                          onClose={() => setScannerVisible(false)}
                          onScan={(barcode) => {
                            setSearch(barcode);
                          }}
                        />
                </View>
    )
}

export default SearchProducts

const styles = StyleSheet.create({
  filtersContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom:10,
  },

searchInput: {
  flex: 1,
  padding: 12,
  borderRadius: 12,
},

clearBtn: {
  marginLeft: 8,
  padding: 10,
  borderRadius: 10,
  backgroundColor: "#F4E1D2",
},

clearText: {
  color: "#FF6B6B",
  fontWeight: "bold",
},

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E8B8B",
  },
});