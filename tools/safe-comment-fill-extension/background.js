const STORAGE_KEYS = {
  rows: "commentRows",
  allowedDomains: "allowedDomains",
  batch: "batchState"
};

const DEFAULT_BATCH_STATE = {
  active: false,
  index: 0,
  total: 0,
  inFlightTabId: null,
  waitingManual: false,
  lastResult: ""
};

function getStorage(keys) {
  return chrome.storage.local.get(keys);
}

function setStorage(values) {
  return chrome.storage.local.set(values);
}

function normalizeUrl(value) {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    const normalized = parsed.toString().replace(/\/+$/, "/");
    return normalized;
  } catch (err) {
    return "";
  }
}

function getDomain(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch (err) {
    return "";
  }
}

function isAllowed(url, allowedDomains) {
  if (!Array.isArray(allowedDomains) || !allowedDomains.length) return false;
  const host = getDomain(url);
  if (!host) return false;
  return allowedDomains.some((domain) => {
    const d = String(domain || "").trim().toLowerCase();
    if (!d) return false;
    return host === d || host.endsWith(`.${d}`);
  });
}

function urlsLikelyMatch(rowUrl, currentUrl) {
  const rowNormalized = normalizeUrl(rowUrl);
  const currentNormalized = normalizeUrl(currentUrl);
  if (!rowNormalized || !currentNormalized) return false;
  if (rowNormalized === currentNormalized) return true;
  return currentNormalized.startsWith(rowNormalized);
}

function findBestRowForUrl(rows, currentUrl) {
  if (!Array.isArray(rows) || !rows.length) return null;
  const currentNormalized = normalizeUrl(currentUrl);
  if (!currentNormalized) return null;

  for (const row of rows) {
    if (urlsLikelyMatch(row.url, currentUrl)) return row;
  }

  const currentDomain = getDomain(currentUrl);
  if (!currentDomain) return null;

  return rows.find((row) => getDomain(row.url) === currentDomain) || null;
}

async function ensureBatchState() {
  const stored = await getStorage([STORAGE_KEYS.batch]);
  if (!stored[STORAGE_KEYS.batch]) {
    await setStorage({ [STORAGE_KEYS.batch]: { ...DEFAULT_BATCH_STATE } });
    return { ...DEFAULT_BATCH_STATE };
  }
  return { ...DEFAULT_BATCH_STATE, ...stored[STORAGE_KEYS.batch] };
}

async function updateBatchState(patch) {
  const current = await ensureBatchState();
  const next = { ...current, ...patch };
  await setStorage({ [STORAGE_KEYS.batch]: next });
  return next;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

async function goToBatchRow(index) {
  const stored = await getStorage([STORAGE_KEYS.rows]);
  const rows = Array.isArray(stored[STORAGE_KEYS.rows]) ? stored[STORAGE_KEYS.rows] : [];
  if (index < 0 || index >= rows.length) {
    await updateBatchState({
      active: false,
      waitingManual: false,
      inFlightTabId: null,
      lastResult: "Batch finished."
    });
    return { ok: true, message: "Batch finished." };
  }

  const row = rows[index];
  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    return { ok: false, message: "No active tab found." };
  }

  await chrome.tabs.update(tab.id, { url: row.url, active: true });
  await updateBatchState({
    active: true,
    index,
    total: rows.length,
    inFlightTabId: tab.id,
    waitingManual: false,
    lastResult: `Opened row ${index + 1}/${rows.length}: ${row.url}`
  });

  return { ok: true, message: `Opened row ${index + 1}/${rows.length}` };
}

async function sendFillToTab(tabId, row) {
  const response = await chrome.tabs.sendMessage(tabId, {
    type: "SAFE_FILL_COMMENT_FIELDS",
    row
  });
  return response || { ok: false, message: "No response from content script." };
}

