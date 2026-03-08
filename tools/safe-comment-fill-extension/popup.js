const DEFAULTS = {
  comment:
    'I use <a href="https://pixelflowlevel.app/" target="_blank" rel="nofollow noopener">pixelflowlevel.app</a> for Pixel Flow walkthroughs and level guides.',
  name: '<a href="https://pixelflowlevel.app/" target="_blank" rel="nofollow noopener">pixelflowlevel.app</a>',
  email: "bingkun.zhao@gmail.com",
  website: "https://pixelflowlevel.app/"
};

const elements = {
  csvFile: document.getElementById("csvFile"),
  importBtn: document.getElementById("importBtn"),
  importResult: document.getElementById("importResult"),
  domains: document.getElementById("domains"),
  saveDomainsBtn: document.getElementById("saveDomainsBtn"),
  rowsCount: document.getElementById("rowsCount"),
  batchState: document.getElementById("batchState"),
  fillCurrentBtn: document.getElementById("fillCurrentBtn"),
  startBatchBtn: document.getElementById("startBatchBtn"),
  nextRowBtn: document.getElementById("nextRowBtn"),
  stopBatchBtn: document.getElementById("stopBatchBtn"),
  status: document.getElementById("status")
};

function setStatus(text) {
  elements.status.textContent = String(text || "");
}

function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes) {
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else if (field.length === 0) {
        // Treat quote as CSV wrapper only at the beginning of a field.
        inQuotes = true;
      } else {
        // Keep literal quotes in non-standard/unquoted cells.
        field += '"';
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((item) => String(item || "").trim() !== "")) rows.push(row);
      row = [];
      continue;
    }

    field += ch;
  }

  row.push(field);
  if (row.some((item) => String(item || "").trim() !== "")) rows.push(row);
  return rows;
}

function normalizeHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizeUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (err) {
    return "";
  }
}

function toRowObject(headers, rowValues) {
  const obj = {};
  headers.forEach((header, idx) => {
    obj[header] = String(rowValues[idx] || "").trim();
  });
  return obj;
}

function pickValue(obj, keys, fallback = "") {
  for (const key of keys) {
    if (obj[key]) return obj[key];
  }
  return fallback;
}

function convertParsedRows(parsedRows) {
  if (!parsedRows.length) return [];
  const headers = parsedRows[0].map((h) => normalizeHeader(h));
  const body = parsedRows.slice(1);

  const entries = [];
  for (const values of body) {
    const src = toRowObject(headers, values);
    const rawUrl = pickValue(src, ["url", "page_url", "link", "target_url"]);
    const url = normalizeUrl(rawUrl);
    if (!url) continue;

    entries.push({
      url,
      comment: pickValue(src, ["comment", "content", "message"], DEFAULTS.comment),
      name: pickValue(src, ["name", "author"], DEFAULTS.name),
      email: pickValue(src, ["email", "mail"], DEFAULTS.email),
      website: normalizeUrl(pickValue(src, ["website", "site", "web_url", "url_field"], DEFAULTS.website))
    });
  }
  return entries;
}

function parseDomainsInput(value) {
  return Array.from(
    new Set(
      String(value || "")
        .split(/\r?\n/)
        .map((line) => line.trim().toLowerCase())
        .filter(Boolean)
    )
  ).sort();
}

function renderState(state) {
  elements.rowsCount.textContent = String(state.rowsCount || 0);
  elements.batchState.textContent = state.batchState && state.batchState.active
    ? `running (${state.batchState.index + 1}/${state.batchState.total})`
    : "idle";
  elements.domains.value = Array.isArray(state.allowedDomains) ? state.allowedDomains.join("\n") : "";
  setStatus((state.batchState && state.batchState.lastResult) || "");
}

async function refreshState() {
  const res = await sendMessage({ action: "GET_POPUP_STATE" });
  if (!res || !res.ok) {
    setStatus("Failed to load extension state.");
    return;
  }
  renderState(res);
}

elements.importBtn.addEventListener("click", async () => {
  const file = elements.csvFile.files && elements.csvFile.files[0];
  if (!file) {
    setStatus("Select a CSV file first.");
    return;
  }

  const text = await file.text();
  const parsedRows = parseCsv(text);
  const rows = convertParsedRows(parsedRows);
  if (!rows.length) {
    setStatus("No valid rows found. Ensure CSV has a url column.");
    return;
  }

  const res = await sendMessage({ action: "SAVE_ROWS", rows });
  if (!res || !res.ok) {
    setStatus("Import failed.");
    return;
  }

  elements.importResult.textContent = `Imported ${res.rowsCount} rows.`;
  elements.domains.value = Array.isArray(res.allowedDomains) ? res.allowedDomains.join("\n") : "";
  setStatus(`Imported ${res.rowsCount} rows.`);
  await refreshState();
});

elements.saveDomainsBtn.addEventListener("click", async () => {
  const domains = parseDomainsInput(elements.domains.value);
  const res = await sendMessage({ action: "SAVE_ALLOWED_DOMAINS", domains });
  if (!res || !res.ok) {
    setStatus("Failed to save domains.");
    return;
  }
  setStatus(`Saved ${res.domains.length} approved domains.`);
  await refreshState();
});

elements.fillCurrentBtn.addEventListener("click", async () => {
  const res = await sendMessage({ action: "FILL_CURRENT_PAGE" });
  setStatus(res && res.message ? res.message : "Fill command completed.");
  await refreshState();
});

elements.startBatchBtn.addEventListener("click", async () => {
  const res = await sendMessage({ action: "START_BATCH" });
  setStatus(res && res.message ? res.message : "Batch started.");
  await refreshState();
});

elements.nextRowBtn.addEventListener("click", async () => {
  const res = await sendMessage({ action: "NEXT_ROW" });
  setStatus(res && res.message ? res.message : "Moved to next row.");
  await refreshState();
});

elements.stopBatchBtn.addEventListener("click", async () => {
  const res = await sendMessage({ action: "STOP_BATCH" });
  setStatus(res && res.message ? res.message : "Batch stopped.");
  await refreshState();
});

refreshState();
