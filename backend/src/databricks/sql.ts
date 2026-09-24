import { DBSQLClient } from "@databricks/sql";
import { env } from "../config.js";

let client: DBSQLClient | null = null;
let session: Awaited<ReturnType<DBSQLClient["openSession"]>> | null = null;

async function getSession() {
  if (!client) {
    client = new DBSQLClient();

    await client.connect({
      host: env.DATABRICKS_SERVER_HOSTNAME,
      path: env.DATABRICKS_HTTP_PATH,
      token: env.DATABRICKS_TOKEN,
    });
  }

  if (!session) {
    session = await client.openSession();
  }

  return session;
}

export async function queryDatabricks<T extends Record<string, unknown>>(
  sql: string,
): Promise<T[]> {
  const extractSession = await getSession();
  const sqlOperationResult = await extractSession.executeStatement(sql, {
    runAsync: true,
  });
  const rowsResult = (await sqlOperationResult.fetchAll()) as T[];
  await sqlOperationResult.close();
  return rowsResult;
}

export async function pingDatabricks(): Promise<boolean> {
  const rows = await queryDatabricks<{ ok: number }>("SELECT 1 AS ok");
  return rows[0]?.ok === 1;
}
