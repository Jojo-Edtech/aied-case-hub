#!/usr/bin/env node

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_ROUNDS = 500;
const DEFAULT_VIEWPORTS = [
  { name: "desktop", width: 1440, height: 960 },
  { name: "tablet", width: 900, height: 1100 },
  { name: "mobile", width: 390, height: 844 },
];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
};

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.findLast((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function boolArg(name) {
  return process.argv.includes(`--${name}`);
}

function safePath(requestUrl) {
  const url = new URL(requestUrl, "http://localhost");
  const pathname = decodeURIComponent(url.pathname);
  const normalized = pathname === "/" ? "/index.html" : pathname;
  const absolute = resolve(join(ROOT, normalized));
  if (!absolute.startsWith(ROOT)) return null;
  return absolute;
}

function createStaticServer() {
  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", "http://localhost");
    if (requestUrl.pathname === "/data/rag-config.json") {
      response.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(JSON.stringify({ status: "offline_test" }));
      return;
    }

    const filePath = safePath(request.url || "/");
    if (!filePath || !existsSync(filePath)) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": MIME_TYPES[extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    createReadStream(filePath).pipe(response);
  });

  return new Promise((resolveServer) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolveServer({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function loadPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_ENTRY,
    "playwright",
    "/Users/zhouxinxin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const module = await import(candidate.startsWith("/") ? pathToFileURL(candidate) : candidate);
      return module.default || module;
    } catch {
      // Try the next candidate.
    }
  }
  throw new Error("Playwright is not available. Install it or set PLAYWRIGHT_ENTRY.");
}

function expect(condition, message, details = {}) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

async function waitForData(page) {
  await page.waitForFunction(
    () =>
      document.querySelectorAll("#caseCards .case-card").length > 0 &&
      document.querySelector("#caseTabCount")?.textContent?.match(/\d+/),
    { timeout: 15_000 }
  );
}

async function returnToHub(page) {
  await page.goBack({ waitUntil: "commit", timeout: 15_000 });
  await waitForData(page);
}

async function pageMetrics(page) {
  return page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    const activePanel = [...document.querySelectorAll("[data-view-panel]")].find((panel) => !panel.hidden);
    const visibleCards = activePanel ? activePanel.querySelectorAll(".case-card").length : 0;
    const activeResultsMeta = activePanel?.querySelector(".results-header p")?.textContent || "";
    const activeEmpty = Boolean(activePanel?.querySelector(".empty-state:not([hidden])"));
    const visibleButtons = [...document.querySelectorAll("button, a, select, input, textarea")].filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }).length;
    const overflowing = [...document.querySelectorAll("body *")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id,
          className: String(element.className || "").slice(0, 80),
          text: String(element.textContent || "").trim().slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((item) => item.width > 24 && (item.left < -3 || item.right > window.innerWidth + 3))
      .slice(0, 12);

    return {
      activeView: activePanel?.dataset.viewPanel || null,
      activeEmpty,
      bodyClass: body.className,
      cards: visibleCards,
      visibleButtons,
      title: document.title,
      hash: location.hash,
      scrollWidth: Math.max(body.scrollWidth, html.scrollWidth),
      clientWidth: html.clientWidth,
      overflowing,
      resultsMeta: activeResultsMeta,
    };
  });
}

async function assertUsable(page, context) {
  const metrics = await pageMetrics(page);
  expect(metrics.visibleButtons > 0, "No visible controls", { context, metrics });
  expect(metrics.scrollWidth <= metrics.clientWidth + 4, "Horizontal overflow", { context, metrics });

  if (["cases", "resources", "prompts"].includes(metrics.activeView)) {
    expect(metrics.cards > 0 || metrics.activeEmpty || metrics.resultsMeta.includes("0"), "No cards or empty-state signal", {
      context,
      metrics,
    });
  }
  return metrics;
}

function randomChoice(items, index) {
  return items[index % items.length];
}

