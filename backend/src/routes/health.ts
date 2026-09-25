import { Router } from "express";
import { pingDatabricks } from "../databricks/sql.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const databricks = await pingDatabricks().catch(() => false);

  res.json({
    ok: databricks,
    services: { databricks },
  });
});
