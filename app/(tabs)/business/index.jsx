import { useState } from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import InviteModal from "../../../src/components/business/inviteModal";
import CompanyMembers from "../../../src/components/business/companyMembers"
import InvitedMembers from "../../../src/components/business/invitedMembers"
import {
  BodyText,
} from "../../../src/components/ThemeProvider/components";
import { useThemeStyles } from "../../../src/hooks/useThemeStyles";
import BusinessOverview from "../../../src/components/business/overview";

const BusinessPage = () => {


  const { globalStyles } = useThemeStyles();
  const [inviteModal, setInviteModal] = useState(false);
  const [refreshData, setRefreshData] = useState(0);

  return (
    <View style={[globalStyles.container, styles.container]}>
      <BodyText style={globalStyles.title}>Business Overview</BodyText>

      <BusinessOverview />

      <CompanyMembers 
        setInviteModal={setInviteModal}
      />

      <InvitedMembers 
        refreshData={refreshData}
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
