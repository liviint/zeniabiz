import { useEffect, useState } from "react";
import { View, Text, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { BodyText, Card,  SecondaryText } from "../../../../src/components/ThemeProvider/components";
import PageLoader from "../../../../src/components/common/PageLoader"
import { getTransactionTemplateByUuid, deleteTransactionTemplate,  } from "../../../../src/db/transactionsTempsDb";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import DeleteButton from "../../../../src/components/common/DeleteButton"
import { useIsFocused } from "@react-navigation/native";
import { dateFormat } from "../../../../utils/dateFormat";

export default function TransactionTemplateDetailsScreen() {
  const {globalStyles} = useThemeStyles()
  const isFocused = useIsFocused()
  const {id:uuid} = useLocalSearchParams()
  const db = useSQLiteContext();
  const router = useRouter()

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTemplate = async () => {
    setLoading(true);

    const result = await getTransactionTemplateByUuid(db, uuid);

    setTemplate(result);
    setLoading(false);
  };

  useEffect(() => {
    loadTemplate();
  }, [isFocused]);

  const handleDelete = async() => {
    await deleteTransactionTemplate(db, uuid);
    Alert.alert("Deleted ✅", "Template removed successfully.");
    router.back();
  };

  const handleEdit = () => {
    router.push(`transactions-templates/${uuid}/edit`)
  };

  if (loading) {
    return <PageLoader />
  }

  if (!template) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Template not found.
        </Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <BodyText style={globalStyles.title}>{template.title}</BodyText>

      <Text
        style={[
          styles.amount,
          template.type === "income"
            ? styles.income
            : styles.expense,
        ]}
      >
        {template.type === "income" ? "+" : "-"} KES{" "}
        {template.amount || "—"}
      </Text>

      <Card style={styles.card}>
        <DetailRow label="Type" value={template.type} />
        <DetailRow
          label="Category"
          value={template.category || "Uncategorized"}
        />
        <DetailRow
          label="Payee"
          value={template.payee || "—"}
        />
        <DetailRow
          label="Note"
          value={template.note || "—"}
        />
        <DetailRow
          label="Created"
          value={dateFormat(template.created_at)}
        />
      </Card>

      <View style={{ marginTop: 20 }}> 
        <TouchableOpacity style={{...globalStyles.editBtn, marginBottom:12}} onPress={handleEdit}>
            <BodyText style={globalStyles.editBtnText}>
              Edit Template
            </BodyText>
          </TouchableOpacity>
          <DeleteButton 
            handleOk={handleDelete} 
            item="template"
          />
      </View>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <SecondaryText style={styles.label}>{label}</SecondaryText>
      <BodyText style={styles.value}>{value}</BodyText>
    </View>
  );
}

const styles = StyleSheet.create({

  amount: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },

  income: {
    color: "#2E8B8B",
  },

  expense: {
    color: "#FF6B6B",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
  },

  value: {
    fontSize: 13,
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    fontSize: 16,
    color: "#FF6B6B",
  },
});
