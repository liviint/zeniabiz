import { useLocalSearchParams } from "expo-router"
import AddEdit from "../../../../../src/components/transactions/AddEdit"

export default function FinanceAddPage() {
    let { id } = useLocalSearchParams()
    return <AddEdit id={id} />
}