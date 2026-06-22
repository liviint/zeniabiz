import { useIsFocused } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import { api } from "../../../api";
import InviteModal from "../../../src/components/business/inviteModal";
import CompanyMembers from "../../../src/components/business/companyMembers"
import InvitedMembers from "../../../src/components/business/invitedMembers"
import {
  BodyText,
} from "../../../src/components/ThemeProvider/components";
import { getActiveContextSync } from "../../../src/db/utils";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";

const BusinessPage = () => {
  const db = useSQLiteContext();
  const { globalStyles } = useThemeStyles();
  const isFocused = useIsFocused();

  const [company, setCompany] = useState(null);
  const [inviteModal, setInviteModal] = useState(false);
  const [refreshData, setRefreshData] = useState(0);

  const loadBusinessData = async () => {
    const { company } = await getActiveContextSync(db);
    try {
      const companyRes = await api.get(`/core/companies/${company}`);
      setCompany(companyRes.data);

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
    <View style={[globalStyles.container, styles.container]}>
      <BodyText style={globalStyles.title}>{company?.name}</BodyText>

      <CompanyMembers 
        setInviteModal={setInviteModal}
      />

      <InvitedMembers 
        setRefreshData={setRefreshData}
      />

      <InviteModal
        inviteModal={inviteModal}
        setInviteModal={setInviteModal}
        setRefreshData={setRefreshData}
      />
    </View>
  );
};

export default BusinessPage;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
