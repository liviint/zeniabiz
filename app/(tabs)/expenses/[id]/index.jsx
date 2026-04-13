import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import DeleteButton from "../../../../src/components/common/DeleteButton";
import {
    BodyText,
    Card,
    SecondaryText,
} from "../../../../src/components/ThemeProvider/components";
import {
    deleteTransaction,
    getTransactionById,
} from "../../../../src/db/transactionsDb";
import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";
import { dateFormat } from "../../../../utils/dateFormat";

export default function FinanceEntryViewPage() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { globalStyles } = useThemeStyles();
  const { id: uuid } = useLocalSearchParams();
  const [transaction, setTransaction] = useState(0);
  const [isExpense, setIsExpense] = useState(transaction.amount < 0);

  const handleDelete = async () => {
    try {
      await deleteTransaction(db, uuid);
      Alert.alert("Removed", "This transaction has been deleted.");
      router.push("/expenses");
    } catch (error) {
      console.log(error, "hello error");
    }
  };

  useEffect(() => {
    if (!uuid) return;
    let getTransaction = async () => {
      let transaction = await getTransactionById(db, uuid);
      console.log(transaction, "hello transa");
      setTransaction(transaction);
      setIsExpense(transaction.type === "expense");
    };
    getTransaction();
  }, []);

  return (
    <View style={globalStyles.container}>
      <BodyText style={globalStyles.title}>Transaction Details</BodyText>

      <Card style={styles.amountCard}>
        <SecondaryText style={styles.amountLabel}>
          {isExpense ? "Expense" : "Income"}
        </SecondaryText>
        <BodyText
          style={[styles.amount, isExpense ? styles.expense : styles.income]}
        >
          {isExpense ? "-" : "+"}KE{" "}
          {Math.abs(transaction.amount).toLocaleString()}
        </BodyText>
      </Card>

      <Card style={styles.detailsCard}>
        <DetailRow label="Title" value={transaction.title} />
        <DetailRow label="Category" value={transaction.category} />
        {transaction.payee ? (
          <DetailRow label="Payee" value={transaction.payee} />
        ) : (
          ""
        )}
        <DetailRow label="Date" value={dateFormat(transaction.date)} />

        {transaction.note ? (
          <View style={styles.noteBox}>
            <SecondaryText style={styles.noteLabel}>Note</SecondaryText>
            <BodyText style={styles.noteText}>{transaction.note}</BodyText>
          </View>
        ) : null}
      </Card>

      <View style={styles.actionsRow}>
        <Pressable
          style={globalStyles.editBtn}
          onPress={() => router.push(`expenses/${uuid}/edit`)}
        >
          <Text style={globalStyles.editBtnText}>Edit</Text>
        </Pressable>
        <DeleteButton
          handleOk={handleDelete}
          item={"transaction"}
          cusomStyles={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <SecondaryText style={styles.detailLabel}>{label}</SecondaryText>
      <BodyText style={styles.detailValue}>{value}</BodyText>
    </View>
  );
}

const styles = StyleSheet.create({
  amountCard: {
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  amount: {
    fontSize: 28,
    fontWeight: "700",
  },
  income: {
    color: "#2E8B8B",
  },
  expense: {
    color: "#FF6B6B",
  },
  detailsCard: {
    padding: 16,
    borderRadius: 16,
  },
  detailRow: {
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  noteBox: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  noteLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  deleteText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
