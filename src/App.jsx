import { useState, useEffect, useMemo, useRef } from "react";
import {
  Upload, Sparkles, ArrowRight, Check, X, AlertTriangle,
  ChevronRight, Download, RotateCcw, Search, Edit3,
  CheckCircle2, Circle, CircleSlash, CircleDot, Loader2, TrendingUp, Sparkle,
  KeyRound, FileText, Settings, Eye, EyeOff, BookOpen, FileDown, ChevronDown, Filter, Layers, Presentation, ClipboardList, MessageSquare
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import * as XLSX from "xlsx";

/* ───────────────────────── Config ───────────────────────── */
// You can change this model to any Claude model your API key has access to.
// e.g. "claude-sonnet-4-5-20250929", "claude-sonnet-4-6", "claude-opus-4-7"
const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

/* ───────────────────────── Theme tokens ───────────────────────── */
const T = {
  bg: "#F7F3EA",
  card: "#FDFBF5",
  ink: "#14120F",
  inkSoft: "#5A544A",
  inkFade: "#8A8175",
  line: "#E3DCC9",
  lineSoft: "#EFE8D6",
  emerald: "#2D5F3F",
  emeraldBg: "#E3EDE2",
  amber: "#B8731F",
  amberBg: "#F5E7CF",
  rust: "#8B2C1A",
  rustBg: "#F2DDD4",
  navy: "#1B3B5F",
  navyBg: "#DCE4EC",
};

/* ───────────────────────── Sample questionnaire ───────────────────────── */
const SAMPLE_DATA = [
  { id: "SEC-001", category: "Data Security", requirement: "All data at rest must be encrypted using AES-256 or equivalent algorithm with customer-managed keys", partnerResponse: "Compliant", partnerComment: "Azure Storage Service Encryption with customer-managed keys in Azure Key Vault" },
  { id: "SEC-002", category: "Data Security", requirement: "Data must be encrypted in transit using TLS 1.2 or higher for all communications", partnerResponse: "Compliant", partnerComment: "Enforced via Azure Front Door and Application Gateway with TLS 1.2 minimum" },
  { id: "SEC-003", category: "Data Security", requirement: "Hardware Security Module (HSM) must be used for root key protection", partnerResponse: "Non-Compliant", partnerComment: "HSM is not available in our current setup" },
  { id: "SEC-004", category: "Data Security", requirement: "Data loss prevention policies must be enforced for sensitive data", partnerResponse: "Partial", partnerComment: "Some DLP in place, but not comprehensive" },
  { id: "ACC-001", category: "Access Control", requirement: "Multi-factor authentication must be enforced for all privileged accounts accessing production", partnerResponse: "Compliant", partnerComment: "Azure AD Conditional Access policies enforce MFA for all admin roles" },
  { id: "ACC-002", category: "Access Control", requirement: "Privileged access must follow just-in-time (JIT) access principles with time-bound approval", partnerResponse: "Partial", partnerComment: "PIM configured for Global Admin, rollout to other roles in progress" },
  { id: "ACC-003", category: "Access Control", requirement: "Session timeout must be enforced after 15 minutes of inactivity for administrative interfaces", partnerResponse: "Not Responded", partnerComment: "" },
  { id: "ACC-004", category: "Access Control", requirement: "Role-based access control with principle of least privilege must be applied", partnerResponse: "Compliant", partnerComment: "Azure RBAC implemented with custom roles per least privilege" },
  { id: "AUD-001", category: "Audit & Logging", requirement: "All administrative activities must be logged and retained for a minimum of 7 years", partnerResponse: "Non-Compliant", partnerComment: "Current logging retention is limited to 90 days" },
  { id: "AUD-002", category: "Audit & Logging", requirement: "Audit logs must be immutable and tamper-evident with cryptographic integrity", partnerResponse: "Partial", partnerComment: "Azure Monitor logs enabled, immutability settings not configured" },
  { id: "AUD-003", category: "Audit & Logging", requirement: "Real-time security event monitoring and alerting must be in place", partnerResponse: "Compliant", partnerComment: "Microsoft Sentinel with custom analytics rules and 24/7 SOC" },
  { id: "DR-001", category: "Disaster Recovery", requirement: "Recovery Time Objective (RTO) must not exceed 4 hours for critical systems", partnerResponse: "Compliant", partnerComment: "Azure Site Recovery configured with tested 2-hour RTO" },
  { id: "DR-002", category: "Disaster Recovery", requirement: "Backups must be geo-redundant across at least two geographically separate regions", partnerResponse: "Compliant", partnerComment: "GRS storage with paired region replication" },
  { id: "DR-003", category: "Disaster Recovery", requirement: "DR drills must be conducted at least annually with documented results", partnerResponse: "Not Responded", partnerComment: "" },
  { id: "NET-001", category: "Network Security", requirement: "Network segmentation using micro-segmentation or zero-trust principles", partnerResponse: "Non-Compliant", partnerComment: "Traditional network zones are used, micro-segmentation not implemented" },
  { id: "NET-002", category: "Network Security", requirement: "DDoS protection must be active for all internet-facing endpoints", partnerResponse: "Compliant", partnerComment: "Azure DDoS Protection Standard enabled on all public IPs" },
  { id: "NET-003", category: "Network Security", requirement: "Web Application Firewall must protect all public-facing web applications", partnerResponse: "Compliant", partnerComment: "Azure Front Door with WAF and managed rule sets" },
  { id: "COMP-001", category: "Compliance", requirement: "System must be compliant with SOC 2 Type II attestation", partnerResponse: "Not Responded", partnerComment: "" },
  { id: "COMP-002", category: "Compliance", requirement: "Data residency must be maintained within customer-specified geographic region", partnerResponse: "Compliant", partnerComment: "Deployed in specified Azure region with no cross-region data movement" },
  { id: "COMP-003", category: "Compliance", requirement: "GDPR data subject rights automation (access, erasure, portability)", partnerResponse: "Partial", partnerComment: "Manual process in place; automation being evaluated" },
  { id: "INC-001", category: "Incident Management", requirement: "Security incidents must be reported to customer within 24 hours of detection", partnerResponse: "Partial", partnerComment: "Process documented, notification partially automated" },
  { id: "INC-002", category: "Incident Management", requirement: "Dedicated 24/7 security operations center (SOC) must monitor the environment", partnerResponse: "Compliant", partnerComment: "Managed SOC with Microsoft Sentinel, 24/7 coverage" },
  { id: "VUL-001", category: "Vulnerability Management", requirement: "Critical vulnerabilities must be remediated within 7 days of discovery", partnerResponse: "Non-Compliant", partnerComment: "Current SLA is 30 days for critical vulnerabilities" },
  { id: "VUL-002", category: "Vulnerability Management", requirement: "Monthly vulnerability scans must be performed on all production assets", partnerResponse: "Compliant", partnerComment: "Microsoft Defender for Cloud continuous scanning enabled" },
];

/* ───────────────────────── Status helpers ───────────────────────── */
const STATUS_META = {
  "Compliant":     { color: T.emerald, bg: T.emeraldBg, icon: CheckCircle2, label: "Compliant" },
  "Partial":       { color: T.amber,   bg: T.amberBg,   icon: CircleDot,    label: "Partial" },
  "Non-Compliant": { color: T.rust,    bg: T.rustBg,    icon: CircleSlash,  label: "Non-Compliant" },
  "Not Responded": { color: T.inkFade, bg: "#EEE8D8",   icon: Circle,       label: "Not Responded" },
};

const normaliseStatus = (raw) => {
  if (!raw) return "Not Responded";
  const s = String(raw).toLowerCase().trim();
  if (!s || s === "n/a" || s === "na" || s === "-") return "Not Responded";
  if (s.includes("non") || s.includes("not compliant") || s.includes("no")) return "Non-Compliant";
  if (s.includes("partial") || s.includes("partly")) return "Partial";
  if (s.includes("compli") || s === "yes") return "Compliant";
  return "Not Responded";
};

/* ───────────────────────── Parse uploaded Excel ───────────────────────── */
const parseWorkbook = (buf) => {
  const wb = XLSX.read(buf, { type: "array", cellStyles: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
  if (!rows.length) return { requirements: [], workbook: wb, sheetName };

  const headers = Object.keys(rows[0]);
  const find = (keywords) => headers.find(h => keywords.some(k => h.toLowerCase().includes(k)));
  const idKey   = find(["id", "ref", "#", "no.", "sr", "s.no"]) || headers[0];
  const catKey  = find(["category", "domain", "section", "area", "control family"]);
  const reqKey  = find(["requirement", "question", "control", "description", "criteria"]) || headers[1];
  const respKey = find(["response", "answer", "status", "compliance", "compliant"]);
  const comKey  = find(["comment", "remark", "note", "evidence", "detail", "justification"]);

  const requirements = rows.map((r, i) => ({
    id: String(r[idKey] || `REQ-${String(i + 1).padStart(3, "0")}`),
    category: String(r[catKey] || "Uncategorised"),
    requirement: String(r[reqKey] || ""),
    partnerResponse: normaliseStatus(r[respKey]),
    partnerComment: String(r[comKey] || ""),
    _rowIndex: i,
    _raw: r,
  })).filter(r => r.requirement.trim());

  return { requirements, workbook: wb, sheetName, headers };
};

/* ───────────────────────── Claude API call (direct or via server proxy) ───────────────────────── */
const reviewWithClaude = async (requirements, platform, apiKey = "", referenceDoc = "") => {
  const payload = requirements.map(r => ({
    id: r.id, category: r.category, requirement: r.requirement,
    partnerResponse: r.partnerResponse, partnerComment: r.partnerComment || "(no comment)"
  }));

  const refSection = referenceDoc
    ? `\n\nREFERENCE DOCUMENT (use this as the ground truth for comparison):
The following is an existing compliance document, policy, or standard provided by the customer. Compare the partner's responses against this reference. Flag any contradictions, gaps, or areas where the partner's response does not align with the reference. Note where the partner claims something that the reference document contradicts.

<reference_document>
${referenceDoc.slice(0, 30000)}
</reference_document>\n`
    : "";

  const prompt = `You are a senior cloud compliance architect specialising in Microsoft Azure, on-premises, and multi-cloud deployments. You are reviewing a partner's responses to a customer compliance questionnaire for a ${platform} deployment.
${refSection}
For each requirement, assess:
1. CLARITY — is the partner's response clear and specific, or vague/generic?
2. ACCURACY — is the partner's compliance claim technically correct given ${platform} capabilities?${referenceDoc ? "\n2b. REFERENCE CHECK — does the response align with or contradict the reference document provided?" : ""}
3. FEASIBILITY — if marked Non-Compliant or Partial, can this realistically be made fully compliant using ${platform} native services or standard practice?
4. RECOMMENDED RESPONSE — what should the response actually be, and what improved comment should accompany it (cite specific Azure/on-prem services where relevant)?

Key principle: Azure and well-architected on-premises deployments CAN meet nearly all standard enterprise compliance requirements. Partners frequently mark items as Non-Compliant when they actually could be compliant with available services (e.g. Azure Dedicated HSM, Log Analytics long-term retention, Azure Firewall for segmentation, Defender for Cloud for rapid remediation). Challenge unjustified Non-Compliant claims.

Requirements to review:
${JSON.stringify(payload, null, 2)}

Return ONLY a JSON object (no markdown fences, no commentary) with this exact shape:
{
  "verdict": "can_be_compliant" | "mostly_compliant" | "challenging",
  "verdictHeadline": "one sentence verdict addressed to the delivery team",
  "verdictDetail": "2-3 sentences explaining the path to compliance",
  "confidence": 0-100,
  "keyInsights": ["short insight 1", "short insight 2", "short insight 3"],
  "reviews": [
    {
      "id": "requirement id (must match input)",
      "clarity": "clear" | "unclear",
      "accuracy": "accurate" | "incorrect" | "partial",
      "feasibility": "feasible" | "challenging" | "not_feasible",
      "recommendedStatus": "Compliant" | "Partial" | "Non-Compliant",
      "recommendedComment": "the improved response text, 1-3 sentences, cite specific services${referenceDoc ? ". Note if reference document supports or contradicts this" : ""}",
      "reasoning": "brief internal reasoning for the delivery team, 1-2 sentences",
      "aiFlag": "improved" | "confirmed" | "unclear" | "attention"
    }
  ]
}`;

  let resp;
  if (apiKey && apiKey.trim()) {
    // Direct Anthropic API call
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey.trim(),
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } else {
    // Server proxy
    resp = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  }

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    const msg = err.error?.message || err.error || `API returned ${resp.status}`;
    if (resp.status === 401) throw new Error("Invalid API key. Please check your Anthropic API key and try again.");
    throw new Error(msg);
  }

  const data = await resp.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

  const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("\n");
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Raw response:", text);
    throw new Error("Claude returned malformed JSON. Try again or simplify the questionnaire.");
  }
};

/* ───────────────────────── Export Excel (updates same workbook) ───────────────────────── */
const exportExcel = (originalWorkbook, sheetName, requirements) => {
  let wb = originalWorkbook;
  if (!wb) {
    wb = XLSX.utils.book_new();
    const rows = requirements.map(r => ({
      ID: r.id,
      Category: r.category,
      Requirement: r.requirement,
      "Partner Response": r.partnerResponse,
      "Partner Comment": r.partnerComment,
      "AI Reviewed Status": r.finalStatus || r.aiRecommendedStatus || r.partnerResponse,
      "AI Reviewed Comment": r.finalComment || r.aiRecommendedComment || r.partnerComment,
      "AI Flag": r.aiFlag || "",
      "AI Reasoning": r.aiReasoning || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{wch:12},{wch:18},{wch:52},{wch:16},{wch:40},{wch:18},{wch:52},{wch:14},{wch:40}];
    XLSX.utils.book_append_sheet(wb, ws, "Compliance Review");
  } else {
    const ws = wb.Sheets[sheetName];
    const range = XLSX.utils.decode_range(ws["!ref"]);
    const startCol = range.e.c + 1;
    const newCols = ["AI Reviewed Status", "AI Reviewed Comment", "AI Flag", "AI Reasoning"];
    newCols.forEach((h, i) => {
      const addr = XLSX.utils.encode_cell({ r: 0, c: startCol + i });
      ws[addr] = { t: "s", v: h };
    });
    requirements.forEach((r) => {
      const rowIdx = (r._rowIndex ?? 0) + 1;
      const values = [
        r.finalStatus || r.aiRecommendedStatus || r.partnerResponse,
        r.finalComment || r.aiRecommendedComment || r.partnerComment,
        r.aiFlag || "",
        r.aiReasoning || "",
      ];
      values.forEach((v, i) => {
        const addr = XLSX.utils.encode_cell({ r: rowIdx, c: startCol + i });
        ws[addr] = { t: "s", v: String(v) };
      });
    });
    ws["!ref"] = XLSX.utils.encode_range({ s: range.s, e: { r: Math.max(range.e.r, requirements.length), c: startCol + newCols.length - 1 } });
  }

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
  const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `compliance-review-${new Date().toISOString().split("T")[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};



/* ───────────────────────── Export as formatted text (PDF/Word via HTML) ───────────────────────── */
const exportFormatted = (requirements, verdict, metrics, format = "pdf") => {
  const finalStatus = (r) => r.finalStatus || r.aiRecommendedStatus || r.partnerResponse;
  const finalComment = (r) => r.finalComment || r.aiRecommendedComment || r.partnerComment;
  const meta = { can_be_compliant: "Can Be Compliant", mostly_compliant: "Mostly Compliant", challenging: "Challenging" };

  const rows = requirements.map(r => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;font-family:monospace;font-size:12px">${r.id}</td>
      <td style="padding:8px;border:1px solid #ddd;font-size:12px">${r.category}</td>
      <td style="padding:8px;border:1px solid #ddd;font-size:12px">${r.requirement}</td>
      <td style="padding:8px;border:1px solid #ddd;font-size:12px;font-weight:600;color:${r.partnerResponse==='Compliant'?'#2D5F3F':r.partnerResponse==='Non-Compliant'?'#8B2C1A':'#B8731F'}">${r.partnerResponse}</td>
      <td style="padding:8px;border:1px solid #ddd;font-size:11px;color:#5A544A">${r.partnerComment || '—'}</td>
      <td style="padding:8px;border:1px solid #ddd;font-size:12px;font-weight:600;color:${finalStatus(r)==='Compliant'?'#2D5F3F':finalStatus(r)==='Non-Compliant'?'#8B2C1A':'#B8731F'}">${finalStatus(r)}</td>
      <td style="padding:8px;border:1px solid #ddd;font-size:11px;color:#5A544A">${finalComment(r)}</td>
      <td style="padding:8px;border:1px solid #ddd;font-size:11px;color:#5A544A">${r.aiReasoning || '—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Compliance Review Report</title>
    <style>body{font-family:'Segoe UI',Arial,sans-serif;margin:40px;color:#14120F}h1{font-size:28px;margin-bottom:4px}h2{font-size:20px;margin-top:32px;border-bottom:2px solid #14120F;padding-bottom:8px}
    .kpi{display:inline-block;margin-right:32px;margin-bottom:16px}.kpi-val{font-size:36px;font-weight:700}.kpi-lab{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#5A544A}
    table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#14120F;color:#F7F3EA;padding:10px;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:left;border:1px solid #14120F}</style></head>
    <body>
    <h1>Compliance Review Report</h1>
    <p style="color:#5A544A;font-size:14px">Generated ${new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"})} · Vanguard Compliance Intelligence</p>
    <hr style="border:none;border-top:1px solid #E3DCC9;margin:20px 0">

    <h2>Verdict: ${meta[verdict?.verdict] || 'Review Complete'}</h2>
    <p style="font-size:16px;line-height:1.6">${verdict?.verdictHeadline || ''}</p>
    <p style="color:#5A544A">${verdict?.verdictDetail || ''}</p>

    <h2>Summary Metrics</h2>
    <div>
      <div class="kpi"><div class="kpi-val">${metrics.total}</div><div class="kpi-lab">Total Requirements</div></div>
      <div class="kpi"><div class="kpi-val">${metrics.partner.compliant}</div><div class="kpi-lab">Partner: Compliant</div></div>
      <div class="kpi"><div class="kpi-val">${metrics.ai.compliant}</div><div class="kpi-lab">After AI: Compliant</div></div>
      <div class="kpi"><div class="kpi-val">${metrics.improved}</div><div class="kpi-lab">AI Improved</div></div>
      <div class="kpi"><div class="kpi-val">${metrics.needsAttention}</div><div class="kpi-lab">Needs Attention</div></div>
    </div>

    <h2>Before vs After AI Review</h2>
    <table>
      <tr><th>Status</th><th>Partner (Before)</th><th>After AI Review</th><th>Change</th></tr>
      <tr><td style="padding:8px;border:1px solid #ddd">Compliant</td><td style="padding:8px;border:1px solid #ddd;color:#2D5F3F;font-weight:700">${metrics.partner.compliant}</td><td style="padding:8px;border:1px solid #ddd;color:#2D5F3F;font-weight:700">${metrics.ai.compliant}</td><td style="padding:8px;border:1px solid #ddd;color:#2D5F3F">${metrics.ai.compliant - metrics.partner.compliant >= 0 ? '+' : ''}${metrics.ai.compliant - metrics.partner.compliant}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd">Partial</td><td style="padding:8px;border:1px solid #ddd;color:#B8731F">${metrics.partner.partial}</td><td style="padding:8px;border:1px solid #ddd;color:#B8731F">${metrics.ai.partial}</td><td style="padding:8px;border:1px solid #ddd">${metrics.ai.partial - metrics.partner.partial >= 0 ? '+' : ''}${metrics.ai.partial - metrics.partner.partial}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd">Non-Compliant</td><td style="padding:8px;border:1px solid #ddd;color:#8B2C1A">${metrics.partner.nonCompliant}</td><td style="padding:8px;border:1px solid #ddd;color:#8B2C1A">${metrics.ai.nonCompliant}</td><td style="padding:8px;border:1px solid #ddd;color:#2D5F3F">${metrics.ai.nonCompliant - metrics.partner.nonCompliant >= 0 ? '+' : ''}${metrics.ai.nonCompliant - metrics.partner.nonCompliant}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd">Not Responded</td><td style="padding:8px;border:1px solid #ddd;color:#8A8175">${metrics.partner.notResponded}</td><td style="padding:8px;border:1px solid #ddd;color:#8A8175">${metrics.ai.notResponded}</td><td style="padding:8px;border:1px solid #ddd">${metrics.ai.notResponded - metrics.partner.notResponded >= 0 ? '+' : ''}${metrics.ai.notResponded - metrics.partner.notResponded}</td></tr>
    </table>

    <h2>Detailed Review — All ${metrics.total} Requirements</h2>
    <table>
      <tr><th>ID</th><th>Category</th><th>Requirement</th><th>Partner Status</th><th>Partner Comment</th><th>AI Status</th><th>AI Comment</th><th>AI Reasoning</th></tr>
      ${rows}
    </table>

    <hr style="border:none;border-top:1px solid #E3DCC9;margin:32px 0 16px">
    <p style="font-size:11px;color:#8A8175">Vanguard · Compliance Intelligence · Powered by Claude</p>
    </body></html>`;

  if (format === "pdf") {
    const printWin = window.open('', '_blank');
    printWin.document.write(html);
    printWin.document.close();
    setTimeout(() => { printWin.print(); }, 500);
  } else {
    // Word .doc (HTML-based)
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-review-${new Date().toISOString().split("T")[0]}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

/* ───────────────────────── UI: Header ───────────────────────── */
const Header = ({ platform, onPlatformChange, onReset, hasData, onExport, onExportPdf, onExportWord, apiKey, onApiKeyChange }) => {
  const [showKey, setShowKey] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  return (
  <header className="border-b sticky top-0 z-30 backdrop-blur-sm" style={{ borderColor: T.line, background: `${T.bg}E6` }}>
    <div className="max-w-[1400px] mx-auto px-8 py-5 flex items-center justify-between">
      <div className="flex items-baseline gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center" style={{ background: T.ink, color: T.bg }}>
            <Sparkle size={18} strokeWidth={1.5} />
          </div>
          <div>
            <div className="font-display text-xl leading-none" style={{ color: T.ink, fontWeight: 500 }}>Vanguard</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: T.inkFade }}>Compliance Intelligence</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* API Key toggle */}
        <div className="relative">
          <button onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm transition-all"
            style={{ color: apiKey ? T.emerald : T.inkSoft, background: apiKey ? T.emeraldBg : "transparent", border: `1px solid ${apiKey ? T.emerald+"40" : T.line}` }}>
            <KeyRound size={14} />
            <span className="hidden sm:inline">{apiKey ? "API Key ✓" : "API Key"}</span>
          </button>
          {settingsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 p-4 shadow-lg z-50" style={{ background: T.card, border: `1px solid ${T.line}` }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: T.inkFade }}>Anthropic API Key</div>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={e => onApiKeyChange(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="w-full px-3 py-2 pr-10 text-sm font-mono outline-none"
                  style={{ background: T.bg, border: `1px solid ${T.line}`, color: T.ink }}
                />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: T.inkFade }}>
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="text-[11px] mt-2 leading-relaxed" style={{ color: T.inkFade }}>
                {apiKey
                  ? "✓ Key saved. Calls go directly to Anthropic API."
                  : "Without a key, calls route through the server proxy (/api/review). Enter your key for direct API access."}
              </div>
              <button onClick={() => setSettingsOpen(false)} className="mt-3 text-xs font-medium" style={{ color: T.ink }}>Done</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 px-1 py-1 text-xs font-mono" style={{ background: T.card, border: `1px solid ${T.line}` }}>
          {["Azure", "On-Premises", "GCP", "Hybrid"].map(p => (
            <button key={p} onClick={() => onPlatformChange(p)}
              className="px-3 py-1.5 transition-colors"
              style={{ background: platform === p ? T.ink : "transparent", color: platform === p ? T.bg : T.inkSoft }}>
              {p}
            </button>
          ))}
        </div>
        {hasData && (
          <>
            <div className="relative">
              <button onClick={() => setExportOpen(!exportOpen)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all hover:opacity-80"
                style={{ background: T.ink, color: T.bg }}>
                <Download size={14} /> Export <ChevronDown size={12} />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 shadow-lg z-50" style={{ background: T.card, border: `1px solid ${T.line}` }}>
                  <button onClick={() => { onExport(); setExportOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:opacity-80 border-b" style={{ color: T.ink, borderColor: T.lineSoft }}>
                    <FileText size={14} /> Excel (.xlsx)
                  </button>
                  <button onClick={() => { onExportPdf(); setExportOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:opacity-80 border-b" style={{ color: T.ink, borderColor: T.lineSoft }}>
                    <FileDown size={14} /> PDF (print)
                  </button>
                  <button onClick={() => { onExportWord(); setExportOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:opacity-80" style={{ color: T.ink }}>
                    <FileText size={14} /> Word (.doc)
                  </button>
                </div>
              )}
            </div>
            <button onClick={onReset} className="flex items-center gap-2 px-3 py-2 text-sm"
              style={{ color: T.inkSoft }}>
              <RotateCcw size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  </header>
);};

/* ───────────────────────── UI: Upload view ───────────────────────── */
const UploadView = ({ onFile, onSample, platform, error, referenceDoc, refDocName, onRefDoc }) => {
  const inputRef = useRef(null);
  const refInputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [refDrag, setRefDrag] = useState(false);

  const handleRefFile = async (file) => {
    if (!file) return;
    const name = file.name;
    try {
      if (file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".csv")) {
        const text = await file.text();
        onRefDoc(text, name);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const text = wb.SheetNames.map(sn => {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: "", raw: false });
          return `--- Sheet: ${sn} ---\n` + rows.map(r => Object.entries(r).map(([k,v]) => `${k}: ${v}`).join(" | ")).join("\n");
        }).join("\n\n");
        onRefDoc(text, name);
      } else {
        // For PDF/DOCX — read as text (basic extraction)
        const text = await file.text();
        onRefDoc(text, name);
      }
    } catch (e) {
      console.error("Reference doc read error:", e);
      // Fallback: try reading as text
      try { const text = await file.text(); onRefDoc(text, name); } catch { onRefDoc("", ""); }
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-16">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-7 fade-in">
          <div className="font-mono text-xs uppercase tracking-[0.25em] mb-6" style={{ color: T.inkFade }}>
            ⊹ New Review · {platform}
          </div>
          <h1 className="font-display text-7xl md:text-[88px] leading-[0.92] mb-6" style={{ color: T.ink, fontWeight: 400, letterSpacing: "-0.03em" }}>
            Review what<br/>your partner<br/>
            <span style={{ fontStyle: "italic", fontWeight: 300 }}>actually</span> answered.
          </h1>
          <p className="text-lg leading-relaxed max-w-xl mb-10" style={{ color: T.inkSoft }}>
            Upload a partner's questionnaire response. In seconds, an AI architect tells you whether you <em>can</em> be compliant, flags vague or incorrectly-declined items, and rewrites responses citing the right Azure or on-prem services.
          </p>

          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer transition-all p-10 mb-4"
            style={{
              border: `1px dashed ${drag ? T.ink : T.line}`,
              background: drag ? T.card : "transparent",
            }}>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv"
              onChange={e => e.target.files[0] && onFile(e.target.files[0])} className="hidden" />
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 flex items-center justify-center" style={{ background: T.ink, color: T.bg }}>
                <Upload size={20} strokeWidth={1.5} />
              </div>
              <div>
                <div className="font-display text-xl" style={{ color: T.ink }}>Drop the questionnaire here</div>
                <div className="text-sm mt-0.5" style={{ color: T.inkFade }}>Excel (.xlsx, .xls) or CSV · Max 5MB</div>
              </div>
            </div>
          </div>

          {/* Reference document upload */}
          <div
            onDragOver={e => { e.preventDefault(); setRefDrag(true); }}
            onDragLeave={() => setRefDrag(false)}
            onDrop={e => { e.preventDefault(); setRefDrag(false); const f = e.dataTransfer.files[0]; if (f) handleRefFile(f); }}
            onClick={() => refInputRef.current?.click()}
            className="cursor-pointer transition-all p-6 mb-4"
            style={{
              border: `1px dashed ${refDrag ? T.navy : referenceDoc ? T.emerald+"60" : T.lineSoft}`,
              background: referenceDoc ? T.emeraldBg+"40" : refDrag ? T.navyBg+"40" : "transparent",
            }}>
            <input ref={refInputRef} type="file" accept=".xlsx,.xls,.csv,.txt,.md,.pdf,.docx"
              onChange={e => e.target.files[0] && handleRefFile(e.target.files[0])} className="hidden" />
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center" style={{ background: referenceDoc ? T.emerald : T.navyBg, color: referenceDoc ? T.bg : T.navy }}>
                <BookOpen size={18} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: T.ink }}>
                  {referenceDoc ? `✓ Reference: ${refDocName}` : "Optional: Upload existing compliance document"}
                </div>
                <div className="text-xs mt-0.5" style={{ color: T.inkFade }}>
                  {referenceDoc
                    ? `${(referenceDoc.length / 1000).toFixed(0)}K chars loaded · AI will compare responses against this`
                    : "Upload a policy, standard, or previous assessment to compare responses against"}
                </div>
              </div>
              {referenceDoc && (
                <button onClick={(e) => { e.stopPropagation(); onRefDoc("", ""); }}
                  className="p-1 hover:opacity-70" style={{ color: T.inkFade }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm p-3 mb-4" style={{ color: T.rust, background: T.rustBg }}>
              <AlertTriangle size={14} className="inline mr-2" />{error}
            </div>
          )}

          <button onClick={onSample}
            className="group inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: T.ink }}>
            <span className="border-b" style={{ borderColor: T.ink }}>Or try with sample Azure questionnaire</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="col-span-12 md:col-span-5 md:pl-8 space-y-6 fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="border-l-2 pl-6" style={{ borderColor: T.ink }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-2" style={{ color: T.inkFade }}>01 · Scan</div>
            <div className="font-display text-2xl mb-1.5" style={{ color: T.ink, fontWeight: 500 }}>Instant verdict.</div>
            <div className="text-sm leading-relaxed" style={{ color: T.inkSoft }}>A single line answer: can we be compliant with the partner's stack — yes, mostly, or challenging — with confidence score.</div>
          </div>
          <div className="border-l-2 pl-6" style={{ borderColor: T.line }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-2" style={{ color: T.inkFade }}>02 · Review</div>
            <div className="font-display text-2xl mb-1.5" style={{ color: T.ink, fontWeight: 500 }}>Every line, challenged.</div>
            <div className="text-sm leading-relaxed" style={{ color: T.inkSoft }}>AI flags unclear responses, catches Non-Compliant items that Azure <em>can</em> actually deliver, and rewrites responses with specific services.</div>
          </div>
          <div className="border-l-2 pl-6" style={{ borderColor: T.line }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-2" style={{ color: T.inkFade }}>03 · Deliver</div>
            <div className="font-display text-2xl mb-1.5" style={{ color: T.ink, fontWeight: 500 }}>Same file, upgraded.</div>
            <div className="text-sm leading-relaxed" style={{ color: T.inkSoft }}>Download the same workbook with AI review columns appended. Original formatting untouched.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── UI: Analysing loader ───────────────────────── */
const AnalysingView = ({ step, total, platform }) => (
  <div className="max-w-[900px] mx-auto px-8 py-24 text-center fade-in">
    <div className="inline-flex items-center justify-center mb-8">
      <Loader2 size={28} className="animate-spin" style={{ color: T.ink }} strokeWidth={1.5} />
    </div>
    <div className="font-mono text-xs uppercase tracking-[0.25em] mb-5" style={{ color: T.inkFade }}>
      {platform} · AI Architect reviewing
    </div>
    <h2 className="font-display text-5xl mb-4" style={{ color: T.ink, fontWeight: 400 }}>
      Reading between the lines<span style={{ fontStyle: "italic" }}>…</span>
    </h2>
    <p className="text-lg max-w-xl mx-auto mb-10" style={{ color: T.inkSoft }}>
      Cross-referencing {total} partner responses against Azure service capabilities, on-prem reference architectures, and common compliance patterns.
    </p>
    <div className="max-w-md mx-auto">
      <div className="h-px w-full shimmer" style={{ background: T.line }} />
      <div className="mt-4 text-xs font-mono" style={{ color: T.inkFade }}>{step}</div>
    </div>
  </div>
);

/* ───────────────────────── UI: Verdict banner ───────────────────────── */
const VERDICT_META = {
  can_be_compliant: { label: "We can be compliant", tone: T.emerald, toneBg: T.emeraldBg, glyph: "✓" },
  mostly_compliant: { label: "Mostly achievable",    tone: T.amber,   toneBg: T.amberBg,   glyph: "◐" },
  challenging:      { label: "Challenging path",     tone: T.rust,    toneBg: T.rustBg,    glyph: "△" },
};

const VerdictBanner = ({ verdict, platform }) => {
  const meta = VERDICT_META[verdict.verdict] || VERDICT_META.mostly_compliant;
  return (
    <section className="fade-in mb-10">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-8">
          <div className="font-mono text-xs uppercase tracking-[0.25em] mb-4 flex items-center gap-3" style={{ color: T.inkFade }}>
            <span className="inline-block w-8 h-px" style={{ background: T.inkFade }} />
            The verdict · {platform}
          </div>
          <div className="flex items-start gap-6 mb-6">
            <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center font-display text-3xl"
                 style={{ background: meta.tone, color: T.bg }}>
              {meta.glyph}
            </div>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider mb-2 px-2 py-1 inline-block"
                   style={{ color: meta.tone, background: meta.toneBg }}>
                {meta.label}
              </div>
              <h2 className="font-display text-4xl md:text-5xl leading-tight" style={{ color: T.ink, fontWeight: 400, letterSpacing: "-0.02em" }}>
                {verdict.verdictHeadline}
              </h2>
            </div>
          </div>
          <p className="text-lg leading-relaxed max-w-3xl ml-[88px]" style={{ color: T.inkSoft }}>
            {verdict.verdictDetail}
          </p>
        </div>
        <div className="col-span-12 md:col-span-4 md:pl-6 md:border-l" style={{ borderColor: T.line }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4" style={{ color: T.inkFade }}>Confidence</div>
          <div className="font-display text-6xl mb-1" style={{ color: T.ink, fontWeight: 300 }}>
            {verdict.confidence}<span className="text-3xl" style={{ color: T.inkFade }}>%</span>
          </div>
          <div className="h-1 w-full mb-6" style={{ background: T.lineSoft }}>
            <div className="h-full transition-all duration-1000" style={{ width: `${verdict.confidence}%`, background: meta.tone }} />
          </div>
          <div className="space-y-2.5">
            {verdict.keyInsights.map((i, idx) => (
              <div key={idx} className="flex gap-2.5 text-sm" style={{ color: T.inkSoft }}>
                <span className="font-mono text-xs pt-0.5" style={{ color: meta.tone }}>→</span>
                <span className="leading-snug">{i}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ───────────────────────── UI: Metric cards ───────────────────────── */
const MetricCard = ({ label, value, sub, accent, delta, big }) => (
  <div className="p-5" style={{ background: T.card, border: `1px solid ${T.line}` }}>
    <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: T.inkFade }}>{label}</div>
    <div className="flex items-baseline gap-2 mb-1">
      <div className="font-display" style={{ color: accent || T.ink, fontWeight: 400, fontSize: big ? "56px" : "40px", lineHeight: 1 }}>
        {value}
      </div>
      {delta && (
        <div className="font-mono text-xs" style={{ color: T.emerald }}>
          <TrendingUp size={12} className="inline" /> {delta}
        </div>
      )}
    </div>
    {sub && <div className="text-xs mt-2" style={{ color: T.inkSoft }}>{sub}</div>}
  </div>
);

/* ───────────────────────── UI: Comparison chart ───────────────────────── */
const ComparisonChart = ({ metrics }) => {
  const data = [
    { name: "Compliant",     Partner: metrics.partner.compliant,     "After AI": metrics.ai.compliant },
    { name: "Partial",       Partner: metrics.partner.partial,       "After AI": metrics.ai.partial },
    { name: "Non-Compliant", Partner: metrics.partner.nonCompliant,  "After AI": metrics.ai.nonCompliant },
    { name: "Not Responded", Partner: metrics.partner.notResponded,  "After AI": metrics.ai.notResponded },
  ];
  return (
    <div className="p-6" style={{ background: T.card, border: `1px solid ${T.line}` }}>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: T.inkFade }}>Before · After</div>
          <h3 className="font-display text-2xl" style={{ color: T.ink, fontWeight: 500 }}>Status distribution shift</h3>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2"><div className="w-3 h-3" style={{ background: T.inkFade }} /><span style={{ color: T.inkSoft }}>Partner</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3" style={{ background: T.ink }} /><span style={{ color: T.inkSoft }}>After AI review</span></div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={T.lineSoft} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: T.inkSoft, fontSize: 11, fontFamily: "IBM Plex Sans" }} axisLine={{ stroke: T.line }} tickLine={false} />
          <YAxis tick={{ fill: T.inkSoft, fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.line}`, fontFamily: "IBM Plex Sans", fontSize: 12 }} cursor={{ fill: T.lineSoft }} />
          <Bar dataKey="Partner" fill={T.inkFade} />
          <Bar dataKey="After AI" fill={T.ink} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ───────────────────────── UI: Before / After Donut pair ───────────────────────── */
const MiniDonut = ({ data, pct, label }) => (
  <div className="flex flex-col items-center">
    <div className="relative">
      <ResponsiveContainer width={130} height={130}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={40} outerRadius={58} paddingAngle={1} stroke="none">
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="font-display text-2xl" style={{ color: T.ink, fontWeight: 400 }}>{pct}%</div>
      </div>
    </div>
    <div className="font-mono text-[9px] uppercase tracking-wider mt-1" style={{ color: T.inkFade }}>{label}</div>
  </div>
);

const ComplianceDonut = ({ metrics }) => {
  const total = metrics.total || 1;
  const makeData = (src) => [
    { name: "Compliant",     value: src.compliant,     fill: T.emerald },
    { name: "Partial",       value: src.partial,       fill: T.amber },
    { name: "Non-Compliant", value: src.nonCompliant,  fill: T.rust },
    { name: "Not Responded", value: src.notResponded,  fill: T.inkFade },
  ].filter(d => d.value > 0);

  const partnerData = makeData(metrics.partner);
  const aiData = makeData(metrics.ai);
  const partnerPct = Math.round((metrics.partner.compliant / total) * 100);
  const aiPct = Math.round((metrics.ai.compliant / total) * 100);
  const uplift = aiPct - partnerPct;

  return (
    <div className="p-6 relative" style={{ background: T.card, border: `1px solid ${T.line}` }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: T.inkFade }}>Compliance comparison</div>
      <h3 className="font-display text-2xl mb-5" style={{ color: T.ink, fontWeight: 500 }}>Before → After AI</h3>
      <div className="flex items-center justify-around gap-2">
        <MiniDonut data={partnerData} pct={partnerPct} label="Partner" />
        <div className="flex flex-col items-center gap-1">
          <ArrowRight size={20} style={{ color: T.inkFade }} />
          {uplift > 0 && <div className="font-mono text-xs font-bold" style={{ color: T.emerald }}>+{uplift}%</div>}
        </div>
        <MiniDonut data={aiData} pct={aiPct} label="After AI" />
      </div>
      <div className="mt-4 pt-4 border-t space-y-1.5" style={{ borderColor: T.lineSoft }}>
        {makeData(metrics.ai).map(d => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2" style={{ background: d.fill }} />
              <span style={{ color: T.inkSoft }}>{d.name}</span>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span style={{ color: T.inkFade }}>{metrics.partner[d.name === "Non-Compliant" ? "nonCompliant" : d.name === "Not Responded" ? "notResponded" : d.name.toLowerCase()]}</span>
              <span style={{ color: T.inkFade }}>→</span>
              <span style={{ color: T.ink }}>{d.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ───────────────────────── UI: Pills ───────────────────────── */
const StatusPill = ({ status, size = "sm" }) => {
  const meta = STATUS_META[status] || STATUS_META["Not Responded"];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider ${size === "sm" ? "text-[10px] px-2 py-1" : "text-xs px-2.5 py-1.5"}`}
          style={{ color: meta.color, background: meta.bg, borderRadius: 0 }}>
      <Icon size={size === "sm" ? 11 : 13} />
      {meta.label}
    </span>
  );
};

const FLAG_META = {
  improved:  { label: "Improved",     color: T.emerald, bg: T.emeraldBg },
  confirmed: { label: "Confirmed",    color: T.inkSoft, bg: T.lineSoft },
  unclear:   { label: "Unclear",      color: T.amber,   bg: T.amberBg },
  attention: { label: "Needs review", color: T.rust,    bg: T.rustBg },
};
const FlagPill = ({ flag }) => {
  const m = FLAG_META[flag] || FLAG_META.confirmed;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5"
          style={{ color: m.color, background: m.bg }}>
      <Sparkles size={10} /> {m.label}
    </span>
  );
};

/* ───────────────────────── UI: Requirements table ───────────────────────── */
const ReqTable = ({ requirements, onOpen, query, setQuery, filter, setFilter, catFilter, setCatFilter, categories }) => {
  const [showPartnerDetail, setShowPartnerDetail] = useState(false);
  return (
    <div className="fade-in">
      <div className="flex items-baseline justify-between mb-5 flex-wrap gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: T.inkFade }}>The line-by-line</div>
          <h3 className="font-display text-3xl" style={{ color: T.ink, fontWeight: 500 }}>Every requirement, reviewed</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2" style={{ background: T.card, border: `1px solid ${T.line}` }}>
            <Search size={14} style={{ color: T.inkFade }} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search requirements…"
              className="bg-transparent outline-none text-sm w-48" style={{ color: T.ink }} />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-transparent outline-none"
            style={{ background: T.card, border: `1px solid ${T.line}`, color: T.ink }}>
            <option value="all">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-transparent outline-none"
            style={{ background: T.card, border: `1px solid ${T.line}`, color: T.ink }}>
            <option value="all">All statuses</option>
            <option value="improved">AI improved</option>
            <option value="unclear">Unclear</option>
            <option value="attention">Needs attention</option>
            <option value="Compliant">Compliant</option>
            <option value="Partial">Partial</option>
            <option value="Non-Compliant">Non-Compliant</option>
            <option value="Not Responded">Not Responded</option>
          </select>
          <button onClick={() => setShowPartnerDetail(!showPartnerDetail)}
            className="flex items-center gap-2 px-3 py-2 text-sm transition-all"
            style={{ background: showPartnerDetail ? T.navyBg : T.card, border: `1px solid ${showPartnerDetail ? T.navy+"40" : T.line}`, color: showPartnerDetail ? T.navy : T.inkSoft }}>
            <Layers size={14} /> {showPartnerDetail ? "Hide responses" : "Show responses"}
          </button>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.line}` }}>
        <div className="grid grid-cols-[80px_1.5fr_2.5fr_120px_140px_140px_30px] gap-4 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.15em] border-b" style={{ color: T.inkFade, borderColor: T.line }}>
          <div>ID</div>
          <div>Category</div>
          <div>Requirement</div>
          <div>Partner</div>
          <div>After AI</div>
          <div>AI flag</div>
          <div></div>
        </div>
        {requirements.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: T.inkFade }}>No requirements match your filter.</div>
        ) : requirements.map((r) => (
          <div key={r.id} className="border-b" style={{ borderColor: T.lineSoft }}>
            <button onClick={() => onOpen(r)}
              className="w-full grid grid-cols-[80px_1.5fr_2.5fr_120px_140px_140px_30px] gap-4 px-5 py-4 items-start text-left transition-colors"
              style={{ background: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = T.lineSoft}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div className="font-mono text-xs pt-0.5" style={{ color: T.ink }}>{r.id}</div>
              <div className="text-xs font-mono uppercase tracking-wider pt-1" style={{ color: T.inkSoft }}>{r.category}</div>
              <div className="text-sm leading-snug" style={{ color: T.ink }}>{r.requirement}</div>
              <div><StatusPill status={r.partnerResponse} /></div>
              <div><StatusPill status={r.finalStatus || r.aiRecommendedStatus || r.partnerResponse} /></div>
              <div>{r.aiFlag && <FlagPill flag={r.aiFlag} />}</div>
              <div className="pt-1"><ChevronRight size={16} style={{ color: T.inkFade }} /></div>
            </button>
            {showPartnerDetail && (
              <div className="px-5 pb-4 grid grid-cols-2 gap-3" style={{ background: T.lineSoft + "60" }}>
                <div className="p-3" style={{ background: T.card, border: `1px solid ${T.line}` }}>
                  <div className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color: T.inkFade }}>Partner said</div>
                  <div className="text-xs leading-relaxed" style={{ color: r.partnerComment ? T.inkSoft : T.inkFade, fontStyle: r.partnerComment ? "normal" : "italic" }}>{r.partnerComment || "(no comment)"}</div>
                </div>
                <div className="p-3" style={{ background: "#FBF7EC", border: `1px solid ${T.line}` }}>
                  <div className="font-mono text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: T.inkFade }}><Sparkles size={8} /> AI recommends</div>
                  <div className="text-xs leading-relaxed" style={{ color: T.ink }}>{r.aiRecommendedComment || r.partnerComment || "—"}</div>
                  {r.aiReasoning && <div className="text-[10px] mt-2 pt-2 border-t leading-relaxed" style={{ color: T.inkFade, borderColor: T.lineSoft }}>{r.aiReasoning}</div>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ───────────────────────── UI: Detail panel ───────────────────────── */
const DetailPanel = ({ req, onClose, onUpdate }) => {
  const [editComment, setEditComment] = useState(req.finalComment || req.aiRecommendedComment || req.partnerComment);
  const [editStatus, setEditStatus] = useState(req.finalStatus || req.aiRecommendedStatus || req.partnerResponse);

  useEffect(() => {
    setEditComment(req.finalComment || req.aiRecommendedComment || req.partnerComment);
    setEditStatus(req.finalStatus || req.aiRecommendedStatus || req.partnerResponse);
  }, [req.id]);

  const acceptAI = () => {
    onUpdate({ ...req, finalStatus: req.aiRecommendedStatus, finalComment: req.aiRecommendedComment });
    onClose();
  };
  const revertPartner = () => {
    onUpdate({ ...req, finalStatus: req.partnerResponse, finalComment: req.partnerComment });
    onClose();
  };
  const saveEdit = () => {
    onUpdate({ ...req, finalStatus: editStatus, finalComment: editComment });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end fade-in" style={{ background: "rgba(20,18,15,0.4)" }} onClick={onClose}>
      <div className="w-full max-w-2xl h-full overflow-y-auto" style={{ background: T.bg }} onClick={e => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="font-mono text-xs mb-2" style={{ color: T.inkFade }}>{req.id} · {req.category}</div>
              <h2 className="font-display text-2xl leading-snug" style={{ color: T.ink, fontWeight: 500 }}>{req.requirement}</h2>
            </div>
            <button onClick={onClose} className="p-2 -mr-2" style={{ color: T.inkSoft }}><X size={20} /></button>
          </div>

          <div className="p-5 mb-5" style={{ background: T.card, border: `1px solid ${T.line}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: T.inkFade }}>Partner said</div>
              <StatusPill status={req.partnerResponse} />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: req.partnerComment ? T.ink : T.inkFade, fontStyle: req.partnerComment ? "normal" : "italic" }}>
              {req.partnerComment || "(no comment provided)"}
            </p>
          </div>

          {req.aiRecommendedStatus && (
            <div className="p-5 mb-5 relative" style={{ background: "#FBF7EC", border: `1px solid ${T.ink}` }}>
              <div className="absolute -top-3 left-5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1" style={{ background: T.ink, color: T.bg }}>
                <Sparkles size={10} /> AI Architect
              </div>
              <div className="flex items-center gap-2 mb-3 mt-1 flex-wrap">
                <StatusPill status={req.aiRecommendedStatus} />
                {req.aiFlag && <FlagPill flag={req.aiFlag} />}
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5" style={{ color: T.inkFade, background: T.lineSoft }}>
                  {req.aiClarity} · {req.aiFeasibility}
                </span>
              </div>
              <div className="mb-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: T.inkFade }}>Recommended response</div>
                <p className="text-sm leading-relaxed italic" style={{ color: T.ink }}>"{req.aiRecommendedComment}"</p>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: T.inkFade }}>Reasoning</div>
                <p className="text-sm leading-relaxed" style={{ color: T.inkSoft }}>{req.aiReasoning}</p>
              </div>
            </div>
          )}

          <div className="p-5 mb-5" style={{ background: T.card, border: `1px solid ${T.line}` }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: T.inkFade }}>Final response (editable)</div>
            <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
              className="w-full mb-3 px-3 py-2 text-sm outline-none"
              style={{ background: T.bg, border: `1px solid ${T.line}`, color: T.ink }}>
              {["Compliant", "Partial", "Non-Compliant", "Not Responded"].map(s => <option key={s}>{s}</option>)}
            </select>
            <textarea value={editComment} onChange={e => setEditComment(e.target.value)} rows={4}
              className="w-full px-3 py-2 text-sm outline-none leading-relaxed"
              style={{ background: T.bg, border: `1px solid ${T.line}`, color: T.ink, resize: "vertical" }} />
          </div>

          <div className="flex gap-2">
            {req.aiRecommendedStatus && (
              <button onClick={acceptAI} className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium"
                style={{ background: T.ink, color: T.bg }}>
                <Check size={14} /> Accept AI recommendation
              </button>
            )}
            <button onClick={saveEdit} className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium"
              style={{ background: T.card, border: `1px solid ${T.ink}`, color: T.ink }}>
              <Edit3 size={14} /> Save edits
            </button>
            <button onClick={revertPartner} className="flex items-center justify-center gap-2 px-4 py-3 text-sm"
              style={{ color: T.inkSoft, border: `1px solid ${T.line}` }}>
              <RotateCcw size={14} /> Partner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



/* ───────────────────────── Executive Report Generator ───────────────────────── */
const generateExecReport = async (requirements, verdict, metrics, platform, apiKey, referenceDoc, refDocName) => {
  const finalStatus = (r) => r.finalStatus || r.aiRecommendedStatus || r.partnerResponse;
  const improved = requirements.filter(r => r.aiFlag === "improved");
  const attention = requirements.filter(r => r.aiFlag === "attention" || r.aiFlag === "unclear");
  const nonCompliant = requirements.filter(r => finalStatus(r) === "Non-Compliant");
  const categories = [...new Set(requirements.map(r => r.category))];
  const catSummary = categories.map(cat => {
    const items = requirements.filter(r => r.category === cat);
    return { category: cat, total: items.length,
      compliant: items.filter(r => finalStatus(r) === "Compliant").length,
      partial: items.filter(r => finalStatus(r) === "Partial").length,
      nonCompliant: items.filter(r => finalStatus(r) === "Non-Compliant").length };
  });

  const prompt = `You are a senior compliance consultant preparing an executive summary report for leadership. Based on the compliance review data below, generate a structured executive report.

ENGAGEMENT CONTEXT:
- Platform: ${platform}
- Total requirements reviewed: ${metrics.total}
- Reference document provided: ${refDocName ? `Yes — "${refDocName}"` : "No"}
- Date: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}

COMPLIANCE SCORES:
- Partner (before AI review): ${metrics.partner.compliant} compliant, ${metrics.partner.partial} partial, ${metrics.partner.nonCompliant} non-compliant, ${metrics.partner.notResponded} not responded out of ${metrics.total}
- After AI review: ${metrics.ai.compliant} compliant, ${metrics.ai.partial} partial, ${metrics.ai.nonCompliant} non-compliant, ${metrics.ai.notResponded} not responded
- AI confidence: ${verdict?.confidence || "N/A"}%
- AI verdict: ${verdict?.verdict || "N/A"}

CATEGORY BREAKDOWN:
${JSON.stringify(catSummary, null, 2)}

AI-IMPROVED ITEMS (${improved.length}):
${improved.slice(0, 10).map(r => `- ${r.id} (${r.category}): ${r.partnerResponse} → ${finalStatus(r)}. Reason: ${r.aiReasoning}`).join("\n")}

ITEMS NEEDING ATTENTION (${attention.length}):
${attention.slice(0, 10).map(r => `- ${r.id} (${r.category}): "${r.requirement}" — ${r.aiReasoning}`).join("\n")}

REMAINING NON-COMPLIANT (${nonCompliant.length}):
${nonCompliant.map(r => `- ${r.id} (${r.category}): "${r.requirement}" — ${r.aiReasoning || r.partnerComment}`).join("\n")}

${refDocName ? `REFERENCE DOCUMENT: "${refDocName}" was provided as a baseline for comparison.` : ""}

Return ONLY a JSON object with this exact structure:
{
  "title": "Executive Compliance Assessment Report",
  "subtitle": "one-line subtitle describing the engagement",
  "executiveSummary": "3-4 paragraph executive summary covering scope, findings, and recommendation (each paragraph separated by \\n\\n)",
  "scopeOfEngagement": "2-3 paragraphs describing what was assessed, how, and the methodology",
  "vendorOverview": "2-3 paragraphs on the vendor/partner's overall response quality, strengths, and gaps",
  "complianceScoreAnalysis": {
    "beforeSummary": "1-2 sentences on the partner's initial compliance position",
    "afterSummary": "1-2 sentences on the post-AI-review position",
    "upliftNarrative": "2-3 sentences explaining what changed and why"
  },
  "keyAreasAddressed": [
    { "area": "area name", "detail": "2-3 sentences on what AI identified and improved", "impact": "high" | "medium" | "low" }
  ],
  "remainingRisks": [
    { "risk": "risk title", "detail": "2-3 sentences", "severity": "critical" | "high" | "medium", "recommendation": "specific recommendation" }
  ],
  "vendorQueries": [
    { "id": 1, "category": "category", "question": "specific question to ask the vendor", "context": "why this is needed", "priority": "high" | "medium" | "low" }
  ],
  "supportingDocuments": "paragraph about the reference documents reviewed and how they were used in the assessment",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4", "recommendation 5"],
  "nextSteps": ["step 1", "step 2", "step 3"]
}`;

  const body = { model: CLAUDE_MODEL, max_tokens: 8000, messages: [{ role: "user", content: prompt }] };
  let resp;
  if (apiKey && apiKey.trim()) {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey.trim(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify(body),
    });
  } else {
    resp = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }
  if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.error?.message || `API error ${resp.status}`); }
  const data = await resp.json();
  const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("\n");
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
};

