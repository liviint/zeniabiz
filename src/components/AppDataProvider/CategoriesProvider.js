import { useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { seedCategoriesIfEmpty,syncDefaultCategories } from "../../db/categoriesDb";

export default function CategoriesProvder() {
    const db = useSQLiteContext();

    useEffect(() => {
        (async () => {
        await seedCategoriesIfEmpty(db);
        await syncDefaultCategories(db);
        })();
    }, []);

    return "";
}