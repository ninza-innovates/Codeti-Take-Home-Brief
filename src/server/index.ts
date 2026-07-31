import cors from "cors";
import express from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AggregationResult } from "../shared/types.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RESULTS_PATH = path.join(ROOT, "data", "output", "results.json");
const CLIENT_DIST = path.join(ROOT, "client", "dist");
const PORT = Number(process.env.PORT) || 8787;

const app = express();
app.use(cors());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/results", async (_req, res) => {
  try {
    const raw = await readFile(RESULTS_PATH, "utf8");
    const data = JSON.parse(raw) as AggregationResult;
    res.json(data);
  } catch {
    res.status(404).json({
      error:
        "No results yet. Run `npm run scrape` (or `npm run scrape:a` for a smoke test) first.",
    });
  }
});

app.use(express.static(CLIENT_DIST));

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(CLIENT_DIST, "index.html"), (err) => {
    if (err) {
      res
        .status(404)
        .type("text")
        .send(
          "Client not built. During development, run `npm run client` (Vite on :5173) alongside this server.",
        );
    }
  });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Results file: ${RESULTS_PATH}`);
});
