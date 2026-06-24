import { StyleSheet, View } from "react-native";
import { BodyText, Card } from "../../ThemeProvider/components";

const RoleItem = ({ name, description }) => (
  <View style={styles.roleItem}>
    <BodyText style={styles.roleName}>
      {name}
    </BodyText>

    <BodyText style={styles.roleDescription}>
      {description}
    </BodyText>
  </View>
);

const RolesAndPermissions = () => {
  return (
    <Card>
      <BodyText style={styles.sectionTitle}>
        Roles & Permissions
      </BodyText>

      <RoleItem
        name="Owner"
        description="Full access to all business data and settings."
      />

      <RoleItem
        name="Manager"
        description="Manage inventory, sales, customers, expenses, and view reports."
      />

      <RoleItem
        name="Staff"
        description="View and add products, services, customers, and create sales."
        />
    </Card>
  );
};

export default RolesAndPermissions;

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  roleItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  roleName: {
    fontWeight: "600",
    marginBottom: 4,
  },

  roleDescription: {
    opacity: 0.7,
  },
});