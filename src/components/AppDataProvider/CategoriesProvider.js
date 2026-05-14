import { useEffect } from "react";
import { useSelector} from "react-redux";
import { useSQLiteContext } from "expo-sqlite";
import { seedCategoriesIfEmpty } from "../../db/categoriesDb";

export default function CategoriesProvder() {
    const db = useSQLiteContext();
    const user = useSelector((state) => state.user.userDetails);

    useEffect(() => {
        (async () => {
        await seedCategoriesIfEmpty(db);
        })();
    }, [user]);

    return "";
}