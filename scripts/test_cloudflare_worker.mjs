#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import worker from "../src/worker.mjs";


const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

if (typeof globalThis.Headers === "undefined") {
  globalThis.Headers = class Headers {
    constructor(init = {}) {
      this.values = new Map();
      if (init instanceof globalThis.Headers) {
        for (const [key, value] of init.values) this.set(key, value);
      } else {
        for (const [key, value] of Object.entries(init)) this.set(key, value);
      }
    }

    get(name) {
      return this.values.get(name.toLowerCase()) ?? null;
    }

    set(name, value) {
      this.values.set(name.toLowerCase(), String(value));
    }
  };
}

if (typeof globalThis.Request === "undefined") {
  globalThis.Request = class Request {
    constructor(input) {
      this.url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
    }
  };
}

if (typeof globalThis.Response === "undefined") {
  globalThis.Response = class Response {
    constructor(body = null, init = {}) {
      this.body = body;
      this.status = init.status ?? 200;
      this.statusText = init.statusText ?? "";
      this.headers = new globalThis.Headers(init.headers);
    }

    static redirect(url, status = 302) {
      return new globalThis.Response(null, {
        status,
        headers: { Location: String(url) },
      });
    }

    async text() {
      if (this.body === null || this.body === undefined) return "";
      return Buffer.isBuffer(this.body) ? this.body.toString("utf8") : String(this.body);
    }
  };
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=UTF-8";
  if (filePath.endsWith(".css")) return "text/css; charset=UTF-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=UTF-8";
  if (filePath.endsWith(".xml")) return "application/xml; charset=UTF-8";
  return "application/octet-stream";
}

const env = {
  ASSETS: {
    async fetch(request) {
      const pathname = decodeURIComponent(new URL(request.url).pathname);
      const relative = pathname.replace(/^\/+/, "");
      const filePath = path.resolve(DIST, relative);
      if (!filePath.startsWith(`${DIST}${path.sep}`)) {
        return new Response("not found", { status: 404 });
      }
      try {
        const body = await readFile(filePath);
        return new Response(body, {
          status: 200,
          headers: { "Content-Type": contentType(filePath) },
        });
      } catch {
        return new Response("not found", { status: 404 });
      }
    },
  },
};

async function fetchPath(pathname, hostname = "pixelflowlevel.app") {
  return worker.fetch(new Request(`https://${hostname}${pathname}`), env);
}

let response = await fetchPath("/");
assert.equal(response.status, 200);
assert.match(await response.text(), /Pixel Flow/i);
assert.equal(response.headers.get("x-content-type-options"), "nosniff");

response = await fetchPath("/levels.html");
assert.equal(response.status, 200);

response = await fetchPath("/missing_levels_1-5000.txt");
assert.equal(response.status, 200);
assert.match(await response.text(), /^\d+/m);

response = await fetchPath("/level/1/");
assert.equal(response.status, 200);

response = await fetchPath("/level/1");
assert.equal(response.status, 308);
assert.equal(response.headers.get("location"), "https://pixelflowlevel.app/level/1/");

response = await fetchPath("/level/1/index.html");
assert.equal(response.status, 308);
assert.equal(response.headers.get("location"), "https://pixelflowlevel.app/level/1/");

response = await fetchPath("/index.html");
assert.equal(response.status, 308);
assert.equal(response.headers.get("location"), "https://pixelflowlevel.app/");

response = await fetchPath("/level/999999/");
assert.equal(response.status, 404);
assert.match(await response.text(), /404|not found/i);

response = await fetchPath("/", "www.pixelflowlevel.app");
assert.equal(response.status, 308);
assert.equal(response.headers.get("location"), "https://pixelflowlevel.app/");

console.log("Cloudflare Worker routing tests passed");
