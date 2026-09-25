import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

const backendDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
loadEnv({ path: path.join(backendDir, ".env") });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABRICKS_HOST: z.url(),
  DATABRICKS_TOKEN: z.string().min(1),
  DATABRICKS_SERVER_HOSTNAME: z.string().min(1),
  DATABRICKS_HTTP_PATH: z.string().min(1),
  DATABRICKS_CATALOG: z.string().default("dataforgeai"),
});

export const env = envSchema.parse(process.env);
export const CATALOG = env.DATABRICKS_CATALOG;