chrome.runtime.onInstalled.addListener(async () => {
  await ensureBatchState();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  const state = await ensureBatchState();
  if (!state.active) return;
  if (state.inFlightTabId !== tabId) return;

  const stored = await getStorage([STORAGE_KEYS.rows, STORAGE_KEYS.allowedDomains]);
  const rows = Array.isArray(stored[STORAGE_KEYS.rows]) ? stored[STORAGE_KEYS.rows] : [];
  const allowedDomains = Array.isArray(stored[STORAGE_KEYS.allowedDomains]) ? stored[STORAGE_KEYS.allowedDomains] : [];
  const row = rows[state.index];

  if (!row) {
    await updateBatchState({
      active: false,
      waitingManual: false,
      inFlightTabId: null,
      lastResult: "No row found. Batch stopped."
    });
    return;
  }

  const targetUrl = tab.url || "";
  if (!isAllowed(targetUrl, allowedDomains)) {
    await updateBatchState({
      waitingManual: true,
      lastResult: `Skipped (domain not approved): ${targetUrl}`
    });
    return;
  }

  if (!urlsLikelyMatch(row.url, targetUrl)) {
    await updateBatchState({
      waitingManual: true,
      lastResult: `Page redirected. Review URL before filling: ${targetUrl}`
    });
    return;
  }

  try {
    const result = await sendFillToTab(tabId, row);
    await updateBatchState({
      waitingManual: true,
      lastResult: result.ok
        ? `Filled row ${state.index + 1}/${state.total}. Review and submit manually, then click Next Row.`
        : `Fill failed: ${result.message || "unknown error"}`
    });
  } catch (err) {
    await updateBatchState({
      waitingManual: true,
      lastResult: `Fill error: ${String(err && err.message ? err.message : err)}`
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    const action = message && message.action;
    if (action === "GET_POPUP_STATE") {
      const stored = await getStorage([STORAGE_KEYS.rows, STORAGE_KEYS.allowedDomains, STORAGE_KEYS.batch]);
      const rows = Array.isArray(stored[STORAGE_KEYS.rows]) ? stored[STORAGE_KEYS.rows] : [];
      const allowedDomains = Array.isArray(stored[STORAGE_KEYS.allowedDomains]) ? stored[STORAGE_KEYS.allowedDomains] : [];
      const batchState = { ...DEFAULT_BATCH_STATE, ...(stored[STORAGE_KEYS.batch] || {}) };
      sendResponse({
        ok: true,
        rowsCount: rows.length,
        allowedDomains,
        batchState
      });
      return;
    }

    if (action === "SAVE_ROWS") {
      const rows = Array.isArray(message.rows) ? message.rows : [];
      const domains = Array.from(
        new Set(
          rows
            .map((row) => getDomain(row.url))
            .filter(Boolean)
        )
      ).sort();
      await setStorage({
        [STORAGE_KEYS.rows]: rows,
        [STORAGE_KEYS.allowedDomains]: domains,
        [STORAGE_KEYS.batch]: {
          ...DEFAULT_BATCH_STATE,
          total: rows.length,
          lastResult: `Imported ${rows.length} rows.`
        }
      });
      sendResponse({ ok: true, rowsCount: rows.length, allowedDomains: domains });
      return;
    }

    if (action === "SAVE_ALLOWED_DOMAINS") {
      const domains = Array.isArray(message.domains)
        ? message.domains.map((d) => String(d || "").trim().toLowerCase()).filter(Boolean)
        : [];
      await setStorage({ [STORAGE_KEYS.allowedDomains]: Array.from(new Set(domains)).sort() });
      sendResponse({ ok: true, domains: Array.from(new Set(domains)).sort() });
      return;
    }

    if (action === "START_BATCH") {
      const result = await goToBatchRow(0);
      sendResponse(result);
      return;
    }

    if (action === "NEXT_ROW") {
      const state = await ensureBatchState();
      if (!state.active) {
        sendResponse({ ok: false, message: "Batch is not active." });
        return;
      }
      const result = await goToBatchRow(state.index + 1);
      sendResponse(result);
      return;
    }

    if (action === "STOP_BATCH") {
      await updateBatchState({
        active: false,
        waitingManual: false,
        inFlightTabId: null,
        lastResult: "Batch stopped."
      });
      sendResponse({ ok: true, message: "Batch stopped." });
      return;
    }

    if (action === "FILL_CURRENT_PAGE") {
      const stored = await getStorage([STORAGE_KEYS.rows, STORAGE_KEYS.allowedDomains]);
      const rows = Array.isArray(stored[STORAGE_KEYS.rows]) ? stored[STORAGE_KEYS.rows] : [];
      const allowedDomains = Array.isArray(stored[STORAGE_KEYS.allowedDomains]) ? stored[STORAGE_KEYS.allowedDomains] : [];
      const tab = await getActiveTab();

      if (!tab || !tab.id || !tab.url) {
        sendResponse({ ok: false, message: "No active tab URL found." });
        return;
      }

      if (!isAllowed(tab.url, allowedDomains)) {
        sendResponse({ ok: false, message: "Current domain is not in approved list." });
        return;
      }

      const row = findBestRowForUrl(rows, tab.url);
      if (!row) {
        sendResponse({ ok: false, message: "No matching row found for current URL." });
        return;
      }

      try {
        const result = await sendFillToTab(tab.id, row);
        sendResponse(result);
      } catch (err) {
        sendResponse({ ok: false, message: `Fill error: ${String(err && err.message ? err.message : err)}` });
      }
      return;
    }

    sendResponse({ ok: false, message: "Unknown action." });
  })();

  return true;
});
