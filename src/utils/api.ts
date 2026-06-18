/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ─────────────────────────────────────────────
// FILE: src/utils/api.ts
// PURPOSE: Central helper for unified API routing to /api/index (Vercel Serverless Function)
// ─────────────────────────────────────────────

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | string;
  params?: Record<string, string | number | boolean | null | undefined>;
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Perform a unified endpoint fetch using the consolidated Vercel function pattern.
 * 
 * @param path The target endpoint action path (e.g. "trips/list", "checkins/activeByTrip")
 * @param options HTTP options including parameters or payload body.
 */
export async function apiFetch(
  path: string,
  options?: ApiFetchOptions
): Promise<Response> {
  const method = options?.method || "GET";
  let url = "/api/index";

  if (method === "GET") {
    const queryParts = [`path=${encodeURIComponent(path)}`];
    if (options?.params) {
      for (const [key, val] of Object.entries(options.params)) {
        if (val !== undefined && val !== null) {
          queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
        }
      }
    }
    url = `/api/index?${queryParts.join("&")}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: options?.headers || {},
  };

  if (method !== "GET") {
    const payload = {
      path,
      ...(options?.body || {}),
    };
    fetchOptions.body = JSON.stringify(payload);
    
    const headers = { ...fetchOptions.headers } as Record<string, string>;
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    fetchOptions.headers = headers;
  }

  return fetch(url, fetchOptions);
}

/**
 * Legacy URL generator mapping to the single /api/index controller.
 * Falls back to mapping old query pattern with "action" if needed,
 * but strongly encourages using apiFetch directly.
 */
export function apiUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | null | undefined>
): string {
  const cleanEndpoint = endpoint
    .replace(/^\//, "")
    .replace(/\.(ts|js)$/, "");

  let path = cleanEndpoint;
  const nextParams = { ...params };

  if (params && params.action) {
    const act = params.action as string;
    delete nextParams.action;

    if (cleanEndpoint === "trips" && act === "list") {
      path = "trips/list";
    } else if (cleanEndpoint === "checkins" && act === "active") {
      path = "checkins/active";
    } else if (cleanEndpoint === "checkins" && act === "activeByTrip") {
      path = "checkins/activeByTrip";
    } else if (cleanEndpoint === "checkins" && act === "status") {
      path = "checkins/status";
    } else if (cleanEndpoint === "checkins" && act === "categories.list") {
      path = "categories/list";
    } else if (cleanEndpoint === "pageAccess" && act === "checkins.get") {
      path = "pageAccess/checkins/get";
    }
  } else if (cleanEndpoint === "trips/list") {
    path = "trips/list";
  }

  const queryParts = [`path=${encodeURIComponent(path)}`];
  for (const [key, val] of Object.entries(nextParams)) {
    if (val !== undefined && val !== null) {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
    }
  }

  return `/api/index?${queryParts.join("&")}`;
}
