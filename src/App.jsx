import { useState, useEffect, useMemo, useRef } from "react";
import {
  Upload, Sparkles, ArrowRight, Check, X, AlertTriangle,
  ChevronRight, Download, RotateCcw, Search, Edit3,
  CheckCircle2, Circle, CircleSlash, CircleDot, Loader2, TrendingUp, Sparkle
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

/* ───────────────────────── Claude API call (via server proxy) ───────────────────────── */
const reviewWithClaude = async (requirements, platform) => {
  const payload = requirements.map(r => ({
    id: r.id, category: r.category, requirement: r.requirement,
    partnerResponse: r.partnerResponse, partnerComment: r.partnerComment || "(no comment)"
  }));

  const prompt = `You are a senior cloud compliance architect specialising in Microsoft Azure, on-premises, and multi-cloud deployments. You are reviewing a partner's responses to a customer compliance questionnaire for a ${platform} deployment.

For each requirement, assess:
1. CLARITY — is the partner's response clear and specific, or vague/generic?
2. ACCURACY — is the partner's compliance claim technically correct given ${platform} capabilities?
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
      "recommendedComment": "the improved response text, 1-3 sentences, cite specific services",
      "reasoning": "brief internal reasoning for the delivery team, 1-2 sentences",
      "aiFlag": "improved" | "confirmed" | "unclear" | "attention"
    }
  ]
}`;

  const resp = await fetch("/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Server returned ${resp.status}`);
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

/* ───────────────────────── UI: Header ───────────────────────── */
const Header = ({ platform, onPlatformChange, onReset, hasData, onExport }) => (
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
            <button onClick={onExport} className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all hover:opacity-80"
              style={{ background: T.ink, color: T.bg }}>
              <Download size={14} /> Export Excel
            </button>
            <button onClick={onReset} className="flex items-center gap-2 px-3 py-2 text-sm"
              style={{ color: T.inkSoft }}>
              <RotateCcw size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  </header>
);

/* ───────────────────────── UI: Upload view ───────────────────────── */
const UploadView = ({ onFile, onSample, platform, error }) => {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
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

/* ───────────────────────── UI: Donut ───────────────────────── */
const ComplianceDonut = ({ metrics }) => {
  const total = metrics.ai.compliant + metrics.ai.partial + metrics.ai.nonCompliant + metrics.ai.notResponded;
  const data = [
    { name: "Compliant",     value: metrics.ai.compliant,     fill: T.emerald },
    { name: "Partial",       value: metrics.ai.partial,       fill: T.amber },
    { name: "Non-Compliant", value: metrics.ai.nonCompliant,  fill: T.rust },
    { name: "Not Responded", value: metrics.ai.notResponded,  fill: T.inkFade },
  ].filter(d => d.value > 0);
  const compliancePct = total ? Math.round((metrics.ai.compliant / total) * 100) : 0;
  return (
    <div className="p-6 relative" style={{ background: T.card, border: `1px solid ${T.line}` }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: T.inkFade }}>Post-review</div>
      <h3 className="font-display text-2xl mb-4" style={{ color: T.ink, fontWeight: 500 }}>Final compliance</h3>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={1} stroke="none">
                {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="font-display text-3xl" style={{ color: T.ink, fontWeight: 400 }}>{compliancePct}%</div>
            <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: T.inkFade }}>Compliant</div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {data.map(d => (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5" style={{ background: d.fill }} />
                <span style={{ color: T.inkSoft }}>{d.name}</span>
              </div>
              <span className="font-mono" style={{ color: T.ink }}>{d.value}</span>
            </div>
          ))}
        </div>
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
          <button key={r.id} onClick={() => onOpen(r)}
            className="w-full grid grid-cols-[80px_1.5fr_2.5fr_120px_140px_140px_30px] gap-4 px-5 py-4 items-start text-left transition-colors border-b"
            style={{ borderColor: T.lineSoft, background: "transparent" }}
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

  const runReview = async (reqs, wb, sn) => {
    setView("analysing");
    try {
      setStep("Parsing questionnaire…");
      await new Promise(r => setTimeout(r, 300));
      setStep("Cross-referencing Azure service capabilities…");
      const result = await reviewWithClaude(reqs, platform);
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
      <Header platform={platform} onPlatformChange={setPlatform} onReset={handleReset} hasData={view === "dashboard"} onExport={handleExport} />

      {view === "upload"    && <UploadView onFile={handleFile} onSample={handleSample} platform={platform} error={error} />}
      {view === "analysing" && <AnalysingView step={step} total={requirements.length || 24} platform={platform} />}

      {view === "dashboard" && verdict && (
        <main className="max-w-[1400px] mx-auto px-8 py-10">
          <VerdictBanner verdict={verdict} platform={platform} />

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
            <MetricCard label="Total requirements" value={metrics.total} big />
            <MetricCard label="Partner responded" value={metrics.responded} sub={`${metrics.notResponded} not responded`} />
            <MetricCard label="Partner: Compliant" value={metrics.partner.compliant} accent={T.emerald} />
            <MetricCard label="Partner: Partial / Non" value={metrics.partner.partial + metrics.partner.nonCompliant}
              sub={`${metrics.partner.partial} partial · ${metrics.partner.nonCompliant} non-compliant`} accent={T.rust} />
            <MetricCard label="After AI: Compliant" value={metrics.ai.compliant} delta={uplift > 0 ? `+${uplift}` : null} accent={T.ink} />
            <MetricCard label="AI improved / flagged" value={`${metrics.improved} / ${metrics.needsAttention}`}
              sub="improved · needs attention" accent={T.navy} />
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

          <div className="mt-10 pt-6 border-t flex items-center justify-between text-xs font-mono" style={{ borderColor: T.line, color: T.inkFade }}>
            <span>Vanguard · Compliance Intelligence · {new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}</span>
            <span>Powered by Claude</span>
          </div>
        </main>
      )}

      {openReq && <DetailPanel req={openReq} onClose={() => setOpenReq(null)} onUpdate={updateReq} />}
    </div>
  );
}
