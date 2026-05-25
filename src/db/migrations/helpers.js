export const addColumnIfNotExists = async (
    db,
    table,
    columnName,
    columnDefinition
) => {
    try {
        const result = await db.getAllAsync(`PRAGMA table_info(${table});`);

        const columnExists = result.some((col) => col.name === columnName);

        if (!columnExists) {
            await db.execAsync(`
                ALTER TABLE ${table}
                ADD COLUMN ${columnName} ${columnDefinition};
            `);
        } 
    } catch (error) {
        console.error(
            `Failed adding column '${columnName}' to '${table}':`,
            error
        );

        throw error;
    }
};