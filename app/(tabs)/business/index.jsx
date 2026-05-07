import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import { BodyText } from "../../../src/components/ThemeProvider/components";
import { api } from "../../../api";
import { Picker } from "@react-native-picker/picker";

const BusinessPage = () => {
  const db = useSQLiteContext();
  const { globalStyles } = useThemeStyles();

  const [company, setCompany] = useState(null);
  const [members, setMembers] = useState([]);
  const [inviteModal, setInviteModal] = useState(false);
  const initialinviteFormData = { email:"",role:"Staff"}
  const [inviteFormData,setinviteFormData] = useState(initialinviteFormData)
  const [roleDropDownOpen, setroleDropDownOpen] = useState(false);

  // --- fetch company + members ---
  const loadBusinessData = async () => {
    try {
      const companyRes = await db.getFirstAsync(
        "SELECT * FROM companies LIMIT 1"
      );
      setCompany(companyRes);

      const membersRes = await db.getAllAsync(
        "SELECT * FROM company_members WHERE company = ? AND deleted_at IS NULL",
        [companyRes?.uuid]
      );
      setMembers(membersRes);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadBusinessData();
  }, []);

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
      <BodyText style={globalStyles.title}>My Business</BodyText>

      <View style={styles.card}>
        <BodyText style={styles.sectionTitle}>Members</BodyText>

        <FlatList
          data={members}
          keyExtractor={(item) => item.uuid}
          renderItem={({ item }) => (
            <View style={styles.memberRow}>
              <Text style={styles.memberText}>{item.user_id}</Text>
              <Text style={styles.role}>{item.role}</Text>
            </View>
          )}
        />

        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={() => setInviteModal(true)}
        >
          <Text style={styles.inviteText}>+ Invite Member</Text>
        </TouchableOpacity>
      </View>

      {/* INVITE MODAL */}
      <Modal visible={inviteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <BodyText style={styles.sectionTitle}>Invite User</BodyText>

            {/* Email */}
            <TextInput
              placeholder="Email address"
              value={inviteFormData.email}
              onChangeText={(val) => setinviteFormData(prev => ({...prev,email:val}))}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {/* Role */}
            <BodyText style={{ marginTop: 10, marginBottom: 5 }}>
              Select Role
            </BodyText>

            <Picker
              selectedValue={inviteFormData.role}
              onValueChange={(value) =>
                setinviteFormData(prev => ({ ...prev, role: value }))
              }
            >
              <Picker.Item label="Staff" value="staff" />
              <Picker.Item label="Manager" value="manager" />
            </Picker>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setInviteModal(false)}
                style={styles.cancelBtn}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleInvite}
                style={styles.sendBtn}
              >
                <Text style={{ color: "#fff" }}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
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

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
    backgroundColor: "#fff",
    padding: 20,
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