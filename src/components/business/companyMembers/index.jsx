import { useIsFocused } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../../../../api";
import { getActiveContextSync } from "../../../db/utils";
import { BodyText, Card } from "../../ThemeProvider/components";

const BusinessPage = ({ setInviteModal }) => {
  const db = useSQLiteContext();
  const isFocused = useIsFocused();
  const [members, setMembers] = useState([]);
  const [isOwner, setIsOwner] = useState(false);

  const loadBusinessData = async () => {
    const { user_id } = await getActiveContextSync(db);
    try {
      const membersRes = await api.get(`/core/company-members`);
      setMembers(membersRes.data.results);
      let owners = membersRes.data.results.filter(
        (member) => member.role === "owner",
      );
      let ownerObj = owners.find((owner) => owner.user.uuid === user_id);
      setIsOwner(!!ownerObj);
    } catch (err) {
      console.log(
        "Failed to load business data:",
        err?.response?.data || err.message,
      );
    }
  };

  useEffect(() => {
    loadBusinessData();
  }, [isFocused]);

  return (
    <Card>
      <BodyText style={styles.sectionTitle}>Company Members</BodyText>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <BodyText style={styles.memberText}>
              {item?.user?.username}
            </BodyText>
            <BodyText style={styles.role}>{item.role}</BodyText>
          </View>
        )}
      />

      {isOwner ? (
        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={() => setInviteModal(true)}
        >
          <Text style={styles.inviteText}>+ Invite Member</Text>
        </TouchableOpacity>
      ) : (
        ""
      )}
    </Card>
  );
};

export default BusinessPage;

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
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

  inviteBtn: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#2E8B8B",
    borderRadius: 8,
    alignItems: "center",
  },

  inviteText: {
    color: "#fff",
    fontWeight: "600",
  },
});
