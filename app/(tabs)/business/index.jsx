import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { BodyText, Card, CustomPicker,Input, FormLabel } from "../../../src/components/ThemeProvider/components";
import { api } from "../../../api";
import { Picker } from "@react-native-picker/picker";
import { getActiveContextSync } from "../../../src/db/utils";
import { useIsFocused } from "@react-navigation/native";

const BusinessPage = () => {
  const db = useSQLiteContext();
  const { globalStyles } = useThemeStyles();
  const isFocused = useIsFocused()

  const [company, setCompany] = useState(null);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [inviteModal, setInviteModal] = useState(false);
  const initialinviteFormData = { email:"",role:"Staff"}
  const [inviteFormData,setinviteFormData] = useState(initialinviteFormData)


  // --- fetch company + members ---
  const loadBusinessData = async () => {
    const {company, user_id} =  await getActiveContextSync(db);
    try {
      // 1. COMPANY INFO
      const companyRes = await api.get(`/core/companies/${company}`);
      setCompany(companyRes.data);

      const membersRes = await api.get(`/core/company-members`);
      setMembers(membersRes.data.results);

      // // 3. COMPANY INVITES
      // const invitesRes = await api.get(`/core/company-invites/${company}`);
      // setInvites(invitesRes.data);

      console.log(membersRes.data.results,"hello invite data")

    } catch (err) {
      console.log("Failed to load business data:", err?.response?.data || err.message);
    }
  };

  useEffect(() => {
    loadBusinessData();
  }, [isFocused]);

  // --- invite (placeholder logic) ---
  const handleInvite = async () => {
    if (!inviteFormData.email) return;

    try {
      await api.post("/core/company-invites/", inviteFormData);
      setinviteFormData(initialinviteFormData)
      setInviteModal(false);

    } catch (err) {
      console.log("Invite error:", err?.response?.data || err.message);
    } 
};

  return (
    <View style={[globalStyles.container, styles.container]}>
      <BodyText style={globalStyles.title}>{company?.name}</BodyText>

      <Card >
        <BodyText style={styles.sectionTitle}>Company Members</BodyText>

        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.memberRow}>
              <BodyText style={styles.memberText}>{item.user_id}</BodyText>
              <BodyText style={styles.role}>{item.role}</BodyText>
            </View>
          )}
        />

        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={() => setInviteModal(true)}
        >
          <Text style={styles.inviteText}>+ Invite Member</Text>
        </TouchableOpacity>
      </Card>

      <Card >
        <BodyText style={styles.sectionTitle}>Invited Members</BodyText>

        <FlatList
          data={members}
          keyExtractor={(item) => item.uuid}
          renderItem={({ item }) => (
            <View style={styles.memberRow}>
              <BodyText style={styles.memberText}>{item.user_id}</BodyText>
              <BodyText style={styles.role}>{item.role}</BodyText>
            </View>
          )}
        />
      </Card>

      {/* INVITE MODAL */}
      <Modal visible={inviteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Card style={styles.modal}>
            <BodyText style={styles.sectionTitle}>Invite User</BodyText>

            <View style={globalStyles.formGroup}>
              <FormLabel >Email address</FormLabel>
              <Input
                value={inviteFormData.email}
                onChangeText={(val) => setinviteFormData(prev => ({...prev,email:val}))}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            

            <View style={globalStyles.formGroup}>
                <FormLabel >Select Role</FormLabel>
                <CustomPicker
                  selectedValue={inviteFormData.role}
                  onValueChange={(value) =>
                    setinviteFormData(prev => ({ ...prev, role: value }))
                  }
                >
                  <Picker.Item label="Staff" value="staff" />
                  <Picker.Item label="Manager" value="manager" />
                </CustomPicker>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setInviteModal(false)}
                style={globalStyles.secondaryBtn}
              >
                <Text style={globalStyles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleInvite}
                style={globalStyles.primaryBtn}
              >
                <Text style={globalStyles.primaryBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
};

export default BusinessPage;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },

  name: {
    fontSize: 18,
    fontWeight: "600",
  },

  meta: {
    marginTop: 6,
    opacity: 0.7,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    borderRadius: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 10,
  },

  cancelBtn: {
    padding: 10,
  },

  sendBtn: {
    backgroundColor: "#2E8B8B",
    padding: 10,
    borderRadius: 8,
  },
});