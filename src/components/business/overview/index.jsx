import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity
} from "react-native";
import {
  BodyText,
} from "../../ThemeProvider/components";
import { getActiveContextSync } from "../../../db/utils";
import { useSQLiteContext } from "expo-sqlite";
import { api } from "../../../../api";
import { dateFormat } from "../../../utils/dateFormat";
import { useThemeStyles } from "../../../hooks/useThemeStyles";
import { getCompany , upsertCompany} from "../../../db/query/companies"

const BusinessOverview = ({
  setEditBusiness,
  setBusinessData,
  refreshData,
  isAllowedToViewReports 
}) => {

  const db = useSQLiteContext();
  const isFocused = useIsFocused();
  const { globalStyles } = useThemeStyles()

  const [company, setCompany] = useState(null);

  const loadBusinessData = async () => {
    const { company: companyId } = await getActiveContextSync(db);

    const localCompany = await getCompany(db, companyId);
    if (localCompany) {
      setCompany(localCompany);
      setBusinessData(localCompany);
    }

    try {
      const companyRes = await api.get(
        `/core/companies/${companyId}`
      );

      const companyData = companyRes.data;
      await upsertCompany(db, companyData);

      setCompany(companyData);
      setBusinessData(companyData);

    } catch (err) {
      console.log(
        "Failed to load company from API:",
        err?.response?.data || err.message
      );
    }
};

  const handleEdit = () => {
    setEditBusiness(true)
  }

  useEffect(() => {
    loadBusinessData();
  }, [isFocused,refreshData]);

  return (
  <View style={styles.overviewCard}>

    <View style={styles.header}>
      <BodyText style={styles.title}>Business Overview</BodyText>

      {isAllowedToViewReports  && 
        <TouchableOpacity style={globalStyles.editBtn} onPress={handleEdit}>
          <BodyText style={styles.editBtnText}>Edit</BodyText>
        </TouchableOpacity>
      }

    </View>

    <View style={styles.row}>
      <BodyText>Name</BodyText>
      <BodyText>{company?.name}</BodyText>
    </View>

    <View style={styles.row}>
      <BodyText>Currency</BodyText>
      <BodyText>{company?.currency}</BodyText>
    </View>

    <View style={styles.row}>
      <BodyText>Created</BodyText>
      <BodyText>{dateFormat(company?.created_at)}</BodyText>
    </View>

  </View>
);
};

export default BusinessOverview;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  overviewCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
});
