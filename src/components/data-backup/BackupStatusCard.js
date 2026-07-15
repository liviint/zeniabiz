import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Text
} from "react-native";

import {
  Card,
  BodyText,
  SecondaryText,
} from "@/src/components/ThemeProvider/components";

import { dateFormat } from "@/src/utils/dateFormat";
import { useThemeStyles } from "../../hooks/useThemeStyles";

const BackupStatusCard = ({
  icon = "☁️",
  title,
  connected,
  account,
  lastBackup,
  connectedText = "Connected",
  disconnectedText = "Not Connected",
  onPress,
  description="",
  recommendation=""
}) => {
    const {globalStyles} = useThemeStyles()
  return (
    <Card>
      <Pressable style={styles.container} onPress={onPress}>
        <View style={styles.iconContainer}>
          <BodyText style={styles.icon}>{icon}</BodyText>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <BodyText style={styles.title}>
              {title}
            </BodyText>

            <View
              style={globalStyles.badge}
            >
              <SecondaryText style={globalStyles.badgeText}>
                {connected
                  ? connectedText
                  : disconnectedText}
              </SecondaryText>
            </View>
          </View>

          {connected ? (
            <>
              <SecondaryText style={styles.email}>
                {account}
              </SecondaryText>

              <SecondaryText style={styles.meta}>
                Last Backup:{" "}
                {lastBackup
                  ? dateFormat(lastBackup, true)
                  : "Never"}
              </SecondaryText>
            </>
          ) : (
            <SecondaryText style={styles.description}>
              {description}
            </SecondaryText>
          )}
          <Text style={styles.recommendation}>
            {recommendation}
            </Text>
        </View>

        <BodyText style={styles.arrow}>›</BodyText>
      </Pressable>
    </Card>
  );
};

export default BackupStatusCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2E8B8B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  icon: {
    fontSize: 24,
  },

  content: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  recommendation: {
    marginTop: 8,
    color: "#2E8B8B",
    fontWeight: "600",
    fontSize: 13,
},

  email: {
    fontSize: 13,
    marginBottom: 4,
  },

  meta: {
    fontSize: 12,
  },

  description: {
    fontSize: 13,
    lineHeight: 20,
  },

  arrow: {
    fontSize: 24,
    marginLeft: 12,
  },
});