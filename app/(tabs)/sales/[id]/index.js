import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import { useSQLiteContext } from "expo-sqlite";

import {
  BodyText,
  Card,
  SecondaryText,
} from "../../../../src/components/ThemeProvider/components";

import {
  getSaleById,
  getSaleItems,
  deleteSale,
} from "../../../../src/db/query/sales";

import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";

import DeleteButton from "../../../../src/components/common/DeleteButton";

import { dateFormat } from "../../../../utils/dateFormat";

export default function SaleDetails() {
  const { globalStyles } = useThemeStyles();

  const isFocused = useIsFocused();

  const db = useSQLiteContext();

  const router = useRouter();

  const { id: sale_id } = useLocalSearchParams();

  const [sale, setSale] = useState({});

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!sale_id) return;

    (async () => {
      const s = await getSaleById(db, sale_id);
      setSale(s);

      const i = await getSaleItems(db, sale_id);

      setItems(i);
    })();
  }, [sale_id, isFocused]);

  const handleDelete = async () => {
    await deleteSale(db, sale_id);

    router.back();
  };

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
          <BodyText style={globalStyles.title}>
            Sale Details
          </BodyText>

          <SecondaryText>
            {dateFormat(sale?.date)}
          </SecondaryText>
        </View>
      <ScrollView        
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <SecondaryText>Marked Price</SecondaryText>

            <BodyText style={styles.totalAmount}>
              {Number(
                sale?.amount || 0
              ).toLocaleString()}
            </BodyText>
          </View>

          <View style={styles.summaryRow}>
            <SecondaryText>Amount Paid</SecondaryText>

            <BodyText style={styles.paid}>
              {Number(
                sale?.amount_paid || 0
              ).toLocaleString()}
            </BodyText>
          </View>

          <View style={styles.summaryRow}>
            <SecondaryText>Balance</SecondaryText>

            <BodyText style={styles.balance}>
              {Number(
                sale?.balance_due || 0
              ).toLocaleString()}
            </BodyText>
          </View>

          {!!sale?.discount && (
            <View style={styles.summaryRow}>
              <SecondaryText>Discount</SecondaryText>

              <BodyText style={styles.discount}>
                {Number(
                  sale?.discount || 0
                ).toLocaleString()}
              </BodyText>
            </View>
          )}

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,

                sale?.payment_status === "PAID"
                  ? styles.paidBadge
                  : sale?.payment_status === "PARTIAL"
                  ? styles.partialBadge
                  : styles.unpaidBadge,
              ]}
            >
              <Text style={styles.statusText}>
                {sale?.payment_status}
              </Text>
            </View>
          </View>
        </Card>

        {/* Items */}
        <View style={styles.sectionHeader}>
          <BodyText style={styles.sectionTitle}>
            Items
          </BodyText>

          <SecondaryText>
            {items.length} item
            {items.length !== 1 ? "s" : ""}
          </SecondaryText>
        </View>

        {items.map((item) => {
          const total =
            Number(item.quantity || 0) *
            Number(item.price || 0);

          return (
            <Card
              key={item.id}
              style={styles.itemCard}
            >
              <View style={styles.itemTop}>
                <BodyText
                  style={styles.itemName}
                  numberOfLines={2}
                >
                  {item.name}
                </BodyText>

                <BodyText style={styles.itemTotal}>
                  {total.toLocaleString()}
                </BodyText>
              </View>

              <SecondaryText>
                {item.quantity} × {" "}
                {Number(item.price).toLocaleString()}
              </SecondaryText>
            </Card>
          );
        })}

        {/* Notes */}
        {!!sale?.note && (
          <Card style={styles.noteCard}>
            <BodyText style={styles.noteTitle}>
              Note
            </BodyText>

            <SecondaryText>
              {sale.note}
            </SecondaryText>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() =>
              router.push(`/sales/${sale_id}/edit`)
            }
            style={globalStyles.editBtn}
          >
            <Text style={globalStyles.editBtnText}>
              Edit Sale
            </Text>
          </TouchableOpacity>

          <DeleteButton
            handleOk={handleDelete}
            item="sale"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
  },

  header: {
    marginBottom: 16,
  },

  summaryCard: {
    marginBottom: 20,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    alignItems: "center",
  },

  totalAmount: {
    fontWeight: "800",
    fontSize: 24,
  },

  paid: {
    fontWeight: "700",
    color: "#2E8B8B",
  },

  balance: {
    fontWeight: "700",
    color: "#FF6B6B",
  },

  discount: {
    fontWeight: "700",
    color: "#F59E0B",
  },

  statusContainer: {
    marginTop: 10,
    alignItems: "flex-start",
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  paidBadge: {
    backgroundColor: "#DCFCE7",
  },

  partialBadge: {
    backgroundColor: "#FEF3C7",
  },

  unpaidBadge: {
    backgroundColor: "#FEE2E2",
  },

  statusText: {
    fontWeight: "700",
    fontSize: 12,
  },

  sectionHeader: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontWeight: "700",
    fontSize: 18,
  },

  itemCard: {
    marginBottom: 12,
  },

  itemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 6,
  },

  itemName: {
    flex: 1,
    fontWeight: "600",
  },

  itemTotal: {
    fontWeight: "700",
  },

  noteCard: {
    marginTop: 12,
  },

  noteTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },

  actions: {
    gap: 12,
    marginTop: 24,
  },
});