/* ───────────────────────── Build Executive PDF ───────────────────────── */
const buildExecPDF = (report, metrics, verdict, platform) => {
  const d = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const partnerPct = metrics.total ? Math.round((metrics.partner.compliant / metrics.total) * 100) : 0;
  const aiPct = metrics.total ? Math.round((metrics.ai.compliant / metrics.total) * 100) : 0;

  const areasHTML = (report.keyAreasAddressed || []).map((a, i) => `
    <div style="padding:12px 16px;border-left:3px solid ${a.impact==='high'?'#2D5F3F':a.impact==='medium'?'#B8731F':'#5A544A'};margin-bottom:10px;background:#FDFBF5">
      <div style="font-weight:600;margin-bottom:4px">${i+1}. ${a.area} <span style="font-size:10px;padding:2px 8px;background:${a.impact==='high'?'#E3EDE2':a.impact==='medium'?'#F5E7CF':'#EEE8D8'};color:${a.impact==='high'?'#2D5F3F':'#5A544A'};text-transform:uppercase;letter-spacing:1px;margin-left:8px">${a.impact}</span></div>
      <div style="font-size:13px;color:#5A544A">${a.detail}</div>
    </div>`).join('');

  const risksHTML = (report.remainingRisks || []).map(r => `
    <tr>
      <td style="padding:10px;border:1px solid #E3DCC9;font-weight:600">${r.risk}</td>
      <td style="padding:10px;border:1px solid #E3DCC9;font-size:12px;color:${r.severity==='critical'?'#8B2C1A':'#B8731F'};font-weight:600;text-transform:uppercase">${r.severity}</td>
      <td style="padding:10px;border:1px solid #E3DCC9;font-size:12px;color:#5A544A">${r.detail}</td>
      <td style="padding:10px;border:1px solid #E3DCC9;font-size:12px">${r.recommendation}</td>
    </tr>`).join('');

  const queriesHTML = (report.vendorQueries || []).map(q => `
    <tr>
      <td style="padding:8px;border:1px solid #E3DCC9;font-family:monospace;font-size:11px">${q.id}</td>
      <td style="padding:8px;border:1px solid #E3DCC9;font-size:12px">${q.category}</td>
      <td style="padding:8px;border:1px solid #E3DCC9;font-size:12px;font-weight:600">${q.question}</td>
      <td style="padding:8px;border:1px solid #E3DCC9;font-size:11px;color:#5A544A">${q.context}</td>
      <td style="padding:8px;border:1px solid #E3DCC9;font-size:11px;text-transform:uppercase;color:${q.priority==='high'?'#8B2C1A':'#B8731F'}">${q.priority}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${report.title}</title>
    <style>
      @page{margin:60px 50px;size:A4}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#14120F;margin:0;padding:50px;line-height:1.7;font-size:14px}
      .cover{text-align:center;padding:120px 40px 80px;border-bottom:3px solid #14120F;margin-bottom:40px;page-break-after:always}
      .cover h1{font-size:36px;font-weight:300;margin-bottom:8px;letter-spacing:-1px}
      .cover .sub{font-size:16px;color:#5A544A;margin-bottom:32px}
      .cover .meta{font-size:12px;color:#8A8175;text-transform:uppercase;letter-spacing:2px}
      h2{font-size:22px;font-weight:600;margin-top:40px;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #14120F}
      h3{font-size:16px;font-weight:600;margin-top:24px;margin-bottom:10px;color:#1B3B5F}
      .kpi-row{display:flex;gap:20px;margin:20px 0 30px}
      .kpi{flex:1;padding:20px;text-align:center;border:1px solid #E3DCC9;background:#FDFBF5}
      .kpi-val{font-size:42px;font-weight:700;line-height:1}
      .kpi-lab{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#8A8175;margin-top:6px}
      .score-compare{display:flex;gap:24px;margin:20px 0}
      .score-box{flex:1;padding:20px;border:1px solid #E3DCC9}
      .score-box.after{background:#FBF7EC;border-color:#14120F}
      table{width:100%;border-collapse:collapse;margin:12px 0 24px}
      th{background:#14120F;color:#F7F3EA;padding:10px;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;text-align:left}
      .rec{padding:8px 0;border-bottom:1px solid #EFE8D6;font-size:13px}
      .rec::before{content:'→ ';color:#2D5F3F;font-weight:700}
      .footer{margin-top:60px;padding-top:20px;border-top:1px solid #E3DCC9;font-size:10px;color:#8A8175;text-align:center}
    </style></head><body>
    <div class="cover">
      <div class="meta">Confidential · ${platform} Assessment</div>
      <h1>${report.title}</h1>
      <div class="sub">${report.subtitle}</div>
      <div class="meta">${d} · Vanguard Compliance Intelligence</div>
      <div style="margin-top:60px">
        <div style="display:inline-block;padding:16px 32px;background:#14120F;color:#F7F3EA;font-size:36px;font-weight:300">${aiPct}%</div>
        <div style="font-size:12px;color:#8A8175;margin-top:8px;text-transform:uppercase;letter-spacing:2px">Final Compliance Score</div>
      </div>
    </div>

    <h2>1. Executive Summary</h2>
    ${(report.executiveSummary || '').split('\n\n').map(p => `<p>${p}</p>`).join('')}

    <div class="kpi-row">
      <div class="kpi"><div class="kpi-val">${metrics.total}</div><div class="kpi-lab">Requirements</div></div>
      <div class="kpi"><div class="kpi-val" style="color:#2D5F3F">${partnerPct}%</div><div class="kpi-lab">Partner Score</div></div>
      <div class="kpi"><div class="kpi-val" style="color:#2D5F3F">${aiPct}%</div><div class="kpi-lab">After AI Score</div></div>
      <div class="kpi"><div class="kpi-val" style="color:#2D5F3F">+${aiPct - partnerPct}%</div><div class="kpi-lab">Uplift</div></div>
      <div class="kpi"><div class="kpi-val">${verdict?.confidence || 0}%</div><div class="kpi-lab">AI Confidence</div></div>
    </div>

    <h2>2. Scope of Engagement</h2>
    ${(report.scopeOfEngagement || '').split('\n\n').map(p => `<p>${p}</p>`).join('')}

    <h2>3. Vendor Response Overview</h2>
    ${(report.vendorOverview || '').split('\n\n').map(p => `<p>${p}</p>`).join('')}

    <h2>4. Compliance Score Analysis</h2>
    <div class="score-compare">
      <div class="score-box">
        <h3 style="margin-top:0">Before AI Review</h3>
        <p style="font-size:13px;color:#5A544A">${report.complianceScoreAnalysis?.beforeSummary || ''}</p>
        <div style="font-size:48px;font-weight:700;color:#5A544A">${partnerPct}%</div>
      </div>
      <div class="score-box after">
        <h3 style="margin-top:0">After AI Review</h3>
        <p style="font-size:13px;color:#5A544A">${report.complianceScoreAnalysis?.afterSummary || ''}</p>
        <div style="font-size:48px;font-weight:700;color:#2D5F3F">${aiPct}%</div>
      </div>
    </div>
    <p>${report.complianceScoreAnalysis?.upliftNarrative || ''}</p>

    <h2>5. Key Areas Addressed by AI</h2>
    <p style="color:#5A544A;font-size:13px">The AI review identified and addressed the following key areas that represent significant improvements or corrections.</p>
    ${areasHTML}

    <h2>6. Remaining Risks</h2>
    <table><tr><th>Risk</th><th>Severity</th><th>Detail</th><th>Recommendation</th></tr>${risksHTML}</table>

    <h2>7. Recommended Vendor Follow-Up Queries</h2>
    <p style="color:#5A544A;font-size:13px">The following questions should be raised with the vendor to obtain additional information or supporting evidence.</p>
    <table><tr><th>#</th><th>Category</th><th>Question</th><th>Context</th><th>Priority</th></tr>${queriesHTML}</table>

    <h2>8. Supporting Documents</h2>
    <p>${report.supportingDocuments || 'No reference documents were provided for this assessment.'}</p>

    <h2>9. Recommendations</h2>
    ${(report.recommendations || []).map(r => `<div class="rec">${r}</div>`).join('')}

    <h2>10. Next Steps</h2>
    ${(report.nextSteps || []).map((s, i) => `<div class="rec"><strong>Step ${i+1}:</strong> ${s}</div>`).join('')}

    <div class="footer">
      <p>Vanguard · Compliance Intelligence · Powered by Claude · ${d}</p>
      <p>This report is auto-generated and should be reviewed by qualified compliance professionals before distribution.</p>
    </div>
  </body></html>`;

  const printWin = window.open('', '_blank');
  printWin.document.write(html);
  printWin.document.close();
  setTimeout(() => printWin.print(), 600);
};

/* ───────────────────────── Build Executive PPTX (HTML slides) ───────────────────────── */
const buildExecPPTX = (report, metrics, verdict, platform) => {
  const d = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const partnerPct = metrics.total ? Math.round((metrics.partner.compliant / metrics.total) * 100) : 0;
  const aiPct = metrics.total ? Math.round((metrics.ai.compliant / metrics.total) * 100) : 0;

  const slide = (content, bg = "#14120F", color = "#F7F3EA") => `
    <div style="width:960px;height:540px;background:${bg};color:${color};padding:48px 60px;display:flex;flex-direction:column;justify-content:center;page-break-after:always;position:relative;box-sizing:border-box">
      ${content}
      <div style="position:absolute;bottom:20px;right:60px;font-size:10px;opacity:.5;font-family:monospace">Vanguard · ${d}</div>
    </div>`;

  const areasSlides = (report.keyAreasAddressed || []).map((a, i) => slide(`
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;opacity:.5;margin-bottom:20px">Key Area ${i+1}</div>
    <div style="font-size:36px;font-weight:300;margin-bottom:16px;line-height:1.2">${a.area}</div>
    <div style="font-size:15px;line-height:1.8;opacity:.8;max-width:700px">${a.detail}</div>
    <div style="margin-top:24px;padding:8px 16px;display:inline-block;font-size:11px;text-transform:uppercase;letter-spacing:2px;background:${a.impact==='high'?'#2D5F3F':a.impact==='medium'?'#B8731F':'#5A544A'}">${a.impact} impact</div>
  `)).join('');

  const queriesSlide = (report.vendorQueries || []).slice(0, 6).map(q => `
    <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.1);display:flex;gap:12px;font-size:13px">
      <span style="opacity:.4;font-family:monospace">${q.id}.</span>
      <div style="flex:1">
        <div style="font-weight:600;margin-bottom:3px">${q.question}</div>
        <div style="opacity:.5;font-size:11px">${q.category} · ${q.priority} priority</div>
      </div>
    </div>`).join('');

  const risksSlide = (report.remainingRisks || []).slice(0, 5).map(r => `
    <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.1);font-size:13px">
      <div style="font-weight:600;margin-bottom:3px;color:${r.severity==='critical'?'#f06b7a':'#e8a44a'}">${r.risk} — ${r.severity}</div>
      <div style="opacity:.7;font-size:12px">${r.recommendation}</div>
    </div>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${report.title} - Slides</title>
    <style>@page{margin:0;size:960px 540px}body{margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif}@media print{div{page-break-inside:avoid}}</style></head><body>

    ${slide(`
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:4px;opacity:.4;margin-bottom:40px">${platform} · Compliance Assessment</div>
      <div style="font-size:44px;font-weight:300;line-height:1.15;margin-bottom:16px">${report.title}</div>
      <div style="font-size:16px;opacity:.6">${report.subtitle}</div>
      <div style="margin-top:40px;font-size:12px;opacity:.4">${d} · Vanguard Compliance Intelligence</div>
    `)}

    ${slide(`
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;opacity:.5;margin-bottom:24px">Executive Summary</div>
      <div style="font-size:15px;line-height:1.8;opacity:.85">${(report.executiveSummary || '').split('\n\n')[0] || ''}</div>
      <div style="font-size:14px;line-height:1.8;opacity:.6;margin-top:16px">${(report.executiveSummary || '').split('\n\n').slice(1).join(' ').slice(0, 300)}${(report.executiveSummary || '').length > 400 ? '…' : ''}</div>
    `)}

    ${slide(`
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;opacity:.5;margin-bottom:24px">Compliance Scores</div>
      <div style="display:flex;gap:32px;align-items:center;margin-bottom:24px">
        <div style="text-align:center">
          <div style="font-size:72px;font-weight:200;opacity:.5">${partnerPct}%</div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;opacity:.4">Partner Score</div>
        </div>
        <div style="font-size:32px;opacity:.3">→</div>
        <div style="text-align:center">
          <div style="font-size:72px;font-weight:200;color:#7dcd6e">${aiPct}%</div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;opacity:.4">After AI Review</div>
        </div>
        <div style="text-align:center;padding:20px 32px;background:rgba(125,205,110,.15)">
          <div style="font-size:48px;font-weight:700;color:#7dcd6e">+${aiPct - partnerPct}%</div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;opacity:.6">Uplift</div>
        </div>
      </div>
      <div style="font-size:14px;opacity:.6;line-height:1.6">${report.complianceScoreAnalysis?.upliftNarrative || ''}</div>
    `)}

    ${areasSlides}

    ${slide(`
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;opacity:.5;margin-bottom:20px">Remaining Risks</div>
      ${risksSlide}
    `)}

    ${slide(`
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;opacity:.5;margin-bottom:20px">Vendor Follow-Up Queries</div>
      ${queriesSlide}
    `)}

    ${slide(`
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;opacity:.5;margin-bottom:24px">Recommendations & Next Steps</div>
      ${(report.recommendations || []).slice(0, 5).map((r, i) => `<div style="padding:8px 0;font-size:14px;opacity:.8;border-bottom:1px solid rgba(255,255,255,.08)"><span style="opacity:.4;font-family:monospace;margin-right:12px">${i+1}</span>${r}</div>`).join('')}
      <div style="margin-top:20px;font-size:11px;text-transform:uppercase;letter-spacing:2px;opacity:.4">Next Steps</div>
      ${(report.nextSteps || []).slice(0, 3).map((s, i) => `<div style="padding:6px 0;font-size:13px;opacity:.6">→ ${s}</div>`).join('')}
    `)}

    ${slide(`
      <div style="text-align:center">
        <div style="font-size:48px;font-weight:200;margin-bottom:16px">Thank you</div>
        <div style="font-size:14px;opacity:.5">${report.title}</div>
        <div style="margin-top:40px;font-size:12px;opacity:.3">Vanguard · Compliance Intelligence · Powered by Claude</div>
      </div>
    `)}
  </body></html>`;

  const printWin = window.open('', '_blank');
  printWin.document.write(html);
  printWin.document.close();
  setTimeout(() => printWin.print(), 600);
};

/* ───────────────────────── UI: Executive Report Panel ───────────────────────── */
const ExecReportPanel = ({ report, metrics, verdict, platform, onClose, onPdf, onPptx }) => {
  if (!report) return null;
  const partnerPct = metrics.total ? Math.round((metrics.partner.compliant / metrics.total) * 100) : 0;
  const aiPct = metrics.total ? Math.round((metrics.ai.compliant / metrics.total) * 100) : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center fade-in overflow-y-auto" style={{ background: "rgba(20,18,15,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-4xl my-8 mx-4" style={{ background: T.bg }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-8 border-b" style={{ borderColor: T.line, background: T.ink, color: T.bg }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3 opacity-50">{platform} · Executive Report</div>
              <div className="font-display text-3xl mb-2" style={{ fontWeight: 400 }}>{report.title}</div>
              <div className="text-sm opacity-60">{report.subtitle}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onPdf} className="flex items-center gap-2 px-3 py-2 text-xs font-mono" style={{ background: "rgba(255,255,255,.1)", color: T.bg }}>
                <FileDown size={12} /> PDF
              </button>
              <button onClick={onPptx} className="flex items-center gap-2 px-3 py-2 text-xs font-mono" style={{ background: "rgba(255,255,255,.1)", color: T.bg }}>
                <Presentation size={12} /> PPT
              </button>
              <button onClick={onClose} className="p-2 opacity-50 hover:opacity-100"><X size={18} /></button>
            </div>
          </div>
          {/* Score strip */}
          <div className="flex gap-6 mt-6">
            <div className="text-center"><div className="font-display text-4xl opacity-50">{partnerPct}%</div><div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mt-1">Partner</div></div>
            <div className="flex items-center opacity-30">→</div>
            <div className="text-center"><div className="font-display text-4xl" style={{ color: "#7dcd6e" }}>{aiPct}%</div><div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mt-1">After AI</div></div>
            <div className="text-center px-4 py-2" style={{ background: "rgba(125,205,110,.15)" }}><div className="font-display text-3xl" style={{ color: "#7dcd6e" }}>+{aiPct - partnerPct}%</div><div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mt-1">Uplift</div></div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Executive Summary */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: T.inkFade }}>Executive Summary</div>
            {(report.executiveSummary || '').split('\n\n').map((p, i) => <p key={i} className="text-sm leading-relaxed mb-3" style={{ color: T.inkSoft }}>{p}</p>)}
          </div>

          {/* Key Areas */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: T.inkFade }}>Key Areas Addressed</div>
            <div className="space-y-3">
              {(report.keyAreasAddressed || []).map((a, i) => (
                <div key={i} className="p-4 border-l-3" style={{ background: T.card, borderLeft: `3px solid ${a.impact==='high'?T.emerald:a.impact==='medium'?T.amber:T.inkFade}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm font-medium" style={{ color: T.ink }}>{a.area}</div>
                    <span className="font-mono text-[9px] uppercase px-2 py-0.5" style={{ background: a.impact==='high'?T.emeraldBg:T.amberBg, color: a.impact==='high'?T.emerald:T.amber }}>{a.impact}</span>
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: T.inkSoft }}>{a.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Remaining Risks */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: T.inkFade }}>Remaining Risks</div>
            <div className="space-y-2">
              {(report.remainingRisks || []).map((r, i) => (
                <div key={i} className="p-4" style={{ background: T.card, border: `1px solid ${T.line}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm font-medium" style={{ color: r.severity==='critical'?T.rust:T.amber }}>{r.risk}</div>
                    <span className="font-mono text-[9px] uppercase px-2 py-0.5" style={{ background: r.severity==='critical'?T.rustBg:T.amberBg, color: r.severity==='critical'?T.rust:T.amber }}>{r.severity}</span>
                  </div>
                  <div className="text-xs mb-2" style={{ color: T.inkSoft }}>{r.detail}</div>
                  <div className="text-xs font-medium" style={{ color: T.emerald }}>→ {r.recommendation}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Queries */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: T.inkFade }}>
              <MessageSquare size={12} className="inline mr-1" /> Recommended Vendor Follow-Up Queries
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.line}` }}>
              {(report.vendorQueries || []).map((q, i) => (
                <div key={i} className="px-5 py-4 border-b flex gap-3" style={{ borderColor: T.lineSoft }}>
                  <div className="font-mono text-xs pt-0.5" style={{ color: T.inkFade }}>{q.id}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1" style={{ color: T.ink }}>{q.question}</div>
                    <div className="text-xs" style={{ color: T.inkSoft }}>{q.context}</div>
                    <div className="flex gap-3 mt-2 text-[10px] font-mono uppercase tracking-wider">
                      <span style={{ color: T.inkFade }}>{q.category}</span>
                      <span style={{ color: q.priority==='high'?T.rust:T.amber }}>{q.priority} priority</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supporting Documents */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: T.inkFade }}>Supporting Documents</div>
            <p className="text-sm leading-relaxed" style={{ color: T.inkSoft }}>{report.supportingDocuments}</p>
          </div>

          {/* Recommendations */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: T.inkFade }}>Recommendations</div>
            <div className="space-y-2">
              {(report.recommendations || []).map((r, i) => (
                <div key={i} className="flex gap-3 p-3" style={{ background: i%2===0 ? T.card : 'transparent' }}>
                  <span className="font-mono text-xs" style={{ color: T.emerald }}>→</span>
                  <span className="text-sm" style={{ color: T.ink }}>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="p-5" style={{ background: T.ink, color: T.bg }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3 opacity-50">Next Steps</div>
            {(report.nextSteps || []).map((s, i) => (
              <div key={i} className="flex gap-3 py-2 border-b" style={{ borderColor: "rgba(255,255,255,.1)" }}>
                <span className="font-mono text-xs opacity-40">{i+1}</span>
                <span className="text-sm opacity-80">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t flex items-center justify-between" style={{ borderColor: T.line }}>
          <span className="font-mono text-[10px]" style={{ color: T.inkFade }}>Vanguard · Compliance Intelligence</span>
          <div className="flex gap-2">
            <button onClick={onPdf} className="flex items-center gap-2 px-4 py-2 text-sm font-medium" style={{ background: T.ink, color: T.bg }}>
              <FileDown size={14} /> Download PDF
            </button>
            <button onClick={onPptx} className="flex items-center gap-2 px-4 py-2 text-sm font-medium" style={{ background: T.card, border: `1px solid ${T.ink}`, color: T.ink }}>
              <Presentation size={14} /> Download PPT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── Main App ───────────────────────── */
export default function App() {
  const [view, setView] = useState("upload");
  const [platform, setPlatform] = useState("Azure");
  const [requirements, setRequirements] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [sheetName, setSheetName] = useState(null);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [openReq, setOpenReq] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem("vanguard_api_key") || ""; } catch { return ""; }
  });
  const [referenceDoc, setReferenceDoc] = useState("");
  const [refDocName, setRefDocName] = useState("");
  const [execReport, setExecReport] = useState(null);
  const [execLoading, setExecLoading] = useState(false);
  const [showExecReport, setShowExecReport] = useState(false);

  useEffect(() => {
    try { if (apiKey) localStorage.setItem("vanguard_api_key", apiKey); else localStorage.removeItem("vanguard_api_key"); } catch {}
  }, [apiKey]);

  const runReview = async (reqs, wb, sn) => {
    setView("analysing");
    try {
      setStep("Parsing questionnaire…");
      await new Promise(r => setTimeout(r, 300));
      setStep("Cross-referencing Azure service capabilities…");
      const result = await reviewWithClaude(reqs, platform, apiKey, referenceDoc);
      setStep("Composing verdict…");
      const merged = reqs.map(r => {
        const review = result.reviews.find(x => String(x.id) === String(r.id));
        if (!review) return { ...r, aiFlag: "confirmed", aiRecommendedStatus: r.partnerResponse, aiRecommendedComment: r.partnerComment };
        return {
          ...r,
          aiClarity: review.clarity,
          aiAccuracy: review.accuracy,
          aiFeasibility: review.feasibility,
          aiRecommendedStatus: review.recommendedStatus,
          aiRecommendedComment: review.recommendedComment,
          aiReasoning: review.reasoning,
          aiFlag: review.aiFlag,
          finalStatus: review.recommendedStatus,
          finalComment: review.recommendedComment,
        };
      });
      setRequirements(merged);
      setVerdict(result);
      setWorkbook(wb);
      setSheetName(sn);
      setView("dashboard");
    } catch (e) {
      console.error(e);
      setError(e.message || "AI review failed. Please try again.");
      setView("upload");
    }
  };

  const handleFile = async (file) => {
    setError("");
    try {
      const buf = await file.arrayBuffer();
      const { requirements: reqs, workbook: wb, sheetName: sn } = parseWorkbook(buf);
      if (!reqs.length) { setError("No requirements found in this file. Check the column headers."); return; }
      runReview(reqs, wb, sn);
    } catch (e) { setError("Could not read file. Please upload a valid Excel or CSV."); }
  };

  const handleSample = () => {
    const reqs = SAMPLE_DATA.map((r, i) => ({ ...r, _rowIndex: i }));
    runReview(reqs, null, null);
  };

  const handleReset = () => {
    setView("upload"); setRequirements([]); setVerdict(null); setWorkbook(null); setError(""); setQuery(""); setFilter("all"); setCatFilter("all");
  };

  const handleGenerateExecReport = async () => {
    setExecLoading(true);
    try {
      const report = await generateExecReport(requirements, verdict, metrics, platform, apiKey, referenceDoc, refDocName);
      setExecReport(report);
      setShowExecReport(true);
    } catch (e) {
      console.error(e);
      setError("Failed to generate executive report: " + e.message);
    } finally {
      setExecLoading(false);
    }
  };

  const handleExport = () => {
    exportExcel(workbook, sheetName, requirements);
  };

  const updateReq = (updated) => {
    setRequirements(prev => prev.map(r => r.id === updated.id ? updated : r));
    setOpenReq(null);
  };

  const metrics = useMemo(() => {
    const count = (arr, key, val) => arr.filter(r => (r[key] || "Not Responded") === val).length;
    const responded = (arr) => arr.filter(r => (r.partnerResponse || "") !== "Not Responded").length;
    const finalStatus = (r) => r.finalStatus || r.aiRecommendedStatus || r.partnerResponse;
    return {
      total: requirements.length,
      responded: responded(requirements),
      notResponded: requirements.length - responded(requirements),
      partner: {
        compliant:    count(requirements, "partnerResponse", "Compliant"),
        partial:      count(requirements, "partnerResponse", "Partial"),
        nonCompliant: count(requirements, "partnerResponse", "Non-Compliant"),
        notResponded: count(requirements, "partnerResponse", "Not Responded"),
      },
      ai: {
        compliant:    requirements.filter(r => finalStatus(r) === "Compliant").length,
        partial:      requirements.filter(r => finalStatus(r) === "Partial").length,
        nonCompliant: requirements.filter(r => finalStatus(r) === "Non-Compliant").length,
        notResponded: requirements.filter(r => finalStatus(r) === "Not Responded").length,
      },
      improved: requirements.filter(r => r.aiFlag === "improved").length,
      needsAttention: requirements.filter(r => r.aiFlag === "attention" || r.aiFlag === "unclear").length,
    };
  }, [requirements]);

  const categories = useMemo(() => [...new Set(requirements.map(r => r.category))], [requirements]);

  const filtered = useMemo(() => {
    let list = requirements;
    if (query) list = list.filter(r => (r.requirement + r.id + r.category).toLowerCase().includes(query.toLowerCase()));
    if (catFilter !== "all") list = list.filter(r => r.category === catFilter);
    if (filter === "improved") list = list.filter(r => r.aiFlag === "improved");
    else if (filter === "unclear") list = list.filter(r => r.aiFlag === "unclear");
    else if (filter === "attention") list = list.filter(r => r.aiFlag === "attention");
    else if (filter !== "all") list = list.filter(r => (r.finalStatus || r.aiRecommendedStatus || r.partnerResponse) === filter);
    return list;
  }, [requirements, query, filter, catFilter]);

  const uplift = metrics.ai.compliant - metrics.partner.compliant;

  return (
    <div className="font-body min-h-screen grain" style={{ background: T.bg, color: T.ink }}>
      <Header platform={platform} onPlatformChange={setPlatform} onReset={handleReset} hasData={view === "dashboard"} onExport={handleExport} onExportPdf={() => exportFormatted(requirements, verdict, metrics, "pdf")} onExportWord={() => exportFormatted(requirements, verdict, metrics, "word")} apiKey={apiKey} onApiKeyChange={setApiKey} />

      {view === "upload"    && <UploadView onFile={handleFile} onSample={handleSample} platform={platform} error={error} referenceDoc={referenceDoc} refDocName={refDocName} onRefDoc={(text, name) => { setReferenceDoc(text); setRefDocName(name); }} />}
      {view === "analysing" && <AnalysingView step={step} total={requirements.length || 24} platform={platform} />}

      {view === "dashboard" && verdict && (
        <main className="max-w-[1400px] mx-auto px-8 py-10">
          <VerdictBanner verdict={verdict} platform={platform} />

          {/* ── Before / After summary strip ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-5" style={{ background: T.card, border: `1px solid ${T.line}` }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2" style={{ color: T.inkFade }}>
                <span className="w-2 h-2 rounded-full" style={{ background: T.inkFade }} /> Before · Partner Compliance Status
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div><div className="font-display text-3xl" style={{ color: T.emerald }}>{metrics.partner.compliant}</div><div className="text-[10px] font-mono mt-1" style={{ color: T.inkFade }}>Compliant</div></div>
                <div><div className="font-display text-3xl" style={{ color: T.amber }}>{metrics.partner.partial}</div><div className="text-[10px] font-mono mt-1" style={{ color: T.inkFade }}>Partial</div></div>
                <div><div className="font-display text-3xl" style={{ color: T.rust }}>{metrics.partner.nonCompliant}</div><div className="text-[10px] font-mono mt-1" style={{ color: T.inkFade }}>Non-Compliant</div></div>
                <div><div className="font-display text-3xl" style={{ color: T.inkFade }}>{metrics.partner.notResponded}</div><div className="text-[10px] font-mono mt-1" style={{ color: T.inkFade }}>Not Responded</div></div>
              </div>
            </div>
            <div className="p-5" style={{ background: "#FBF7EC", border: `1px solid ${T.ink}` }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2" style={{ color: T.ink }}>
                <Sparkles size={10} /> After · AI-Reviewed Compliance Status
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div><div className="font-display text-3xl" style={{ color: T.emerald }}>{metrics.ai.compliant}</div><div className="text-[10px] font-mono mt-1" style={{ color: T.inkFade }}>Compliant {uplift > 0 ? `(+${uplift})` : ""}</div></div>
                <div><div className="font-display text-3xl" style={{ color: T.amber }}>{metrics.ai.partial}</div><div className="text-[10px] font-mono mt-1" style={{ color: T.inkFade }}>Partial</div></div>
                <div><div className="font-display text-3xl" style={{ color: T.rust }}>{metrics.ai.nonCompliant}</div><div className="text-[10px] font-mono mt-1" style={{ color: T.inkFade }}>Non-Compliant</div></div>
                <div><div className="font-display text-3xl" style={{ color: T.inkFade }}>{metrics.ai.notResponded}</div><div className="text-[10px] font-mono mt-1" style={{ color: T.inkFade }}>Not Responded</div></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <MetricCard label="Total requirements" value={metrics.total} big />
            <MetricCard label="Partner responded" value={metrics.responded} sub={`${metrics.notResponded} not responded`} />
            <MetricCard label="AI improved" value={metrics.improved} accent={T.emerald} sub="Items upgraded by AI" />
            <MetricCard label="Needs attention" value={metrics.needsAttention} accent={T.rust} sub="Unclear or flagged" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
            <div className="lg:col-span-2"><ComparisonChart metrics={metrics} /></div>
            <ComplianceDonut metrics={metrics} />
          </div>

          <ReqTable
            requirements={filtered}
            onOpen={setOpenReq}
            query={query} setQuery={setQuery}
            filter={filter} setFilter={setFilter}
            catFilter={catFilter} setCatFilter={setCatFilter}
            categories={categories}
          />

          {/* ── Executive Report Section ── */}
          <div className="mt-10 p-6 relative" style={{ background: T.ink, color: T.bg }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-2 opacity-50">AI-Powered</div>
                <div className="font-display text-2xl" style={{ fontWeight: 400 }}>Executive Report</div>
                <div className="text-sm opacity-60 mt-1 max-w-lg">Generate a comprehensive executive summary with scope analysis, compliance scoring, risk assessment, vendor follow-up queries, and recommendations — as PDF or presentation slides.</div>
              </div>
              <div className="flex items-center gap-3">
                {execReport && (
                  <button onClick={() => setShowExecReport(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
                    style={{ background: "rgba(255,255,255,.1)", color: T.bg }}>
                    <Eye size={14} /> View Report
                  </button>
                )}
                <button onClick={handleGenerateExecReport} disabled={execLoading}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all"
                  style={{ background: T.bg, color: T.ink, opacity: execLoading ? 0.6 : 1 }}>
                  {execLoading ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><ClipboardList size={14} /> {execReport ? "Regenerate" : "Generate Report"}</>}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t flex items-center justify-between text-xs font-mono" style={{ borderColor: T.line, color: T.inkFade }}>
            <span>Vanguard · Compliance Intelligence · {new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}</span>
            <span>Powered by Claude</span>
          </div>
        </main>
      )}

      {openReq && <DetailPanel req={openReq} onClose={() => setOpenReq(null)} onUpdate={updateReq} />}
      {showExecReport && execReport && <ExecReportPanel report={execReport} metrics={metrics} verdict={verdict} platform={platform}
        onClose={() => setShowExecReport(false)}
        onPdf={() => buildExecPDF(execReport, metrics, verdict, platform)}
        onPptx={() => buildExecPPTX(execReport, metrics, verdict, platform)} />}
    </div>
  );
}
