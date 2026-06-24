import { useState, useEffect } from "react";
import {
  ScrollView,
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
import RolesAndPermissions from "../../../src/components/business/rolesAndPermissions";
import { canViewReports, isLoggedIn } from "../../../src/utils/rolesAndPermissions"
import { useIsFocused } from "@react-navigation/native";

const BusinessPage = () => {

  const isFocused = useIsFocused()

  const { globalStyles } = useThemeStyles();
  const [inviteModal, setInviteModal] = useState(false);
  const [refreshData, setRefreshData] = useState(0);
  const [editBusiness,setEditBusiness] = useState(false)
  const [businessData,setBusinessData] = useState(null)

  const [isAllowedToViewReports,setIsAllowedToViewReport] = useState(canViewReports())
  const [isUserLoggedIn,setIsUserLoggedIn] = useState(isLoggedIn())

  useEffect(() => {
    setIsUserLoggedIn(isLoggedIn())
    setIsAllowedToViewReport(canViewReports())
  },[isFocused])

  return (
    <ScrollView style={globalStyles.container}>
      <BodyText style={globalStyles.title}>Business Profile</BodyText>

      <BusinessOverview 
        setEditBusiness={setEditBusiness}
        setBusinessData={setBusinessData}
        refreshData={refreshData}
        isAllowedToViewReports ={isAllowedToViewReports }
        isUserLoggedIn={isUserLoggedIn}
      />

      {isAllowedToViewReports && isUserLoggedIn  && 
        <CompanyMembers 
          setInviteModal={setInviteModal}
        />
      }

      {isAllowedToViewReports && isUserLoggedIn  && 
        <InvitedMembers 
          refreshData={refreshData}
      />}

      {isAllowedToViewReports && isUserLoggedIn   && 
        <RolesAndPermissions />
      }

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

    </ScrollView>
  );
};

export default BusinessPage;


