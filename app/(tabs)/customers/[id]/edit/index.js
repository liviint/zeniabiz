import { useLocalSearchParams } from "expo-router";
import AddEdit from "../../../../../src/components/customers/AddEdit";

export default function FinanceAddPage() {
    let { id } = useLocalSearchParams();
    return <AddEdit id={id} />;
}
