/*
 * Tzedek runner
 * Classic script entrypoint for bookmarklets and console execution.
 * This avoids direct ES module import syntax in the browser console.
 */
(function () {
  "use strict";

  const RUNNER_FLAG = "__smlComplianceRunnerActive";
  const REPORT_FLAG = "__smlComplianceLastReport";
  const CURRENT_SCRIPT_SRC = document.currentScript?.src || "";
  const MODULE_URL = resolveModuleUrl();
  const PANEL_ID = "sml-compliance-results-panel";
  const PANEL_STYLE_ID = "sml-compliance-results-style";
  let currentCompliance = null;
  let currentOptions = null;
  let refreshInFlight = false;

  function getRuntimeConfig() {
    const config = globalThis.TzedekConfig;
    return config && typeof config === "object" ? config : {};
  }

  function resolveModuleUrl() {
    const configuredUrl = getRuntimeConfig().moduleUrl || document.currentScript?.dataset.moduleUrl || "";
    if (configuredUrl) {
      return new URL(configuredUrl, window.location.href).href;
    }

    if (CURRENT_SCRIPT_SRC) {
      return new URL("./smlCompliance.js", CURRENT_SCRIPT_SRC).href;
    }

    return "";
  }

  function buildModuleUrl() {
    if (!MODULE_URL) {
      throw new Error("Missing Tzedek module URL. Load the runner from the same folder as smlCompliance.js or set window.TzedekConfig.moduleUrl.");
    }

    return MODULE_URL + "?t=" + Date.now();
  }

  if (window[RUNNER_FLAG]) {
    console.info("Tzedek audit is already running");
    return;
  }

  window[RUNNER_FLAG] = true;

  function detectBrowserProfile() {
    const ua = navigator.userAgent;
    if (ua.includes("Firefox/")) return "firefox";
    if (ua.includes("Edg/")) return "edge";
    if (ua.includes("Chrome/") || ua.includes("Chromium/") || ua.includes("Vivaldi/")) return "chromium";
    return "auto";
  }

  function getRequestedProfile() {
    const profileFromUrl = new URL(window.location.href).searchParams.get("smlComplianceProfile");
    if (profileFromUrl) return profileFromUrl.toLowerCase();

    const currentScript = document.currentScript;
    if (currentScript && currentScript.src) {
      try {
        const scriptUrl = new URL(currentScript.src, window.location.origin);
        const scriptProfile = scriptUrl.searchParams.get("profile");
        if (scriptProfile) return scriptProfile.toLowerCase();
      } catch (_err) {
        // Ignore parse issues.
      }
    }

    return "auto";
  }

  function parseOptions() {
    const options = {
      level: "aa",
      showAlerts: true,
      showIssuePanel: true,
      enforceMode: false,
      autoRun: false
    };

    // Optional URL override examples:
    // ?smlComplianceLevel=aaa&smlComplianceAlerts=0
    try {
      const params = new URLSearchParams(window.location.search);
      const level = (params.get("smlComplianceLevel") || "").toLowerCase();
      if (level === "aa" || level === "aaa") {
        options.level = level;
      }

      const showAlerts = (params.get("smlComplianceAlerts") || "").toLowerCase();
      if (showAlerts === "0" || showAlerts === "false") {
        options.showAlerts = false;
      } else if (showAlerts === "1" || showAlerts === "true") {
        options.showAlerts = true;
      }

      const showPanel = (params.get("smlCompliancePanel") || "").toLowerCase();
      if (showPanel === "0" || showPanel === "false") {
        options.showIssuePanel = false;
      } else if (showPanel === "1" || showPanel === "true") {
        options.showIssuePanel = true;
      }
    } catch (_err) {
      // Ignore URL parse errors and keep defaults.
    }

    return options;
  }

  function markSmlcElementTree(element) {
    if (!(element instanceof Element)) return element;

    element.setAttribute("data-smlc", "1");
    element.querySelectorAll("*").forEach((child) => {
      child.setAttribute("data-smlc", "1");
    });

    return element;
  }

  function cacheExports(module) {
    if (module && typeof module.smlCompliance === "function") {
      if (typeof window.smlCompliance !== "function") {
        window.smlCompliance = module.smlCompliance;
      }
      if (typeof window.runComplianceAudit !== "function" && typeof module.runComplianceAudit === "function") {
        window.runComplianceAudit = module.runComplianceAudit;
      }
      return module.smlCompliance;
    }
    throw new Error("Loaded module but smlCompliance export is missing");
  }

  async function loadByDirectImport() {
    const moduleUrl = buildModuleUrl();
    const module = await import(moduleUrl);
    return cacheExports(module);
  }

  async function loadByBlobImport() {
    const moduleUrl = buildModuleUrl();
    const response = await fetch(moduleUrl, { credentials: "same-origin" });
    if (!response.ok) {
      throw new Error("Fetch failed with status " + response.status);
    }
    const source = await response.text();
    const blob = new Blob([source], { type: "text/javascript" });
    const blobUrl = URL.createObjectURL(blob);
    try {
      const module = await import(blobUrl);
      return cacheExports(module);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  async function loadByModuleScriptTag() {
    const readyEventName = "smlComplianceModuleReady";
    const scriptId = "sml-compliance-module-bootstrap";
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.remove();
    }

    return await new Promise((resolve, reject) => {
      let timedOut = false;
      const timeoutId = window.setTimeout(() => {
        timedOut = true;
        window.removeEventListener(readyEventName, onReady);
        reject(new Error("Module script bootstrap timed out"));
      }, 3500);

      function onReady() {
        if (timedOut) return;
        window.clearTimeout(timeoutId);
        window.removeEventListener(readyEventName, onReady);
        if (typeof window.smlCompliance === "function") {
          resolve(window.smlCompliance);
        } else {
          reject(new Error("Module script loaded but smlCompliance is unavailable"));
        }
      }

      window.addEventListener(readyEventName, onReady);

      const moduleUrl = buildModuleUrl();
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "module";
      script.textContent = "import { smlCompliance, runComplianceAudit } from '" + moduleUrl + "'; window.smlCompliance = smlCompliance; window.runComplianceAudit = runComplianceAudit; window.dispatchEvent(new Event('" + readyEventName + "'));";
      script.onerror = function () {
        if (timedOut) return;
        window.clearTimeout(timeoutId);
        window.removeEventListener(readyEventName, onReady);
        reject(new Error("Module script injection failed"));
      };
      markSmlcElementTree(script);
      document.head.appendChild(script);
    });
  }

  function strategyOrderForProfile(profile) {
    const resolved = profile === "auto" ? detectBrowserProfile() : profile;
    const orders = {
      chromium: ["directImport", "moduleScriptTag", "blobImport"],
      edge: ["moduleScriptTag", "directImport", "blobImport"],
      firefox: ["blobImport", "moduleScriptTag", "directImport"]
    };
    return orders[resolved] || ["directImport", "blobImport", "moduleScriptTag"];
  }

  async function loadComplianceClass(profile) {
    if (typeof window.smlCompliance === "function") {
      return window.smlCompliance;
    }

    const strategyMap = {
      directImport: loadByDirectImport,
      moduleScriptTag: loadByModuleScriptTag,
      blobImport: loadByBlobImport
    };
    const attempts = strategyOrderForProfile(profile);
    const errors = [];

    for (const key of attempts) {
      const strategy = strategyMap[key];
      if (!strategy) continue;
      try {
        return await strategy();
      } catch (error) {
        errors.push(key + ": " + (error && error.message ? error.message : String(error)));
      }
    }

    throw new Error("All loading strategies failed: " + errors.join(" | "));
  }

  function printSummary(report) {
    const summary = {
      total: report.total,
      critical: report.critical,
      errors: report.errors,
      warnings: report.warnings,
      info: report.info
    };

    console.group("smlCompliance audit complete");
    console.table(summary);
    if (Array.isArray(report.alerts) && report.alerts.length > 0) {
      console.table(report.alerts.map((item, index) => ({
        n: index + 1,
        level: item.level,
        title: item.title,
        message: item.message,
        selector: item.selector || ""
      })));
    } else {
      console.info("No accessibility issues were reported");
    }
    console.groupEnd();
  }

  async function executeAuditAndRender() {
    if (!currentCompliance || typeof currentCompliance.runCompleteAudit !== "function") {
      throw new Error("SMLC compliance instance is unavailable");
    }
    if (refreshInFlight) {
      return window[REPORT_FLAG] || null;
    }

    refreshInFlight = true;
    try {
      const report = await currentCompliance.runCompleteAudit();
      window[REPORT_FLAG] = report;
      if (currentOptions?.showIssuePanel) {
        renderIssuePanel(report);
      }
      printSummary(report);
      return report;
    } finally {
      refreshInFlight = false;
    }
  }

  function getLevelLabel(level) {
    const value = (level || "info").toLowerCase();
    if (value === "critical") return "Critical";
    if (value === "error") return "Error";
    if (value === "warning") return "Warning";
    return "Info";
  }

  function getWhyText(level) {
    const value = (level || "info").toLowerCase();
    if (value === "critical") return "Likely blocks task completion for assistive technology users.";
    if (value === "error") return "Creates a strong accessibility barrier and should be fixed soon.";
    if (value === "warning") return "May reduce usability or fail stricter WCAG expectations.";
    return "Recommended improvement for better accessibility and consistency.";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stripHtml(value) {
    const temp = document.createElement("div");
    markSmlcElementTree(temp);
    temp.innerHTML = String(value || "");
    return (temp.textContent || "").trim();
  }

  function getPrimaryJumpTarget() {
    return document.querySelector("#pageContentWrapper, #page-content-wrapper, main, [role='main'], cc-container, sml-page")
      || document.body
      || document.documentElement;
  }

  function isVisibleJumpTarget(element) {
    if (!(element instanceof Element) || !element.isConnected) return false;
    if (element.closest("[data-smlc='1']")) return false;

    const styles = window.getComputedStyle(element);
    if (styles.display === "none" || styles.visibility === "hidden") return false;
    if (Number.parseFloat(styles.opacity || "1") === 0) return false;

    const rect = element.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0 || element === document.body || element === document.documentElement;
  }

  function revealJumpAncestors(element) {
    let current = element?.parentElement || null;
    while (current instanceof Element) {
      if (current.tagName === "DETAILS" && !current.hasAttribute("open")) {
        current.setAttribute("open", "open");
      }
      current = current.parentElement;
    }
  }

  function resolveJumpTargetElement(element) {
    if (!(element instanceof Element) || !element.isConnected) {
      return getPrimaryJumpTarget();
    }

    if (element === document.body || element === document.documentElement) {
      return getPrimaryJumpTarget();
    }

    if (element instanceof HTMLOptionElement) {
      return resolveJumpTargetElement(element.closest("select") || element.parentElement || getPrimaryJumpTarget());
    }

    let current = element;
    let firstVisibleAncestor = null;
    while (current instanceof Element) {
      if (current.closest("[data-smlc='1']")) return null;

      if (isVisibleJumpTarget(current)) {
        firstVisibleAncestor = firstVisibleAncestor || current;
        if (current.matches("input, select, textarea, button, a[href], img, th, td, tr, table, form, section, article, main, nav, header, footer, li, [role], [id]")) {
          return current;
        }
      }

      current = current.parentElement;
    }

    return firstVisibleAncestor || getPrimaryJumpTarget();
  }

  function clearJumpTargetHighlight(target) {
    if (!(target instanceof HTMLElement)) return;

    const restoreData = target.__smlcJumpRestore;
    if (restoreData?.timeoutId) {
      window.clearTimeout(restoreData.timeoutId);
    }

    if (restoreData?.animationFrameId) {
      window.cancelAnimationFrame(restoreData.animationFrameId);
    }

    if (restoreData?.initialStyles) {
      target.style.outline = restoreData.initialStyles.outline;
      target.style.outlineOffset = restoreData.initialStyles.outlineOffset;
      target.style.boxShadow = restoreData.initialStyles.boxShadow;
      target.style.transition = restoreData.initialStyles.transition;
    } else {
      target.style.outline = "";
      target.style.outlineOffset = "";
      target.style.boxShadow = "";
      target.style.transition = "";
    }

    target.classList.remove("smlc-target-flash");
    delete target.__smlcJumpRestore;
  }

  function applyJumpTargetHighlight(target) {
    if (!(target instanceof HTMLElement)) return;

    clearJumpTargetHighlight(target);

    const initialStyles = {
      outline: target.style.outline,
      outlineOffset: target.style.outlineOffset,
      boxShadow: target.style.boxShadow,
      transition: target.style.transition
    };

    const durationMs = 15000;
    const start = performance.now();
    target.style.transition = "outline-color 220ms linear, outline-width 220ms linear, outline-offset 220ms linear, box-shadow 220ms linear";
    target.style.outlineStyle = "solid";
    target.style.outlineColor = "rgba(245, 158, 11, 0.98)";
    target.style.outlineWidth = "4px";
    target.style.outlineOffset = "3px";

    const step = (timestamp) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const wave = (Math.sin(progress * Math.PI * 10 - (Math.PI / 2)) + 1) / 2;
      const alpha = 0.28 + (wave * 0.72);
      const outlineWidth = 3 + (wave * 7);
      const outlineOffset = 2 + (wave * 8);
      const glowSpread = 2 + (wave * 8);
      const glowBlur = 6 + (wave * 22);
      const haloBlur = 14 + (wave * 34);

      target.style.outlineColor = `rgba(245, 158, 11, ${alpha.toFixed(3)})`;
      target.style.outlineWidth = `${outlineWidth.toFixed(2)}px`;
      target.style.outlineOffset = `${outlineOffset.toFixed(2)}px`;
      target.style.boxShadow = [
        `0 0 0 ${glowSpread.toFixed(2)}px rgba(245, 158, 11, ${(alpha * 0.34).toFixed(3)})`,
        `0 0 ${glowBlur.toFixed(2)}px ${(glowSpread * 0.45).toFixed(2)}px rgba(249, 115, 22, ${(alpha * 0.42).toFixed(3)})`,
        `0 0 ${haloBlur.toFixed(2)}px ${(glowSpread * 0.85).toFixed(2)}px rgba(251, 191, 36, ${(alpha * 0.26).toFixed(3)})`
      ].join(", ");

      if (progress < 1) {
        target.__smlcJumpRestore.animationFrameId = window.requestAnimationFrame(step);
      }
    };

    const timeoutId = window.setTimeout(() => {
      clearJumpTargetHighlight(target);
    }, durationMs);

    target.__smlcJumpRestore = {
      initialStyles,
      timeoutId,
      animationFrameId: window.requestAnimationFrame(step)
    };
    target.classList.add("smlc-target-flash");
  }

  function getSafeTargetId(element, index) {
    const target = resolveJumpTargetElement(element);
    if (!(target instanceof Element) || !target.isConnected) return "";
    if (target.id && !/\s/.test(target.id)) return target.id;

    const generatedId = "smlc-issue-target-" + Date.now() + "-" + index;
    target.id = generatedId;
    target.setAttribute("data-smlc-generated-id", "1");
    return generatedId;
  }

  function shutdownSmlc() {
    const panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.remove();
    }

    const panelStyle = document.getElementById(PANEL_STYLE_ID);
    if (panelStyle) {
      panelStyle.remove();
    }

    document.querySelectorAll(".sml-compliance-alert").forEach(el => el.remove());
    document.querySelectorAll(".sml-compliance-alert-panes-floating").forEach(el => el.remove());
    document.querySelectorAll(".sml-compliance-alert-toggle[aria-expanded='true']").forEach((el) => {
      el.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll(".smlc-target-flash").forEach(el => clearJumpTargetHighlight(el));

    document.querySelectorAll("[data-smlc-generated-id='1']").forEach(el => {
      if (el.id && el.id.startsWith("smlc-issue-target-")) {
        el.removeAttribute("id");
      }
      el.removeAttribute("data-smlc-generated-id");
    });

    const runnerScript = document.getElementById("sml-compliance-runner-script");
    if (runnerScript) {
      runnerScript.remove();
    }

    const moduleBootstrap = document.getElementById("sml-compliance-module-bootstrap");
    if (moduleBootstrap) {
      moduleBootstrap.remove();
    }

    window[REPORT_FLAG] = null;
    window[RUNNER_FLAG] = false;
  }

  function ensurePanelStyles() {
    if (document.getElementById(PANEL_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = PANEL_STYLE_ID;
    style.textContent = [
      "#" + PANEL_ID + "{position:relative;z-index:2147483646;background:#f8fafc;border:2px solid #0f172a;border-radius:10px;padding:0.75rem 1rem;margin:0.5rem;box-shadow:0 8px 20px rgba(15,23,42,0.2);font-family:Arial,Helvetica,sans-serif;color:#0f172a;}",
      "#" + PANEL_ID + " .smlc-headline{display:flex !important;justify-content:space-between !important;align-items:center !important;gap:0.6rem;flex-wrap:nowrap !important;white-space:nowrap;width:100%;overflow-x:auto;}",
      "#" + PANEL_ID + " .smlc-headline-main{display:flex !important;align-items:center !important;gap:0.45rem;flex-wrap:nowrap !important;flex:0 1 auto;min-width:0;}",
      "#" + PANEL_ID + " .smlc-toggle-btn,#" + PANEL_ID + " .smlc-refresh-btn{border:1px solid #334155;border-radius:6px;padding:0.25rem 0.5rem;font-size:0.875rem;font-weight:700;cursor:pointer;min-height:31px;}",
      "#" + PANEL_ID + " .smlc-toggle-btn{background:#fff !important;color:#0f172a !important;}",
      "#" + PANEL_ID + " .smlc-refresh-btn{display:inline-flex;align-items:center;justify-content:center;min-width:31px;background:#bae6fd !important;color:#082f49 !important;line-height:1;font-size:1.75rem;box-shadow:0 0.35rem 0.9rem rgba(125,211,252,0.45);}",
      "#" + PANEL_ID + " .smlc-refresh-btn:disabled{opacity:0.65;cursor:progress;}",
      "#" + PANEL_ID + " .smlc-body{margin-top:0.55rem;}",
      "#" + PANEL_ID + " .smlc-summary{display:flex;flex-wrap:wrap;gap:0.4rem;margin:0.65rem 0;}",
      "#" + PANEL_ID + " .smlc-pill{padding:0.2rem 0.5rem;border-radius:999px;border:1px solid #334155;font-size:0.8rem;background:#e2e8f0;}",
      "#" + PANEL_ID + " .smlc-issue-list{margin:0.55rem 0 0;padding-left:1.25rem;}",
      "#" + PANEL_ID + " .smlc-item{border:1px solid #cbd5e1;border-radius:8px;padding:0.55rem 0.6rem;margin-bottom:0.45rem;background:#ffffff;}",
      "#" + PANEL_ID + " .smlc-title{font-weight:700;margin-bottom:0.2rem;}",
      "#" + PANEL_ID + " .smlc-plain{font-size:0.78rem;line-height:1.35;color:#475569;margin-bottom:0.3rem;}",
      "#" + PANEL_ID + " .smlc-meta{font-size:0.82rem;color:#475569;margin-top:0.25rem;}",
      "#" + PANEL_ID + " .smlc-jump-link{display:inline-block;margin-top:0.35rem;color:#1d4ed8;font-size:0.82rem;font-weight:600;text-decoration:underline;}",
      "#" + PANEL_ID + " .smlc-jump-link:hover{color:#1e3a8a;}",
      ".smlc-target-flash{outline:4px solid #f59e0b !important;outline-offset:2px !important;transition:outline-color 900ms ease;}",
      "#" + PANEL_ID + " .smlc-actions{display:flex !important;align-items:center !important;justify-content:flex-end !important;gap:0.35rem;flex-wrap:nowrap !important;flex:0 0 auto;margin-left:auto !important;}",
      "#" + PANEL_ID + " .smlc-close-btn{border:1px solid #334155;background:#fff !important;color:#0f172a !important;border-radius:6px;padding:0.15rem 0.45rem;font-size:0.8rem;cursor:pointer;}",
      "#" + PANEL_ID + " .btn.btn-dark{color:#ffffff !important;background:#1f2937 !important;border-color:#111827 !important;}"
    ].join("");
    markSmlcElementTree(style);
    document.head.appendChild(style);
  }

  function buildIssueGroups(alerts) {
    const grouped = { critical: [], error: [], warning: [], info: [] };
    for (const alert of alerts) {
      const key = (alert.level || "info").toLowerCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(alert);
    }
    return grouped;
  }

  function buildIssueRecords(alerts) {
    return (Array.isArray(alerts) ? alerts : []).map((alert, index) => {
      const level = (alert.level || "info").toLowerCase();
      return {
        id: "smlc-issue-" + index,
        level,
        levelLabel: getLevelLabel(level),
        title: alert.title || "Issue",
        plainDescription: alert.plainDescription || "",
        message: stripHtml(alert.message || ""),
        why: getWhyText(level),
        targetId: getSafeTargetId(alert.element, index)
      };
    });
  }

  function renderIssuePanel(report) {
    const existing = document.getElementById(PANEL_ID);
    if (existing) {
      existing.remove();
    }

    ensurePanelStyles();

    const issues = buildIssueRecords(report.alerts);
    const total = Number(report.total || 0);

    const issuesHtml = issues.map(issue => {
      const jumpLink = issue.targetId
        ? "<a class='smlc-jump-link' href='#" + escapeHtml(issue.targetId) + "' data-smlc-target='" + escapeHtml(issue.targetId) + "'>Jump to location</a>"
        : "<a class='smlc-jump-link' href='#' data-smlc-target='body'>Jump to location</a>";

      return [
        "<li class='smlc-item'>",
        "<div class='smlc-title'>[" + escapeHtml(issue.levelLabel) + "] " + escapeHtml(issue.title) + "</div>",
        issue.plainDescription ? "<div class='smlc-plain'>" + escapeHtml(issue.plainDescription) + "</div>" : "",
        "<div>" + escapeHtml(issue.message) + "</div>",
        "<div class='smlc-meta'><strong>Why this matters:</strong> " + escapeHtml(issue.why) + "</div>",
        jumpLink,
        "</li>"
      ].join("");
    }).join("");

    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Tzedek audit issues");
    panel.innerHTML = [
      "<div class='smlc-headline'>",
      "<div class='smlc-headline-main'>",
      "<button type='button' class='smlc-toggle-btn' data-smlc-toggle='1' aria-expanded='false' aria-controls='smlc-issues-body'>See all issues (" + total + ")</button>",
      "<button type='button' class='smlc-refresh-btn m-0 p-0' data-smlc-refresh='1' aria-label='Refresh Tzedek check' title='Refresh Tzedek check'>⟳</button>",
      "</div>",
      "<div class='smlc-actions'>",
      "<button type='button' class='smlc-close-btn' data-smlc-close='1' aria-label='Close issues bar'>Close Issues Bar</button>",
      "<button type='button' class='btn btn-dark' data-smlc-shutdown='1' aria-label='Close Tzedek'>Close Tzedek</button>",
      "</div>",
      "</div>",
      "<div id='smlc-issues-body' class='smlc-body' hidden>",
      "<div class='smlc-summary'>",
      "<span class='smlc-pill'>Critical: " + Number(report.critical || 0) + "</span>",
      "<span class='smlc-pill'>Errors: " + Number(report.errors || 0) + "</span>",
      "<span class='smlc-pill'>Warnings: " + Number(report.warnings || 0) + "</span>",
      "<span class='smlc-pill'>Info: " + Number(report.info || 0) + "</span>",
      "</div>",
      issues.length ? "<ol class='smlc-issue-list'>" + issuesHtml + "</ol>" : "<p>No issues reported.</p>",
      "</div>"
    ].join("");
    markSmlcElementTree(panel);

    panel.addEventListener("click", function (event) {
      const toggleBtn = event.target.closest("button[data-smlc-toggle]");
      if (toggleBtn) {
        const body = panel.querySelector("#smlc-issues-body");
        if (!body) return;
        const willOpen = body.hidden;
        body.hidden = !willOpen;
        toggleBtn.setAttribute("aria-expanded", String(willOpen));
        toggleBtn.textContent = willOpen
          ? "Hide all issues (" + total + ")"
          : "See all issues (" + total + ")";
        return;
      }

      const refreshBtn = event.target.closest("button[data-smlc-refresh]");
      if (refreshBtn) {
        if (refreshInFlight) return;
        refreshBtn.disabled = true;
        refreshBtn.setAttribute("aria-disabled", "true");
        refreshBtn.textContent = "↻";
        Promise.resolve(executeAuditAndRender()).catch(error => {
          console.error("Tzedek refresh failed", error);
          refreshBtn.disabled = false;
          refreshBtn.removeAttribute("aria-disabled");
          refreshBtn.textContent = "⟳";
          alert("Tzedek failed to refresh. Open DevTools Console for details.");
        });
        return;
      }

      const shutdownBtn = event.target.closest("button[data-smlc-shutdown]");
      if (shutdownBtn) {
        shutdownSmlc();
        return;
      }

      const closeBtn = event.target.closest("button[data-smlc-close]");
      if (closeBtn) {
        panel.remove();
        return;
      }

      const jumpLink = event.target.closest("a[data-smlc-target]");
      if (!jumpLink) return;

      const targetId = jumpLink.getAttribute("data-smlc-target") || "";
      if (!targetId) return;

      event.preventDefault();

      const target = document.getElementById(targetId);
      if (!target) return;

      revealJumpAncestors(target);

      target.scrollIntoView({ behavior: "smooth", block: "center" });
      applyJumpTargetHighlight(target);
    });

    const mount = document.body || document.documentElement;
    mount.prepend(panel);
  }

  (async function run() {
    try {
      const requestedProfile = getRequestedProfile();
      const ComplianceClass = await loadComplianceClass(requestedProfile);
      currentOptions = parseOptions();
      currentCompliance = new ComplianceClass(currentOptions);
      await executeAuditAndRender();
    } catch (error) {
      console.error("Tzedek runner failed", error);
      alert("Tzedek failed to run. Open DevTools Console for details.");
    } finally {
      window[RUNNER_FLAG] = false;
    }
  })();
})();
