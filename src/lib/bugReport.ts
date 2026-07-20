export type BugActionStatus = "pending" | "completed";
export type BugReportStatus = "pending" | "in_progress" | "resolved" | "closed";

export interface BugReportAction {
  id: string;
  label: string;
  status: BugActionStatus;
}

export interface BugReportDiagnostics {
  url: string;
  pathname: string;
  search: string;
  hash: string;
  referrer: string;
  userAgent: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  online: boolean;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  timezone: string;
  localStorageKeys: string[];
  capturedAt: string;
  source: string;
}

export interface BugReport {
  id: string;
  title: string;
  description: string;
  stepsToReproduce?: string;
  status: BugReportStatus;
  actions: BugReportAction[];
  reporterName?: string | null;
  reporterEmail?: string | null;
  reporterPhone?: string | null;
  diagnostics?: BugReportDiagnostics;
  createdAt?: { seconds: number };
}

const IDS_KEY = "pretheeksha_bug_report_ids";
const REPORTS_KEY = "pretheeksha_bug_reports";

/** Optional ingest URL, e.g. a Cloud Function or platform endpoint. */
const BUG_REPORT_API_URL = (import.meta.env.PUBLIC_BUG_REPORT_API_URL as string | undefined)?.trim() || "";

const DEFAULT_ACTIONS: Omit<BugReportAction, "id">[] = [
  { label: "Reproduce the reported issue", status: "pending" },
  { label: "Review captured diagnostics and user context", status: "pending" },
  { label: "Identify root cause", status: "pending" },
  { label: "Apply fix and verify resolution", status: "pending" },
];

export function captureBugDiagnostics(): BugReportDiagnostics {
  let localStorageKeys: string[] = [];
  try {
    localStorageKeys = Object.keys(localStorage);
  } catch {
    localStorageKeys = [];
  }

  return {
    url: location.href,
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    online: navigator.onLine,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    localStorageKeys,
    capturedAt: new Date().toISOString(),
    source: "website",
  };
}

function buildPendingActions(): BugReportAction[] {
  const stamp = Date.now();
  return DEFAULT_ACTIONS.map((action, index) => ({
    id: `action_${stamp}_${index}`,
    ...action,
  }));
}

export function getSavedBugReportIds(): string[] {
  try {
    const raw = localStorage.getItem(IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function rememberBugReportId(id: string) {
  const ids = getSavedBugReportIds();
  if (!ids.includes(id)) {
    ids.unshift(id);
    localStorage.setItem(IDS_KEY, JSON.stringify(ids.slice(0, 50)));
  }
}

function loadLocalReports(): Record<string, BugReport> {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, BugReport>) : {};
  } catch {
    return {};
  }
}

function saveLocalReport(report: BugReport) {
  const all = loadLocalReports();
  all[report.id] = report;
  const ids = getSavedBugReportIds();
  const pruned: Record<string, BugReport> = {};
  for (const id of ids.slice(0, 50)) {
    if (all[id]) pruned[id] = all[id];
  }
  pruned[report.id] = report;
  localStorage.setItem(REPORTS_KEY, JSON.stringify(pruned));
}

export interface SubmitWebsiteBugReportInput {
  title: string;
  description: string;
  stepsToReproduce?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
}

function buildLocalReport(input: SubmitWebsiteBugReportInput, diagnostics: BugReportDiagnostics, id: string): BugReport {
  return {
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    stepsToReproduce: input.stepsToReproduce?.trim() || "",
    status: "pending",
    actions: buildPendingActions(),
    reporterName: input.reporterName?.trim() || null,
    reporterEmail: input.reporterEmail?.trim() || null,
    reporterPhone: input.reporterPhone?.trim() || null,
    diagnostics,
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
  };
}

async function submitViaApi(input: SubmitWebsiteBugReportInput, diagnostics: BugReportDiagnostics): Promise<string> {
  const response = await fetch(BUG_REPORT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      diagnostics,
      source: "website",
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Bug report API failed (${response.status})`);
  }

  const data = (await response.json()) as { id?: string };
  if (!data.id) throw new Error("Bug report API returned no id");
  return data.id;
}

export async function submitWebsiteBugReport(input: SubmitWebsiteBugReportInput): Promise<string> {
  const diagnostics = captureBugDiagnostics();
  const id = BUG_REPORT_API_URL
    ? await submitViaApi(input, diagnostics)
    : `bug_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  saveLocalReport(buildLocalReport(input, diagnostics, id));
  rememberBugReportId(id);
  return id;
}

export async function fetchMyBugReports(): Promise<BugReport[]> {
  const ids = getSavedBugReportIds();
  if (ids.length === 0) return [];
  const all = loadLocalReports();
  return ids.map((id) => all[id]).filter((r): r is BugReport => r != null);
}
