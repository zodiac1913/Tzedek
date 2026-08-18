/*
 * Tzedek runner
 * Classic script entrypoint for bookmarklets and console execution.
 * This avoids direct ES module import syntax in the browser console.
 */
(function () {
  "use strict";

  const TZEDEK_VERSION = "2026.08.13.01";
  const DEFAULT_REPOSITORY_URL = "https://github.com/zodiac1913/Tzedek";
  const RUNNER_FLAG = "__smlComplianceRunnerActive";
  const REPORT_FLAG = "__smlComplianceLastReport";
  const CURRENT_SCRIPT_SRC = document.currentScript?.src || "";
  const MODULE_URL = resolveModuleUrl();
  const PANEL_ID = "sml-compliance-results-panel";
  const PANEL_STYLE_ID = "sml-compliance-results-style";
  let currentCompliance = null;
  let currentOptions = null;
  let currentGetMoreInfoUrl = null;
  let refreshInFlight = false;

  function getRuntimeConfig() {
    const config = globalThis.TzedekConfig;
    return config && typeof config === "object" ? config : {};
  }

  function getDisplayVersion() {
    const configuredVersion = getRuntimeConfig().releaseVersion;
    if (typeof configuredVersion === "string" && configuredVersion.trim().length > 0) {
      return configuredVersion.trim();
    }

    return TZEDEK_VERSION;
  }

  function getBookmarkletVersion() {
    const currentScriptSrc = document.currentScript?.src || CURRENT_SCRIPT_SRC || "";
    if (!currentScriptSrc) return "";

    try {
      return new URL(currentScriptSrc, window.location.href).searchParams.get("bookmarkletVersion") || "";
    } catch (_err) {
      return "";
    }
  }

  function getBookmarkletUpdateNotice(displayVersion, bookmarkletVersion) {
    const normalizedBookmarkletVersion = (bookmarkletVersion || "").trim();
    if (!normalizedBookmarkletVersion) return null;
    if (normalizedBookmarkletVersion === displayVersion) return null;

    return {
      bookmarkletVersion: normalizedBookmarkletVersion,
      runtimeVersion: displayVersion,
      installUrl: "/compliance-bookmarklet.html"
    };
  }

  function getRepositoryUrl() {
    const configuredUrl = getRuntimeConfig().repositoryUrl;
    if (typeof configuredUrl === "string" && configuredUrl.trim().length > 0) {
      return configuredUrl.trim();
    }

    return DEFAULT_REPOSITORY_URL;
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

    applySmlcDefaultTabPolicy(element);

    return element;
  }

  function applySmlcDefaultTabPolicy(element) {
    if (!(element instanceof Element)) return element;

    const applyPolicy = (node) => {
      if (!(node instanceof HTMLElement)) return;
      if (!node.matches("div, button")) return;
      if (String(node.getAttribute("data-smlc-allow-tab-stop") || "").toLowerCase() === "true") return;
      makePanelControlUntabbable(node);
    };

    applyPolicy(element);
    element.querySelectorAll("div, button").forEach((child) => applyPolicy(child));
    return element;
  }

  function makePanelControlUntabbable(element) {
    if (!(element instanceof HTMLElement)) return element;
    element.setAttribute("tabindex", "-1");
    element.tabIndex = -1;
    return element;
  }

  function removeIssuePanelControlsFromTabOrder(panel) {
    if (!(panel instanceof HTMLElement)) return panel;

    panel.querySelectorAll("button, a, [tabindex]").forEach((node) => {
      makePanelControlUntabbable(node);
    });

    return panel;
  }

  function cacheExports(module) {
    if (module && typeof module.smlCompliance === "function") {
      if (typeof module.getMoreInfoUrl === "function") {
        currentGetMoreInfoUrl = module.getMoreInfoUrl;
      }
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
        if (typeof window.smlComplianceGetMoreInfoUrl === "function") {
          currentGetMoreInfoUrl = window.smlComplianceGetMoreInfoUrl;
        }
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
      script.textContent = "import { smlCompliance, runComplianceAudit, getMoreInfoUrl } from '" + moduleUrl + "'; window.smlCompliance = smlCompliance; window.runComplianceAudit = runComplianceAudit; window.smlComplianceGetMoreInfoUrl = getMoreInfoUrl; window.dispatchEvent(new Event('" + readyEventName + "'));";
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

  function waitForNextPaint() {
    return new Promise(resolve => window.requestAnimationFrame(resolve));
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
      // Clean up all existing inline alerts and highlights before re-running
      document.querySelectorAll(".sml-compliance-alert").forEach(el => el.remove());
      document.querySelectorAll(".sml-compliance-alert-panes-floating").forEach(el => el.remove());
      document.querySelectorAll(".smlc-unblocked-alert-button").forEach(el => el.remove());
      document.querySelectorAll(".smlc-target-flash").forEach(el => clearJumpTargetHighlight(el));
      document.querySelectorAll(".sml-compliance-alert-toggle[aria-expanded='true']").forEach((el) => {
        el.setAttribute("aria-expanded", "false");
      });

      setTzedekLoadingState(true);
  await waitForNextPaint();
      const report = await currentCompliance.runCompleteAudit();
      window[REPORT_FLAG] = report;
      if (currentOptions?.showIssuePanel) {
        renderIssuePanel(report);
      }
      printSummary(report);
      return report;
    } finally {
      setTzedekLoadingState(false);
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

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function normalizeContrastSwatches(swatches) {
    if (!Array.isArray(swatches)) return [];

    return swatches
      .map((entry) => {
        const label = String(entry?.label || "").trim();
        const hex = String(entry?.hex || "").trim().toUpperCase();
        if (!label || !/^#[0-9A-F]{6}$/.test(hex)) return null;
        return { label, hex };
      })
      .filter(Boolean);
  }

  function renderContrastSwatches(swatches) {
    if (!Array.isArray(swatches) || swatches.length === 0) return "";

    const items = swatches.map((swatch) => {
      return "<span class='smlc-color-chip'>"
        + "<span class='smlc-color-chip-label'>" + escapeHtml(swatch.label) + "</span>"
        + "<span class='smlc-color-chip-swatch' style='background:" + escapeAttribute(swatch.hex) + ";' aria-hidden='true'></span>"
        + "<span class='smlc-color-chip-hex'>" + escapeHtml(swatch.hex) + "</span>"
        + "</span>";
    }).join("");

    return "<div class='smlc-color-swatches'><strong>Colors:</strong> " + items + "</div>";
  }

  function stripHtml(value) {
    const temp = document.createElement("div");
    markSmlcElementTree(temp);
    temp.innerHTML = String(value || "");
    return (temp.textContent || "").trim();
  }

  function getPrimaryJumpTarget() {
    return document.querySelector("main, [role='main'], #maincontent, #mainContent, #main, #content, #pageContentWrapper, #page-content-wrapper, cc-container, sml-page")
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
      "#" + PANEL_ID + "{position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#f8fafc;border:2px solid #0f172a;border-radius:10px;padding:0.75rem 1rem;margin:0.5rem;box-shadow:0 8px 20px rgba(15,23,42,0.2);font-family:Arial,Helvetica,sans-serif;color:#0f172a;}",
      ".sml-compliance-alert{position:relative;z-index:2147483646;}",
      ".sml-compliance-alert-toggle{position:relative;z-index:2147483646;}",
      "#" + PANEL_ID + " .smlc-headline{display:grid !important;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center !important;gap:0.6rem;width:100%;}",
      "#" + PANEL_ID + " .smlc-headline-main{display:flex !important;align-items:center !important;justify-content:flex-start !important;gap:0.45rem;flex-wrap:nowrap !important;min-width:0;}",
      "#" + PANEL_ID + " .smlc-headline-center{display:flex !important;align-items:center !important;justify-content:center !important;justify-self:center;}",
      "#" + PANEL_ID + " .smlc-version{display:inline-flex;align-items:center;justify-content:center;padding:0.2rem 0.5rem;border-radius:999px;border:1px solid #94a3b8;background:#e2e8f0;color:#334155;font-size:0.78rem;font-weight:700;text-decoration:none;}",
      "#" + PANEL_ID + " .smlc-version:hover{background:#cbd5e1;color:#0f172a;}",
      "#" + PANEL_ID + " .smlc-version:focus-visible{outline:2px solid #1d4ed8;outline-offset:2px;}",
      "#" + PANEL_ID + " .smlc-update-notice{display:flex;align-items:flex-start;justify-content:space-between;margin:0.55rem 0 0;padding:0.65rem 0.8rem;border:1px solid #b45309;border-radius:8px;background:#fffbeb;color:#78350f;font-size:0.84rem;line-height:1.45;gap:0.5rem;}",
      "#" + PANEL_ID + " .smlc-update-notice strong{display:block;margin-bottom:0.15rem;font-size:0.88rem;}",
      "#" + PANEL_ID + " .smlc-update-notice a{color:#92400e;font-weight:700;text-decoration:underline;}",
      "#" + PANEL_ID + " .smlc-alert-close-btn{background:none;border:none;color:#78350f;cursor:pointer;font-size:1.2rem;line-height:1;padding:0;min-width:auto;flex-shrink:0;}",
      "#" + PANEL_ID + " .smlc-update-notice .smlc-alert-close-btn:hover{color:#b45309;}",
      "#" + PANEL_ID + " .smlc-alert-close-btn:focus-visible{outline:2px solid #b45309;outline-offset:2px;border-radius:3px;}",
      "#" + PANEL_ID + " .smlc-toggle-btn,#" + PANEL_ID + " .smlc-refresh-btn{border:1px solid #334155;border-radius:6px;padding:0.25rem 0.5rem;font-size:0.875rem;font-weight:700;cursor:pointer;min-height:31px;}",
      "#" + PANEL_ID + " .smlc-toggle-btn{background:#fff !important;color:#0f172a !important;}",
      "#" + PANEL_ID + " .smlc-refresh-btn{display:inline-flex;align-items:center;justify-content:center;min-width:31px;background:#bae6fd !important;color:#082f49 !important;line-height:1;font-size:1.75rem;box-shadow:0 0.35rem 0.9rem rgba(125,211,252,0.45);}",
      "#" + PANEL_ID + " .smlc-refresh-btn:disabled{opacity:0.65;cursor:progress;}",
      "#" + PANEL_ID + " .smlc-loading-progress{margin:0.65rem -1rem -0.75rem;overflow:hidden;border-radius:0 0 8px 8px;}",
      "#" + PANEL_ID + " .smlc-loading-progress .progress{height:2rem;border-radius:0;background:#cbd5e1;}",
      "#" + PANEL_ID + " .smlc-loading-progress .progress-bar{font-weight:700;letter-spacing:0;}",
      "#" + PANEL_ID + " .smlc-body{margin-top:0.55rem;max-height:min(70vh,44rem);overflow-y:auto;overflow-x:hidden;}",
      "#" + PANEL_ID + " .smlc-controls{display:flex;align-items:center;justify-content:space-between;gap:0.6rem;flex-wrap:wrap;margin:0.65rem 0;}",
      "#" + PANEL_ID + " .smlc-summary{display:flex;flex-wrap:wrap;gap:0.4rem;}",
      "#" + PANEL_ID + " .smlc-pill{padding:0.2rem 0.5rem;border-radius:999px;border:1px solid #334155;font-size:0.8rem;background:#e2e8f0;cursor:pointer;font-weight:700;color:#0f172a;}",
      "#" + PANEL_ID + " .smlc-pill[aria-pressed='false']{background:#ffffff;color:#475569;border-color:#94a3b8;opacity:0.75;}",
      "#" + PANEL_ID + " .smlc-pill:focus-visible{outline:2px solid #1d4ed8;outline-offset:2px;}",
      "#" + PANEL_ID + " .smlc-sort-wrap{display:flex;align-items:center;gap:0.35rem;font-size:0.8rem;font-weight:700;color:#334155;}",
      "#" + PANEL_ID + " .smlc-sort-select{border:1px solid #334155;border-radius:6px;background:#fff;color:#0f172a;font-size:0.8rem;padding:0.2rem 0.35rem;}",
      "#" + PANEL_ID + " .smlc-sort-select:focus-visible{outline:2px solid #1d4ed8;outline-offset:2px;}",
      "#" + PANEL_ID + " .smlc-issue-list{margin:0.55rem 0 0;padding-left:1.25rem;}",
      "#" + PANEL_ID + " .smlc-item{border:1px solid #cbd5e1;border-radius:8px;padding:0.55rem 0.6rem;margin-bottom:0.45rem;background:#ffffff;}",
      "#" + PANEL_ID + " .smlc-title{font-weight:700;margin-bottom:0.2rem;}",
      "#" + PANEL_ID + " .smlc-plain{font-size:0.78rem;line-height:1.35;color:#475569;margin-bottom:0.3rem;}",
      "#" + PANEL_ID + " .smlc-meta{font-size:0.82rem;color:#475569;margin-top:0.25rem;}",
      "#" + PANEL_ID + " .smlc-color-swatches{display:flex;align-items:center;flex-wrap:wrap;gap:0.35rem 0.55rem;margin-top:0.35rem;font-size:0.82rem;color:#334155;}",
      "#" + PANEL_ID + " .smlc-color-chip{display:inline-flex;align-items:center;gap:0.25rem;white-space:nowrap;}",
      "#" + PANEL_ID + " .smlc-color-chip-label{font-weight:700;}",
      "#" + PANEL_ID + " .smlc-color-chip-swatch{display:inline-block;width:1em;height:1em;border:1px solid #334155;box-sizing:border-box;flex:0 0 auto;}",
      "#" + PANEL_ID + " .smlc-color-chip-hex{font-family:monospace;}",
      "#" + PANEL_ID + " .smlc-issue-actions{display:flex;align-items:center;flex-wrap:wrap;gap:0.85rem;margin-top:0.35rem;}",
      "#" + PANEL_ID + " .smlc-jump-link{display:inline-block;color:#1d4ed8;font-size:0.82rem;font-weight:600;text-decoration:underline;}",
      "#" + PANEL_ID + " .smlc-jump-link:hover{color:#1e3a8a;}",
      "#" + PANEL_ID + " .smlc-reference-link{display:inline-block;color:#1d4ed8;font-size:0.82rem;font-weight:600;text-decoration:underline;}",
      "#" + PANEL_ID + " .smlc-reference-link:hover{color:#1e3a8a;}",
      "#" + PANEL_ID + " .smlc-issue-message-link{color:inherit;text-decoration:underline dotted #1d4ed8;cursor:pointer;}",
      "#" + PANEL_ID + " .smlc-issue-message-link:hover{color:#1d4ed8;text-decoration:solid underline #1d4ed8;}",
      ".smlc-target-flash{outline:4px solid #f59e0b !important;outline-offset:2px !important;transition:outline-color 900ms ease;}",
      "#" + PANEL_ID + " .smlc-actions{display:flex !important;align-items:center !important;justify-content:flex-end !important;justify-self:end;gap:0.35rem;flex-wrap:nowrap !important;min-width:0;}",
      "@media (max-width: 820px){#" + PANEL_ID + " .smlc-headline{grid-template-columns:1fr;row-gap:0.5rem;}#" + PANEL_ID + " .smlc-headline-main{justify-content:center !important;}#" + PANEL_ID + " .smlc-headline-center{order:-1;}#" + PANEL_ID + " .smlc-actions{justify-content:center !important;justify-self:center;}}",
      "#" + PANEL_ID + " .smlc-close-btn{border:1px solid #334155;background:#fff !important;color:#0f172a !important;border-radius:6px;padding:0.15rem 0.45rem;font-size:0.8rem;cursor:pointer;}",
      "#" + PANEL_ID + " .btn.btn-dark{color:#ffffff !important;background:#1f2937 !important;border-color:#111827 !important;}",
      ".smlc-unblocked-alert-button{box-shadow:0 0 0.5rem rgba(220,38,38,0.5) !important;border-color:#dc2626 !important;}"
    ].join("");
    markSmlcElementTree(style);
    document.head.appendChild(style);
  }

  function getLoadingProgressMarkup(message) {
    const text = escapeHtml(String(message || "Tzedek Is Doing Its Thing...Please Wait"));
    return "<div class='smlc-loading-progress' data-smlc-loading-progress role='status' aria-live='polite'>"
      + "<div class='progress' role='progressbar' aria-label='Tzedek audit in progress' aria-valuetext='" + escapeAttribute(String(message || "Tzedek Is Doing Its Thing...Please Wait")) + "'>"
      + "<div class='progress-bar bg-primary progress-bar-striped progress-bar-animated w-100'>" + text + "</div>"
      + "</div>"
      + "</div>";
  }

  function renderLoadingPanel(message) {
    const existing = document.getElementById(PANEL_ID);
    if (existing) existing.remove();

    ensurePanelStyles();

    const panel = document.createElement("section");
    const repositoryUrl = getRepositoryUrl();
    panel.id = PANEL_ID;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Tzedek audit issues");
    panel.setAttribute("aria-busy", "true");
    panel.insertAdjacentHTML("beforeend", [
      "<div class='smlc-headline'>",
      "<div class='smlc-headline-main'><button type='button' class='smlc-toggle-btn' disabled aria-disabled='true'>Auditing page</button></div>",
      "<div class='smlc-headline-center'><a class='smlc-version' href='" + escapeAttribute(repositoryUrl) + "' target='_blank' rel='noopener noreferrer' aria-label='Open Tzedek GitHub repository' title='Click to see the GitHub repo'>v" + escapeHtml(getDisplayVersion()) + "</a></div>",
      "<div class='smlc-actions'><button type='button' class='btn btn-dark' disabled aria-disabled='true'>Tzedek</button></div>",
      "</div>",
      getLoadingProgressMarkup(message)
    ].join(""));
    markSmlcElementTree(panel);
    (document.body || document.documentElement).prepend(panel);
  }

  function setTzedekLoadingState(isLoading, message) {
    let panel = document.getElementById(PANEL_ID);
    if (!isLoading) {
      if (panel) {
        panel.removeAttribute("aria-busy");
        panel.querySelector("[data-smlc-loading-progress]")?.remove();
      }
      return;
    }

    if (!panel) {
      renderLoadingPanel(message);
      return;
    }

    panel.setAttribute("aria-busy", "true");
    const loadingProgress = panel.querySelector("[data-smlc-loading-progress]");
    if (loadingProgress) {
      loadingProgress.replaceWith(document.createRange().createContextualFragment(getLoadingProgressMarkup(message)));
      return;
    }

    panel.insertAdjacentHTML("beforeend", getLoadingProgressMarkup(message));
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
      const title = alert.title || "Issue";
      const message = stripHtml(alert.message || "");
      return {
        id: "smlc-issue-" + index,
        originalIndex: index,
        pageOrder: getIssuePageOrder(alert.element, index),
        level,
        levelLabel: getLevelLabel(level),
        title,
        plainDescription: alert.plainDescription || "",
        message,
        referenceUrl: getIssueReferenceUrl(title, message),
        contrastSwatches: normalizeContrastSwatches(alert.contrastSwatches),
        why: getWhyText(level),
        targetId: getSafeTargetId(alert.element, index)
      };
    });
  }

  function getIssueReferenceUrl(title, message) {
    if (typeof currentGetMoreInfoUrl === "function") {
      const mappedUrl = currentGetMoreInfoUrl(title, message);
      if (typeof mappedUrl === "string" && mappedUrl.trim()) return mappedUrl;
    }

    return "https://developer.mozilla.org/en-US/search?q=" + encodeURIComponent(String(title || "accessibility"));
  }

  function getIssuePageOrder(element, fallbackIndex) {
    if (!element || typeof element.getBoundingClientRect !== "function") {
      return Number.MAX_SAFE_INTEGER - 10000 + fallbackIndex;
    }

    try {
      const rect = element.getBoundingClientRect();
      const pageTop = rect.top + window.scrollY;
      const pageLeft = rect.left + window.scrollX;
      return pageTop * 100000 + pageLeft;
    } catch (_err) {
      return Number.MAX_SAFE_INTEGER - 10000 + fallbackIndex;
    }
  }

  function detectBlockedAlerts() {
    const alertButtons = document.querySelectorAll(".sml-compliance-alert-toggle");
    let blockedCount = 0;
    const blockedLabels = [];

    alertButtons.forEach(btn => {
      try {
        const rect = btn.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          blockedCount++;
          return;
        }

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const elementAtPoint = document.elementFromPoint(centerX, centerY);

        if (!elementAtPoint || !btn.contains(elementAtPoint) && !elementAtPoint.closest(".sml-compliance-alert")) {
          blockedCount++;
          
          // Find the target element for this alert
          const alertContainer = btn.closest(".sml-compliance-alert");
          const targetId = btn.getAttribute("data-smlc-target") || 
                          alertContainer?.querySelector("[id^='smlc-issue-target-']")?.id;
          const targetElement = targetId ? document.getElementById(targetId) : null;
          
          // Apply highlight to target so user knows what element has the issue
          if (targetElement) {
            applyJumpTargetHighlight(targetElement);
          }
          
          // Find the blocking element and its topmost container (e.g., card, portal-card, etc.)
          let blockingElement = elementAtPoint;
          let container = blockingElement;
          
          if (blockingElement && !blockingElement.closest(".sml-compliance-alert")) {
            // Traverse up to find a meaningful container (card, portal-card, or similar widget)
            while (container && container !== document.body) {
              const classList = container.className;
              if (classList && (classList.includes("card") || classList.includes("portal") || classList.includes("widget"))) {
                break;
              }
              container = container.parentElement;
            }
            
            // If we found a container, insert cloned alert next to it
            if (container && container !== document.body) {
              const clonedBtn = btn.cloneNode(true);
              clonedBtn.className += " smlc-unblocked-alert-button";
              clonedBtn.style.marginLeft = "0.35rem";
              clonedBtn.title = "Accessibility alert (covered by app button)";
              
              // Re-attach click handler to make the cloned button functional
              clonedBtn.onclick = btn.onclick;
              clonedBtn.addEventListener("click", function(e) {
                btn.click();
              });
              
              if (container.nextSibling) {
                container.parentNode.insertBefore(clonedBtn, container.nextSibling);
              } else {
                container.parentNode.appendChild(clonedBtn);
              }
            }
          }
          
          // Hide/remove the original blocked alert button since user will use the cloned one
          btn.style.display = "none";
          
          const parent = btn.closest("[data-smlc-generated-id]");
          if (parent) {
            const sibling = parent.querySelector("[id^='smlc-issue-target-']");
            if (sibling && sibling.id) {
              blockedLabels.push(sibling.id);
            }
          }
        }
      } catch (_) {
        // Silently skip elements that error on getBoundingClientRect
      }
    });

    return { blockedCount, blockedLabels };
  }

  function renderIssuePanel(report) {
    const existing = document.getElementById(PANEL_ID);
    if (existing) {
      existing.remove();
    }

    ensurePanelStyles();

    const issues = buildIssueRecords(report.alerts);
    const total = Number(report.total || 0);
    const displayVersion = getDisplayVersion();
    const bookmarkletVersion = getBookmarkletVersion();
    const updateNotice = getBookmarkletUpdateNotice(displayVersion, bookmarkletVersion);
    const blockedAlerts = detectBlockedAlerts();
    const levelConfig = [
      { key: "critical", label: "Critical", count: Number(report.critical || 0) },
      { key: "error", label: "Errors", count: Number(report.errors || 0) },
      { key: "warning", label: "Warnings", count: Number(report.warnings || 0) },
      { key: "info", label: "Info", count: Number(report.info || 0) }
    ];
    const levelRank = { critical: 0, error: 1, warning: 2, info: 3 };
    const activeLevels = new Set(levelConfig.map(item => item.key));
    let sortMode = "found";

    const issuesHtml = function (renderIssues) {
      return renderIssues.map(issue => {
      const jumpLink = issue.targetId
        ? "<a class='smlc-jump-link' href='#" + escapeHtml(issue.targetId) + "' data-smlc-target='" + escapeHtml(issue.targetId) + "'>Jump to location</a>"
        : "<a class='smlc-jump-link' href='#' data-smlc-target='body'>Jump to location</a>";

      const messageHtml = issue.targetId
        ? "<a class='smlc-issue-message-link' href='#" + escapeHtml(issue.targetId) + "' data-smlc-target='" + escapeHtml(issue.targetId) + "'>" + escapeHtml(issue.message) + "</a>"
        : "<a class='smlc-issue-message-link' href='#' data-smlc-target='body'>" + escapeHtml(issue.message) + "</a>";

      const referenceLink = "<a class='smlc-reference-link' href='" + escapeAttribute(issue.referenceUrl) + "' target='_blank' rel='noopener noreferrer'>More Info</a>";

      return [
        "<li class='smlc-item'>",
        "<div class='smlc-title'>[" + escapeHtml(issue.levelLabel) + "] " + escapeHtml(issue.title) + "</div>",
        issue.plainDescription ? "<div class='smlc-plain'>" + escapeHtml(issue.plainDescription) + "</div>" : "",
        renderContrastSwatches(issue.contrastSwatches),
        "<div>" + messageHtml + "</div>",
        "<div class='smlc-meta'><strong>Why this matters:</strong> " + escapeHtml(issue.why) + "</div>",
        "<div class='smlc-issue-actions'>" + referenceLink + jumpLink + "</div>",
        "</li>"
      ].join("");
      }).join("");
    };

    function getVisibleIssues() {
      const filtered = issues.filter(issue => activeLevels.has(issue.level));
      const sorted = filtered.slice();

      if (sortMode === "page") {
        sorted.sort((a, b) => {
          if (a.pageOrder !== b.pageOrder) return a.pageOrder - b.pageOrder;
          return a.originalIndex - b.originalIndex;
        });
      } else if (sortMode === "priority") {
        sorted.sort((a, b) => {
          const rankA = Object.prototype.hasOwnProperty.call(levelRank, a.level) ? levelRank[a.level] : 99;
          const rankB = Object.prototype.hasOwnProperty.call(levelRank, b.level) ? levelRank[b.level] : 99;
          if (rankA !== rankB) return rankA - rankB;
          return a.originalIndex - b.originalIndex;
        });
      } else if (sortMode === "title") {
        sorted.sort((a, b) => {
          const titleCompare = a.title.localeCompare(b.title);
          if (titleCompare !== 0) return titleCompare;
          return a.originalIndex - b.originalIndex;
        });
      } else {
        sorted.sort((a, b) => a.originalIndex - b.originalIndex);
      }

      return sorted;
    }

    function updateToggleButtonLabel(visibleCountOverride) {
      const toggleButton = panel.querySelector("button[data-smlc-toggle]");
      const body = panel.querySelector("#smlc-issues-body");
      if (!toggleButton || !body) return;

      const visibleCount = Number.isFinite(visibleCountOverride)
        ? visibleCountOverride
        : getVisibleIssues().length;

      toggleButton.textContent = body.hidden
        ? "See all issues (" + visibleCount + " of " + total + ")"
        : "Hide all issues (" + visibleCount + " of " + total + ")";
    }

    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Tzedek audit issues");
    const repositoryUrl = getRepositoryUrl();
    panel.innerHTML = [
      "<div class='smlc-headline'>",
      "<div class='smlc-headline-main'>",
      "<button type='button' class='smlc-toggle-btn' data-smlc-toggle='1' aria-expanded='false' aria-controls='smlc-issues-body'>See all issues (" + total + ")</button>",
      "<button type='button' class='smlc-refresh-btn m-0 p-0' data-smlc-refresh='1' aria-label='Refresh Tzedek check' title='Refresh Tzedek check'>⟳</button>",
      "</div>",
      "<div class='smlc-headline-center'>",
      "<a class='smlc-version' href='" + escapeAttribute(repositoryUrl) + "' target='_blank' rel='noopener noreferrer' aria-label='Open Tzedek GitHub repository' title='Click to see the GitHub repo'>v" + escapeHtml(displayVersion) + "</a>",
      "</div>",
      "<div class='smlc-actions'>",
      "<button type='button' class='smlc-close-btn' data-smlc-close='1' aria-label='Close issues bar'>Close Issues Bar</button>",
      "<button type='button' class='btn btn-dark' data-smlc-shutdown='1' aria-label='Close Tzedek'>Close Tzedek</button>",
      "</div>",
      "</div>",
      updateNotice ? "<div class='smlc-update-notice' role='status' aria-live='polite'><div><strong>Bookmarklet update required</strong>Your saved bookmarklet was built for v" + escapeHtml(updateNotice.bookmarkletVersion) + ", but this runtime is v" + escapeHtml(updateNotice.runtimeVersion) + ". Recreate the bookmarklet from <a href='" + escapeHtml(updateNotice.installUrl) + "'>the installer page</a> so runtime changes stay current.</div><button type='button' class='smlc-alert-close-btn' data-smlc-dismiss-alert='update' aria-label='Dismiss update notice'>✕</button></div>" : "",
      blockedAlerts.blockedCount > 0 ? "<div class='smlc-update-notice' role='status' aria-live='polite' style='border-color:#dc2626;background:#fee2e2;color:#7f1d1d;'><div><strong>⚠ " + blockedAlerts.blockedCount + " inline alert(s) blocked</strong>Some issues could not be accessed via inline alert buttons—they may be covered by overlays or have layout issues. Use \"See all issues\" above to review all issues in this panel.</div><button type='button' class='smlc-alert-close-btn' data-smlc-dismiss-alert='blocked' aria-label='Dismiss blocked alerts notice' style='color:#7f1d1d;'>✕</button></div>" : "",
      "<div id='smlc-issues-body' class='smlc-body' hidden>",
      "<div class='smlc-controls'>",
      "<div class='smlc-summary' data-smlc-summary></div>",
      "<label class='smlc-sort-wrap' for='smlc-sort-select'>Order by",
      "<select id='smlc-sort-select' class='smlc-sort-select' data-smlc-sort>",
      "<option value='found'>Order Found</option>",
      "<option value='page'>On Page</option>",
      "<option value='priority'>Alert Priority</option>",
      "<option value='title'>Title A-Z</option>",
      "</select>",
      "</label>",
      "</div>",
      "<div data-smlc-issues></div>",
      "</div>"
    ].join("");
    markSmlcElementTree(panel);
    removeIssuePanelControlsFromTabOrder(panel);

    function renderFilteredIssues() {
      const summaryHost = panel.querySelector("[data-smlc-summary]");
      const issuesHost = panel.querySelector("[data-smlc-issues]");
      if (!summaryHost || !issuesHost) return;

      summaryHost.innerHTML = levelConfig.map(level => {
        const pressed = activeLevels.has(level.key);
        return "<button type='button' class='smlc-pill' data-smlc-level='" + escapeHtml(level.key) + "' aria-pressed='" + String(pressed) + "'>" + escapeHtml(level.label) + ": " + level.count + "</button>";
      }).join("");

      const visibleIssues = getVisibleIssues();
      issuesHost.innerHTML = visibleIssues.length
        ? "<ol class='smlc-issue-list'>" + issuesHtml(visibleIssues) + "</ol>"
        : "<p>No issues match the current filters.</p>";

      updateToggleButtonLabel(visibleIssues.length);
    }

    renderFilteredIssues();

    panel.addEventListener("click", function (event) {
      const toggleBtn = event.target.closest("button[data-smlc-toggle]");
      if (toggleBtn) {
        const body = panel.querySelector("#smlc-issues-body");
        if (!body) return;
        const willOpen = body.hidden;
        body.hidden = !willOpen;
        toggleBtn.setAttribute("aria-expanded", String(willOpen));
        updateToggleButtonLabel();
        return;
      }

      const filterBtn = event.target.closest("button[data-smlc-level]");
      if (filterBtn) {
        const level = (filterBtn.getAttribute("data-smlc-level") || "").toLowerCase();
        if (!level) return;

        if (activeLevels.has(level)) {
          activeLevels.delete(level);
        } else {
          activeLevels.add(level);
        }

        renderFilteredIssues();
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

      const dismissAlertBtn = event.target.closest("button[data-smlc-dismiss-alert]");
      if (dismissAlertBtn) {
        const alertDiv = dismissAlertBtn.closest(".smlc-update-notice");
        if (alertDiv) {
          alertDiv.remove();
        }
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

    const sortSelect = panel.querySelector("select[data-smlc-sort]");
    if (sortSelect) {
      sortSelect.value = sortMode;
      sortSelect.addEventListener("change", function (event) {
        sortMode = event.target.value || "found";
        renderFilteredIssues();
      });
    }

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
