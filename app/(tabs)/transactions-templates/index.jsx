import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter } from "expo-router";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { BodyText, Card, SecondaryText } from "../../../src/components/ThemeProvider/components";
import { getTransactionTemplates } from "../../../src/db/transactionsTempsDb";
import { useIsFocused } from "@react-navigation/native";
import EmptyState from "../../../src/components/common/EmptyState";
import { AddButton } from "../../../src/components/common/AddButton";

export default function TransactionTemplatesListScreen() {
  const isFocused = useIsFocused()
  const {globalStyles} = useThemeStyles()
  const db = useSQLiteContext();
  const router = useRouter()

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    setLoading(true);

    const result = await getTransactionTemplates(db)

    setTemplates(result);
    setLoading(false);
    
  };

  useEffect(() => {
    loadTemplates();
  }, [isFocused]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push(`transactions-templates/${item.uuid}`)
      }
    >
      <Card>
        <View style={styles.row}>
          <BodyText style={styles.title}>{item.title}</BodyText>

          <SecondaryText
            style={[
              styles.amount,
              item.type === "income"
                ? styles.incomeAmount
                : styles.expenseAmount,
            ]}
          >
            {item.type === "income" ? "+" : "-"} KES {item.amount}
          </SecondaryText>
        </View>

        <View style={styles.metaRow}>
          <SecondaryText style={styles.category}>
            {item.category || "Uncategorized"}
          </SecondaryText>

          <Text style={styles.typeBadge}>
            {item.type.toUpperCase()}
          </Text>
        </View>

        {item.note ? (
          <Text style={styles.note} numberOfLines={1}>
            {item.note}
          </Text>
        ) : null}
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={globalStyles.container}>
      <BodyText style={globalStyles.title}>My Templates</BodyText>
      {
        !loading && templates.length === 0 ? 
        <EmptyState
          title="No Templates Yet."
          description="Create transaction templates to quickly reuse transactions."
        /> : 

        <FlatList
          data={templates}
          keyExtractor={(item) => item.uuid}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={loadTemplates}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      }
      <AddButton  
        primaryAction={{route:"/transactions-templates/add",label:"Add Template"}}
      />
    </View>
  );
}

const styles = StyleSheet.create({

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },


  amount: {
    fontSize: 15,
    fontWeight: "700",
  },

  incomeAmount: {
    color: "#2E8B8B",
  },

  expenseAmount: {
    color: "#FF6B6B",
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  category: {
    fontSize: 13,
  },

  typeBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    backgroundColor: "#333",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },

  note: {
    marginTop: 6,
    fontSize: 12,
    color: "#888",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#FAF9F7",
  },

});
