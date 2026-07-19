/**
 * Browser-side helpers for the consent-aware lead flow.
 *
 * These run in the visitor's browser after page load, so they use
 * `PUBLIC_API_BASE_URL`. Discovery reads the current published notice for a
 * purpose; submission POSTs a lead bound to the discovered notice id.
 *
 * We never embed a seeded notice UUID in source or env — the id is discovered
 * fresh on every submission.
 */

export interface ConsentNotice {
  notice_id: string;
  purpose_code: string;
  version: string;
  locale: string;
  title: string;
  body_markdown: string;
  published_at: string;
}

export interface LeadPayload {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  purpose_code?: string | null;
  notice_id?: string | null;
  locale?: string;
  source_code?: string;
}

export interface LeadSubmitResult {
  status: string;
}

export class LeadSubmitError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "LeadSubmitError";
  }
}

function join(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}${path}`;
}

export async function fetchCurrentNotice(
  apiBase: string,
  purpose: string,
  locale = "en-IN",
  signal?: AbortSignal,
): Promise<ConsentNotice | null> {
  const q = new URLSearchParams({ purpose, locale }).toString();
  const url = join(apiBase, `/consent/notices/current?${q}`);
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new LeadSubmitError(
      `notice discovery failed (${res.status})`,
      "We couldn't reach our consent service. Please try again in a moment.",
      res.status,
    );
  }
  return (await res.json()) as ConsentNotice;
}

export async function submitLead(
  apiBase: string,
  payload: LeadPayload,
): Promise<LeadSubmitResult> {
  const url = join(apiBase, "/content/leads");
  const body: Record<string, unknown> = {
    full_name: payload.full_name,
    locale: payload.locale ?? "en-IN",
    source_code: payload.source_code ?? "landing",
  };
  if (payload.email) body.email = payload.email;
  if (payload.phone) body.phone = payload.phone;
  if (payload.message) body.message = payload.message;
  if (payload.notice_id) body.notice_id = payload.notice_id;
  if (payload.purpose_code) body.purpose_code = payload.purpose_code;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new LeadSubmitError(
      `network error: ${(err as Error).message}`,
      "We couldn't reach our servers. Please check your connection and try again.",
    );
  }

  if (res.status === 429) {
    throw new LeadSubmitError(
      "rate limited",
      "You've sent a few enquiries recently. Please wait a minute and try again.",
      429,
    );
  }
  if (!res.ok) {
    throw new LeadSubmitError(
      `lead submit failed (${res.status})`,
      "Something went wrong sending your enquiry. Please try again or call us directly.",
      res.status,
    );
  }
  return (await res.json()) as LeadSubmitResult;
}