async function pickSelectOption(select, round) {
  const values = await select.evaluate((element) =>
    [...element.options].map((option) => option.value).filter(Boolean)
  );
  if (values.length <= 1) return;
  await select.selectOption(randomChoice(values, round + 1));
}

async function ensureFiltersOpen(page, view) {
  const detail = page.locator(`[data-view-panel="${view}"] .filter-details`).first();
  if ((await detail.count()) === 0) return;
  const isOpen = await detail.evaluate((element) => element.open);
  if (!isOpen) {
    await detail.locator(":scope > summary").click();
  }
}

async function ensureAdvancedFiltersOpen(page, selector) {
  const detail = page.locator(selector);
  if ((await detail.count()) === 0) return;
  const isOpen = await detail.evaluate((element) => element.open);
  if (!isOpen) await detail.locator("summary").click();
}

async function openView(page, view) {
  const primary = page.locator(`#mainTabs a[data-view="${view}"]`);
  if (await primary.isVisible()) {
    await primary.click();
    return;
  }

  const compact = page.locator(`.mobile-assistant-link[data-view="${view}"]`);
  expect(await compact.isVisible(), `No visible navigation control for ${view}`);
  await compact.click();
}

async function runScenario(page, round) {
  const scenario = round % 24;

  if (scenario === 0) {
    await page.locator('#mainTabs a[data-view="cases"]').click();
  } else if (scenario === 1) {
    await page.locator('#mainTabs a[data-view="resources"]').click();
  } else if (scenario === 2) {
    await page.locator('#mainTabs a[data-view="prompts"]').click();
  } else if (scenario === 3) {
    await page.locator('#mainTabs a[data-view="toolkit"]').click();
  } else if (scenario === 4) {
    await openView(page, "assistant");
  } else if (scenario === 5) {
    await page.locator("#languageSelect").selectOption(randomChoice(["zh-Hans", "zh-Hant", "en"], round));
  } else if (scenario === 6) {
    await page.locator('#mainTabs a[data-view="cases"]').click();
    await ensureFiltersOpen(page, "cases");
    await page.locator("#searchInput").fill(randomChoice(["香港", "STEM", "writing", "assessment", ""], round));
  } else if (scenario === 7) {
    await page.locator('#mainTabs a[data-view="resources"]').click();
    await ensureFiltersOpen(page, "resources");
    await page.locator("#resourceSearchInput").fill(randomChoice(["UNESCO", "AI", "teacher", "香港", ""], round));
  } else if (scenario === 8) {
    await page.locator('#mainTabs a[data-view="prompts"]').click();
    await ensureFiltersOpen(page, "prompts");
    await page.locator("#promptSearchInput").fill(randomChoice(["rubric", "反馈", "STEM", "language", ""], round));
  } else if (scenario === 9) {
    await page.locator('#mainTabs a[data-view="cases"]').click();
    await ensureFiltersOpen(page, "cases");
    await pickSelectOption(page.locator("#levelFilter"), round);
    await pickSelectOption(page.locator("#regionFilter"), round);
    await pickSelectOption(page.locator("#caseQualityFilter"), round);
    await pickSelectOption(page.locator("#caseLinkFilter"), round);
  } else if (scenario === 10) {
    await page.locator('#mainTabs a[data-view="resources"]').click();
    await ensureFiltersOpen(page, "resources");
    await ensureAdvancedFiltersOpen(page, "#resourceAdvancedFilters");
    await pickSelectOption(page.locator("#resourceRegionFilter"), round);
    await pickSelectOption(page.locator("#resourceTypeFilter"), round);
    await pickSelectOption(page.locator("#resourceQualityFilter"), round);
    await pickSelectOption(page.locator("#resourceLinkFilter"), round);
  } else if (scenario === 11) {
    await page.locator('#mainTabs a[data-view="prompts"]').click();
    await ensureFiltersOpen(page, "prompts");
    await ensureAdvancedFiltersOpen(page, "#promptAdvancedFilters");
    await pickSelectOption(page.locator("#promptSubjectFilter"), round);
    await pickSelectOption(page.locator("#promptTypeFilter"), round);
    await pickSelectOption(page.locator("#promptDomainFilter"), round);
    await pickSelectOption(page.locator("#promptEvidenceFilter"), round);
    await pickSelectOption(page.locator("#promptQualityFilter"), round);
  } else if (scenario === 12) {
    await page.locator('#mainTabs a[data-view="cases"]').click();
    const detail = page.locator("#caseCards .detail-link").first();
    if ((await detail.count()) > 0) {
      await detail.click();
      await page.waitForURL(/\/cases\/case-[^/]+\.html$/);
      await page.locator(".standalone-detail-card h1").waitFor();
      expect(await page.locator("[data-copy-value]").count() > 0, "Case detail page has no share control");
      await returnToHub(page);
    }
  } else if (scenario === 13) {
    await page.locator('#mainTabs a[data-view="prompts"]').click();
    const promptDetail = page.locator("#promptCards .detail-link").first();
    if ((await promptDetail.count()) > 0) {
      await promptDetail.click();
      await page.waitForURL(/\/prompts\/prompt-[^/]+\.html$/);
      await page.locator(".copy-detail-section pre").waitFor();
      expect(await page.locator(".standalone-section-grid").count() > 0, "Prompt detail page has no skill structure");
      await returnToHub(page);
    }
  } else if (scenario === 14) {
    await page.locator('#mainTabs a[data-view="resources"]').click();
    const resourceDetail = page.locator("#resourceCards .detail-link").first();
    if ((await resourceDetail.count()) > 0) {
      await resourceDetail.click();
      await page.waitForURL(/\/resources\/resource-[^/]+\.html$/);
      await page.locator(".standalone-detail-card h1").waitFor();
      expect(await page.locator(".detail-footer-actions").count() > 0, "Resource detail page has no source actions");
      await returnToHub(page);
    }
  } else if (scenario === 15) {
    await page.locator('#mainTabs a[data-view="cases"]').click();
    const pathLink = page.locator("#learningPaths .source-link").first();
    if ((await pathLink.count()) > 0) {
      await pathLink.click();
      await page.waitForURL(/\/paths\/[^/]+\.html$/);
      await page.locator(".path-step-list").waitFor();
      expect(await page.locator(".path-step").count() >= 2, "Learning pathway has fewer than two steps");
      await returnToHub(page);
    }
  } else if (scenario === 16) {
    await page.locator('#mainTabs a[data-view="cases"]').click();
    const fav = page.locator("#caseCards .favorite-button").first();
    if ((await fav.count()) > 0) await fav.click();
  } else if (scenario === 17) {
    await page.locator('#mainTabs a[data-view="prompts"]').click();
    const copy = page.locator("#promptCards .copy-button").first();
    if ((await copy.count()) > 0) await copy.click();
  } else if (scenario === 18) {
    await page.locator('#mainTabs a[data-view="toolkit"]').click();
    await page.locator("#teacherToolTopic").fill(`测试主题 ${round}`);
    await page.locator("#teacherToolGenerate").click();
    await page.locator("#teacherToolOutputWrap:not([hidden])").waitFor();
  } else if (scenario === 19) {
    await page.locator('#mainTabs a[data-view="cases"]').click();
    const next = page.locator("#casePagination button").last();
    if ((await next.count()) > 0 && (await next.isEnabled())) await next.click();
  } else if (scenario === 20) {
    await page.locator('#mainTabs a[data-view="resources"]').click();
    const next = page.locator("#resourcePagination button").last();
    if ((await next.count()) > 0 && (await next.isEnabled())) await next.click();
  } else if (scenario === 21) {
    await page.locator('#mainTabs a[data-view="prompts"]').click();
    await ensureFiltersOpen(page, "prompts");
    await ensureAdvancedFiltersOpen(page, "#promptAdvancedFilters");
    const reset = page.locator("#promptResetFilters");
    if ((await reset.count()) > 0) await reset.click();
  } else if (scenario === 22) {
    await page.locator('#mainTabs a[data-view="dashboard"]').click();
    await page.locator("#coursePrimarySubject").selectOption("科学");
    await page.locator("#coursePartnerSubject").selectOption("艺术与设计");
    await page.locator("#courseLevel").selectOption("中学");
    await page.locator("#courseDuration").selectOption("2-3 课时");
    await page.locator("#courseAiRole").selectOption("资料分析助手");
    await page.locator("#courseTopic").fill(`校园议题 ${round}`);
    await page.locator("#coursePlanGenerate").click();
    expect(await page.locator(".course-output-header h4").count() === 1, "Course planner did not generate output");
    expect(await page.locator("#coursePlanCopy").isEnabled(), "Course planner copy action is disabled after generation");
  } else {
    await page.locator('#mainTabs a[data-view="dashboard"]').click();
    expect(await page.locator("#categoryChart").count() === 1, "Category chart is missing");
    expect(await page.locator("#levelChart").count() === 1, "Level chart is missing");
    expect(Number(await page.locator("#workspaceCases").innerText()) > 0, "Dashboard case metric did not load");
  }
}

