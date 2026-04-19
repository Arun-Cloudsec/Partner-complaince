import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

app.use(express.json({ limit: "10mb" }));

/* ──────────────── Health check ──────────────── */
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    hasApiKey: Boolean(API_KEY),
    time: new Date().toISOString(),
  });
});

/* ──────────────── Anthropic proxy ──────────────── */
app.post("/api/review", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY is not configured on the server. Set it in Railway's Variables tab.",
    });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error("Anthropic proxy error:", err);
    res.status(502).json({
      error: "Upstream call to Anthropic failed",
      detail: err.message,
    });
  }
});

/* ──────────────── Static frontend ──────────────── */
const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));

// SPA fallback — any non-API route returns index.html
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n  Vanguard Compliance Intelligence`);
  console.log(`  Listening on http://localhost:${PORT}`);
  console.log(`  API key configured: ${API_KEY ? "yes" : "NO — set ANTHROPIC_API_KEY"}\n`);
});
