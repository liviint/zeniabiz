import { useIsFocused } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { api } from "../../../../api";
import {
    BodyText,
    Card,
} from "../../../../src/components/ThemeProvider/components";

const InvitedMembers = ({ refreshData }) => {
  const isFocused = useIsFocused();

  const [invites, setInvites] = useState([]);

  const loadBusinessData = async () => {
    try {
      const invitesRes = await api.get(`/core/company-invites`);
      setInvites(invitesRes.data.results);
    } catch (err) {
      console.log(
        "Failed to load business data:",
        err?.response?.data || err.message,
      );
    }
  };

  useEffect(() => {
    loadBusinessData();
  }, [isFocused, refreshData]);

  return (
    <Card>
      <BodyText style={styles.sectionTitle}>Invited Members</BodyText>
      {invites.map((item) => (
        <View key={item.id} style={styles.memberRow}>
          <BodyText style={styles.memberText}>{item?.email}</BodyText>

          <BodyText style={styles.role}>{item.role}</BodyText>
        </View>
      ))}
    </Card>
  );
};

export default InvitedMembers;

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  memberText: {
    fontSize: 14,
  },

  role: {
    fontSize: 12,
    opacity: 0.6,
  },
});
