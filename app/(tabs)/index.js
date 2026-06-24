import { Redirect } from 'expo-router';
import { canViewReports } from "../../src/utils/rolesAndPermissions"

export default function Index() {

    const isAllowedToViewReports = canViewReports()

    return <Redirect href={isAllowedToViewReports ? "/dashboard" : "/sales"} />;
}
