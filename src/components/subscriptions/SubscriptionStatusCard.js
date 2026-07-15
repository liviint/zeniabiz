import React from "react";
import { StyleSheet, View } from "react-native";
import {
  Card,
  BodyText,
  SecondaryText,
} from "@/src/components/ThemeProvider/components";

const SubscriptionStatusCard = ({
  title,
  description,
  icon = "✓",
}) => {
  return (
    <Card style={styles.card}>
      <View style={styles.iconContainer}>
        <BodyText style={styles.icon}>{icon}</BodyText>
      </View>

      <BodyText style={styles.title}>
        {title}
      </BodyText>

      <SecondaryText style={styles.description}>
        {description}
      </SecondaryText>
    </Card>
  );
};

export default SubscriptionStatusCard;

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 20,
  },

  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    marginBottom: 16,
  },

  icon: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2E7D32",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  description: {
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
});