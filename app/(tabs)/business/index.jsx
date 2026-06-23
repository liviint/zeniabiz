import { useState } from "react";
import {
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
import EditBusinessModal from "../../../src/components/business/overview/edit";

const BusinessPage = () => {
  
  const { globalStyles } = useThemeStyles();
  const [inviteModal, setInviteModal] = useState(false);
  const [refreshData, setRefreshData] = useState(0);
  const [editBusiness,setEditBusiness] = useState(false)
  const [businessData,setBusinessData] = useState(null)

  return (
    <View style={globalStyles.container}>
      <BodyText style={globalStyles.title}>Business Overview</BodyText>

      <BusinessOverview 
        setEditBusiness={setEditBusiness}
        setBusinessData={setBusinessData}
        refreshData={refreshData}
      />

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

      <EditBusinessModal 
        visible={editBusiness}
        setVisible={setEditBusiness}
        businessData={businessData}
        setRefreshData={setRefreshData}
      />

    </View>
  );
};

export default BusinessPage;


