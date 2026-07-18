import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

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

const STORAGE_KEY = "pretheeksha_bug_report_ids";

/** Optional Cloud Function URL override, e.g. https://.../submitBugReport */
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
    const raw = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, 50)));
  }
}

export interface SubmitWebsiteBugReportInput {
  title: string;
  description: string;
  stepsToReproduce?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
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

async function submitViaFirestore(input: SubmitWebsiteBugReportInput, diagnostics: BugReportDiagnostics): Promise<string> {
  const id = `bug_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const actions = buildPendingActions();

  await setDoc(doc(db, "bugReports", id), {
    title: input.title.trim(),
    description: input.description.trim(),
    stepsToReproduce: input.stepsToReproduce?.trim() || "",
    status: "pending",
    actions,
    source: "website",
    reporterId: null,
    reporterName: input.reporterName?.trim() || null,
    reporterEmail: input.reporterEmail?.trim() || null,
    reporterPhone: input.reporterPhone?.trim() || null,
    reporterRole: null,
    reporterPatientId: null,
    diagnostics,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return id;
}

export async function submitWebsiteBugReport(input: SubmitWebsiteBugReportInput): Promise<string> {
  const diagnostics = captureBugDiagnostics();

  let id: string;
  if (BUG_REPORT_API_URL) {
    id = await submitViaApi(input, diagnostics);
  } else {
    try {
      id = await submitViaFirestore(input, diagnostics);
    } catch (err) {
      // If direct writes are blocked by undeployed rules, surface a clearer error
      const message = err instanceof Error ? err.message : String(err);
      if (/permission|insufficient/i.test(message)) {
        throw new Error(
          "Bug reports are blocked by Firestore rules. Deploy firestore.rules (bugReports) or set PUBLIC_BUG_REPORT_API_URL."
        );
      }
      throw err;
    }
  }

  rememberBugReportId(id);
  return id;
}

export async function fetchMyBugReports(): Promise<BugReport[]> {
  const ids = getSavedBugReportIds();
  if (ids.length === 0) return [];

  const reports = await Promise.all(
    ids.map(async (id) => {
      try {
        const snap = await getDoc(doc(db, "bugReports", id));
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as BugReport;
      } catch {
        return null;
      }
    })
  );

  return reports.filter((r): r is BugReport => r != null);
}
