# Vanguard — Compliance Intelligence Agent

AI-powered review tool for partner compliance questionnaires (Azure, on-premises, GCP, hybrid). Upload an Excel, get an instant verdict on whether you can be compliant, a per-requirement review that flags vague or incorrectly-declined items, and a downloadable Excel with AI review columns appended to the original.

---

## What's inside

```
vanguard-compliance/
├── server.js              Express: serves React build + proxies Anthropic API
├── vite.config.js         Vite build config (dev proxies /api → Express)
├── tailwind.config.js     Tailwind v3
├── postcss.config.js
├── index.html             Vite entry
├── railway.json           Railway deployment config
├── nixpacks.toml          Build instructions for Railway's Nixpacks builder
├── package.json           Deps + scripts
├── .env.example           Template — copy to .env for local dev
├── .gitignore
└── src/
    ├── main.jsx           React entry
    ├── index.css          Tailwind + custom fonts
    └── App.jsx            The full compliance agent UI
```

---

## Prerequisites

- **Node.js 20+** (`node --version`)
- **Git** and a **GitHub account**
- A **Railway account** — sign up at https://railway.app (free tier works for testing)
- An **Anthropic API key** — https://console.anthropic.com/settings/keys

---

## Step 1 — Run locally (optional but recommended)

```bash
# Install dependencies
npm install

# Create your local env file
cp .env.example .env
# Edit .env and paste your real ANTHROPIC_API_KEY

# Start both the Express server (port 3000) and Vite dev server (port 5173)
npm run dev
```

Open **http://localhost:5173**. Click *"Try with sample Azure questionnaire"* — if the AI review runs and the dashboard loads, you're good to deploy.

Hot reload works on the frontend via Vite; the server auto-restarts on changes via `node --watch`.

---

## Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Vanguard Compliance Agent"

# Create a new repo on GitHub (e.g. vanguard-compliance), then:
git remote add origin https://github.com/YOUR_USERNAME/vanguard-compliance.git
git branch -M main
git push -u origin main
```

---

## Step 3 — Deploy to Railway

1. Go to https://railway.app/new
2. Choose **Deploy from GitHub repo**
3. Authorize Railway to access your GitHub if prompted
4. Select your `vanguard-compliance` repo
5. Railway reads `railway.json` + `nixpacks.toml` and starts the first build. You'll see logs:
   - `npm ci` → installs dependencies
   - `npm run build` → Vite compiles the React app into `dist/`
   - `npm start` → launches Express on Railway's assigned `PORT`
6. The first build will fail the health check because the API key isn't set yet — that's expected. Go to the next step.

---

## Step 4 — Set environment variables

In your Railway project:

1. Click the service → **Variables** tab
2. Click **+ New Variable**
3. Add:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-api03-...` (your real key)
4. Save. Railway will automatically redeploy with the new variable.

That's the only required variable. Railway supplies `PORT` on its own.

---

## Step 5 — Get your URL

1. In Railway, click the service → **Settings** → **Networking**
2. Click **Generate Domain** — you'll get something like `vanguard-compliance-production.up.railway.app`
3. Open the URL in a browser. The app should load; try the sample questionnaire.

### Health check

Hit `https://YOUR-URL/api/health` — you should see:

```json
{ "ok": true, "hasApiKey": true, "time": "..." }
```

If `hasApiKey` is `false`, re-check your Railway Variables tab.

---

## Step 6 — Custom domain (optional)

1. Railway service → **Settings** → **Networking** → **Custom Domain**
2. Add your domain (e.g. `vanguard.yourcompany.com`)
3. Add the CNAME record Railway gives you to your DNS provider
4. Wait 1–2 minutes for SSL to provision

---

## Updating the app

Any push to `main` on GitHub triggers a redeploy automatically. To disable auto-deploys, Railway service → **Settings** → **Source** → toggle off.

---

## Common tweaks

### Change the Claude model

Edit `src/App.jsx` near the top:

```js
const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";
```

Use any model string your API key has access to — e.g. `claude-sonnet-4-6`, `claude-opus-4-7`, `claude-haiku-4-5-20251001`. Opus will give higher-quality reviews but costs more and is slower; Haiku is fastest/cheapest.

### Tune the review prompt

Edit the `prompt` variable inside the `reviewWithClaude` function in `src/App.jsx`. This is the single biggest lever for review quality. You can inject industry-specific context (e.g. "this customer is in healthcare, weight HIPAA considerations heavily") or tighten the response format.

### Add password protection

Quick option: wrap the Express app with Basic Auth before the static serve:

```js
import basicAuth from "express-basic-auth";
app.use(basicAuth({
  users: { [process.env.AUTH_USER]: process.env.AUTH_PASS },
  challenge: true,
}));
```

Then `npm i express-basic-auth` and add `AUTH_USER` / `AUTH_PASS` to Railway Variables.

For proper team SSO, put Cloudflare Access in front of the Railway URL — takes 5 minutes, supports Google Workspace / Okta / Entra ID.

### Adjust file size limit for uploads

The Excel file is parsed client-side (no upload to server), so the limit is browser memory. The `/api/review` endpoint accepts up to 10MB of JSON (requirements list). If you review 500+ requirements in one pass, bump `express.json({ limit: "20mb" })` in `server.js`.

---

## Cost expectations

Railway free tier: $5 of usage/month (this app is very light — usually under $2/month for occasional use).

Anthropic API (Sonnet 4.5, per review of ~25 requirements):
- Input: ~3,000 tokens
- Output: ~3,500 tokens
- Cost: approximately $0.06 per review

For 100 reviews/month: roughly $6 in API spend.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Health check fails | Verify `ANTHROPIC_API_KEY` is set in Railway Variables |
| "Claude returned malformed JSON" | Usually the model's output was truncated — increase `max_tokens` in `App.jsx` (currently 8000) or reduce questionnaire size per batch |
| Sample loads but real upload doesn't | Check your Excel has columns with headers containing `requirement`, `response`, `comment` etc. — the parser is heuristic |
| Build fails on Railway | Check build logs — usually a missing dep; ensure `package.json` committed correctly |
| CORS errors in dev | Ensure `vite.config.js` proxy is set to `http://localhost:3000` and server is running |

---

## Security notes

- `ANTHROPIC_API_KEY` **never** touches browser code. It lives only in Railway's environment and is read by `server.js`.
- Uploaded Excel files are parsed entirely in the browser — file contents are not saved on the server. Only the extracted requirements list is sent to Anthropic (via your server proxy).
- There's no database. Close the tab and the review is gone unless you've downloaded the Excel.
- If you handle regulated data, add auth (see above) and consider Anthropic's Zero Data Retention if eligible.

---

## License

Your project — use and modify freely.
