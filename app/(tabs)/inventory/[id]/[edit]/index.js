import { useLocalSearchParams } from "expo-router"
import AddEdit from "../../../../../src/components/inventory/AddEdit"

export default function FinanceAddPage() {
    let { id } = useLocalSearchParams()
    return <AddEdit id={id} />
}