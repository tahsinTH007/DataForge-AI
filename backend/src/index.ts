import express from "express";
import cors from "cors";

import { env } from "./config.js";

import { healthRouter } from "./routes/health.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", healthRouter);

app.listen(env.PORT, () => {
  console.log(`DataForge AI API is running on PORT ${env.PORT}`);
});
