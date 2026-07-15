import { SQLiteProvider } from "expo-sqlite";
import SessionProvider from "./SessionProvider"
import SyncProvider from "./SyncProvider"
import GoogleBackUpProvider from "./GoogleBackUpProvider"
import { 
  applyInventoryMigrationsV1 ,
  applyInventoryBatchesMigrationsV1,
  applyInventoryMovementsMigrationsV1,
  migrateMovementsToBatches,
  applyExpansionOfProductsToServices,
  applyAddBarCodeToProducts,
} from "../../db/migrations/inventory"
import { addFieledsToCompaniesTable_22_06_2026 } from "../../db/migrations/companies"
import {migrateSalesCreditFieldsV1, migratePaymentsFromSalesV1} from "../../db/migrations/credit"
import { applySalesMigrationsV1, applySalesMigrationsV2 } from "../../db/migrations/sales"
import { applySyncMigrationsV1, rebuildSyncQueue } from "../../db/migrations/sync"
import { addFieledsToAppSession_15_07_2026 } from "../../db/migrations/session";
import { getSetting, setSetting } from "@/src/db/query/settings";

import {
  createCompaniesTables,
  createUsersTables,
  createSessionTables,
  createExpensesTables,
  createInventoryTables,
  createSalesTables,
  createPaymentsTables,
  createCustomerTables,
  createSettingsTables,
  createSyncTables,
  createSuppliersTables,
} from "../../db/schema"

const migrateDbIfNeeded = async (db) => {
  let currentVersion = Number((await getSetting(db, "db_version")) || 0);

    await db.execAsync(`PRAGMA journal_mode = WAL;`);

    //CORE
    await createCompaniesTables(db)
    await createUsersTables(db)
    await createSessionTables(db)
    await createSettingsTables(db)

    //BUSINESS
    await createExpensesTables(db)
    await createInventoryTables(db)
    await createSalesTables(db)
    await createPaymentsTables(db)
    await createCustomerTables(db)
    await createSuppliersTables(db)

    //INFRA
    await createSyncTables(db)


  if(currentVersion < 1){
    await applyInventoryMigrationsV1(db);
    await migrateSalesCreditFieldsV1(db);
    await migratePaymentsFromSalesV1(db);

    currentVersion = 1;
    await setSetting(db, "db_version", currentVersion);
  }
  if(currentVersion < 2){
    await applyInventoryBatchesMigrationsV1(db);
    await applySalesMigrationsV1(db);
    await applyInventoryMovementsMigrationsV1(db);
    await migrateMovementsToBatches(db)

    currentVersion = 2;
    await setSetting(db, "db_version", currentVersion);
  }

  if(currentVersion < 3){
    await applyExpansionOfProductsToServices(db);

    currentVersion = 3;
    await setSetting(db, "db_version", currentVersion);
  }

  if(currentVersion < 4){
    await applySyncMigrationsV1(db);

    currentVersion = 4;
    await setSetting(db, "db_version", currentVersion);
  }

  if(currentVersion < 5){
    await rebuildSyncQueue(db);

    currentVersion = 5;
    await setSetting(db, "db_version", currentVersion);
  }

  if(currentVersion < 6){
    await applySalesMigrationsV2(db);
    currentVersion = 6;
    await setSetting(db, "db_version", currentVersion);
  }

  if(currentVersion < 7){
    await applyAddBarCodeToProducts(db);
    currentVersion = 7;
    await setSetting(db, "db_version", currentVersion);
  }

  //
  if(currentVersion < 8){
    await addFieledsToCompaniesTable_22_06_2026(db);
    currentVersion = 8;
    await setSetting(db, "db_version", currentVersion);
  }

  if(currentVersion < 9){
    await addFieledsToAppSession_15_07_2026(db);
    currentVersion = 9;
    await setSetting(db, "db_version", currentVersion);
  }

}

export default function AppDataProvider({ children }) {
  return (
    <SQLiteProvider databaseName="zeniabiz.db" onInit={migrateDbIfNeeded}>
      <SessionProvider>
        <SyncProvider>
          <GoogleBackUpProvider>
            {children}
          </GoogleBackUpProvider>
        </SyncProvider>
      </SessionProvider>
    </SQLiteProvider>
  );
}