async function run() {
  const rounds = Number(argValue("rounds", DEFAULT_ROUNDS));
  const headed = boolArg("headed");
  const playwright = await loadPlaywright();
  const { server, origin } = await createStaticServer();
  const failures = [];
  const consoleErrors = [];

  const chromeExecutable =
    process.env.CHROME_EXECUTABLE ||
    (existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined);
  const browser = await playwright.chromium.launch({
    headless: !headed,
    executablePath: chromeExecutable,
  });
  try {
    for (const viewport of DEFAULT_VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        locale: viewport.name === "desktop" ? "zh-CN" : "zh-HK",
      });
      const page = await context.newPage();
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) {
          consoleErrors.push({
            viewport: viewport.name,
            type: message.type(),
            text: message.text(),
            url: message.location()?.url || "",
          });
        }
      });
      page.on("pageerror", (error) => {
        consoleErrors.push({
          viewport: viewport.name,
          type: "pageerror",
          text: error.message,
          stack: error.stack || "",
        });
      });

      await page.goto(origin, { waitUntil: "networkidle" });
      await waitForData(page);
      await assertUsable(page, `${viewport.name}:initial`);

      const viewportRounds = viewport.name === "desktop" ? rounds : Math.ceil(rounds / 2);
      for (let round = 0; round < viewportRounds; round += 1) {
        try {
          await runScenario(page, round);
          await assertUsable(page, `${viewport.name}:round:${round}`);
        } catch (error) {
          failures.push({
            viewport: viewport.name,
            round,
            message: error.message,
            details: error.details || null,
            url: page.url(),
          });
          if (failures.length >= 15) break;
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }

  const ignoredConsole = consoleErrors.filter(
    (entry) =>
      !(entry.url && !entry.url.startsWith(origin)) &&
      !(entry.stack && entry.stack.includes("http") && !entry.stack.includes(origin)) &&
      !entry.text.includes("Failed to load resource: the server responded with a status of 404") &&
      !entry.text.includes("favicon") &&
      !entry.text.includes("net::ERR_NAME_NOT_RESOLVED") &&
      !entry.text.includes("status of 401") &&
      !entry.text.includes("ERR_HTTP2_PROTOCOL_ERROR") &&
      !entry.text.includes("Permissions policy violation") &&
      !entry.text.includes("deviceorientation events are blocked") &&
      !entry.text.includes("Unrecognized feature:") &&
      !entry.text.includes("Allow attribute will take precedence") &&
      !entry.text.includes("iFrameSizer") &&
      !entry.text.includes("Cannot read properties of undefined (reading '0')") &&
      !entry.text.includes("both allow-scripts and allow-same-origin")
  );

  const report = {
    rounds,
    effectiveInteractions: rounds + Math.ceil(rounds / 2) * 2,
    failures,
    consoleErrors: ignoredConsole.slice(0, 20),
    status: failures.length === 0 && ignoredConsole.length === 0 ? "pass" : "fail",
  };

  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
