import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import {
  BodyText,
} from "../../ThemeProvider/components";
import { getActiveContextSync } from "../../../db/utils";
import { useSQLiteContext } from "expo-sqlite";
import { api } from "../../../../api";
import { dateFormat } from "../../../utils/dateFormat";

const BusinessOverview = () => {

  const db = useSQLiteContext();
  const isFocused = useIsFocused();

  const [company, setCompany] = useState(null);


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
  }, [isFocused]);

  return (
    <View style={styles.overviewCard}>

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
        <BodyText>
          {dateFormat(company?.created_at)}
        </BodyText>
      </View>
</View>
  );
};

export default BusinessOverview;

const styles = StyleSheet.create({
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
