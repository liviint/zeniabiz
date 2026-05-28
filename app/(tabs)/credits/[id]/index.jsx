import { useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import {
  BodyText,
  Card,
  SecondaryText,
} from "../../../../src/components/ThemeProvider/components";

import EmptyState from "../../../../src/components/common/EmptyState";

import { useThemeStyles } from "../../../../src/hooks/useThemeStyles";

import { dateFormat } from "../../../../utils/dateFormat";

import { getCreditById } from "../../../../src/db/creditsDb";
import { CreditActionsCard } from "../../../../src/components/credit/CreditActionsCard";

export default function CreditDetailPage() {
  const db = useSQLiteContext();

  const { id } = useLocalSearchParams();

  const { globalStyles } = useThemeStyles();

  const [credit, setCredit] = useState(null);

  const loadCredit = async () => {
    const data = await getCreditById(db, id);
    setCredit(data);
  };

  useEffect(() => {
    loadCredit();
  }, [id]);

  if (!credit) {
    return (
      <View style={globalStyles.container}>
        <EmptyState
          title="Credit not found"
          description="This credit record may have been deleted."
        />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>

      <BodyText style={globalStyles.title}>
          Customer Credit
      </BodyText>

      <ScrollView
        style={globalStyles.container}
        contentContainerStyle={styles.content}
      >
      {/* Customer */}
      <Card style={styles.card}>
        <SecondaryText style={styles.label}>
          Customer
        </SecondaryText>

        <BodyText style={styles.value}>
          {credit.customer_name || "Walk-in Customer"}
        </BodyText>

        {!!credit.phone && (
          <SecondaryText style={styles.subValue}>
            {credit.phone}
          </SecondaryText>
        )}
      </Card>

      {/* Sale Info */}
      <Card style={styles.card}>
        <SecondaryText style={styles.label}>
          Sale
        </SecondaryText>

        <BodyText style={styles.value}>
          {credit.title}
        </BodyText>

        {!!credit.note && (
          <SecondaryText style={styles.subValue}>
            {credit.note}
          </SecondaryText>
        )}
      </Card>

      {/* Financial Summary */}
      <Card style={styles.card}>
        <SecondaryText style={styles.label}>
          Outstanding Balance
        </SecondaryText>

        <BodyText style={styles.balance}>
          {Math.abs(credit.balance_due || 0).toLocaleString()}
        </BodyText>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <SecondaryText style={styles.summaryLabel}>
              Total
            </SecondaryText>

            <BodyText style={styles.summaryValue}>
              {Math.abs(
                credit.total_amount || 0
              ).toLocaleString()}
            </BodyText>
          </View>

          <View style={styles.summaryItem}>
            <SecondaryText style={styles.summaryLabel}>
              Paid
            </SecondaryText>

            <BodyText style={styles.summaryValue}>
              {Math.abs(
                credit.amount_paid || 0
              ).toLocaleString()}
            </BodyText>
          </View>
        </View>
      </Card>

      {/* Payment Status */}
      <Card style={styles.card}>
        <SecondaryText style={styles.label}>
          Payment Status
        </SecondaryText>

        <BodyText
          style={[
            styles.status,
            credit.payment_status === "UNPAID"
              ? styles.unpaid
              : styles.partial,
          ]}
        >
          {credit.payment_status}
        </BodyText>
      </Card>

      {/* Dates */}
      <Card style={styles.card}>
        <SecondaryText style={styles.label}>
          Sale Date
        </SecondaryText>

        <BodyText style={styles.value}>
          {dateFormat(credit.date)}
        </BodyText>

        {!!credit.due_date && (
          <>
            <SecondaryText
              style={[styles.label, { marginTop: 16 }]}
            >
              Due Date
            </SecondaryText>

            <BodyText style={styles.value}>
              {dateFormat(credit.due_date)}
            </BodyText>
          </>
        )}
      </Card>

      <CreditActionsCard
          credit={credit}
          onAddPayment={() =>
            router.push(`/credits/${credit.id}/payment`)
          }
          onMarkPaid={async () => {
            await offsetCreditBalance(db, credit.id);

            loadCredit();
          }}
        />

      {/* Payments */}
      <Card style={styles.card}>
        <SecondaryText style={styles.label}>
          Payments
        </SecondaryText>

        {credit.payments?.length ? (
          credit.payments.map((payment) => (
            <View
              key={payment.id}
              style={styles.paymentRow}
            >
              <View style={{ flex: 1 }}>
                <BodyText style={styles.paymentAmount}>
                  {Math.abs(payment.amount).toLocaleString()}
                </BodyText>

                <SecondaryText
                  style={styles.paymentMeta}
                >
                  {payment.payment_method || "Cash"}
                  {" • "}
                  {dateFormat(payment.date)}
                </SecondaryText>
              </View>
            </View>
          ))
        ) : (
          <SecondaryText style={styles.emptyText}>
            No payments recorded yet.
          </SecondaryText>
        )}
      </Card>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 96,
  },

  card: {
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    marginBottom: 6,
  },

  value: {
    fontSize: 18,
    fontWeight: "600",
  },

  subValue: {
    marginTop: 4,
    fontSize: 13,
  },

  balance: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FF6B6B",
  },

  summaryRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 24,
  },

  summaryItem: {
    flex: 1,
  },

  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
  },

  status: {
    fontSize: 18,
    fontWeight: "700",
  },

  unpaid: {
    color: "#FF6B6B",
  },

  partial: {
    color: "#F59E0B",
  },

  paymentRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },

  paymentAmount: {
    fontWeight: "700",
  },

  paymentMeta: {
    fontSize: 12,
    marginTop: 4,
  },

  emptyText: {
    marginTop: 8,
  },
});