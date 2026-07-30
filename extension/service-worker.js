const RUNNER_PATH = "page/smlComplianceRunner.js";
const THEME_PATH = "page/assets/Tzedek.css";
const CDP_KEYBOARD_EVIDENCE_ATTR = "data-tzedek-cdp-keyboard-evidence";
const CDP_CLICK_EVIDENCE_ATTR = "data-tzedek-cdp-click-evidence";
const extensionApi = globalThis.browser || globalThis.chrome;
const MANIFEST = extensionApi.runtime.getManifest();
const RELEASE_VERSION = MANIFEST.version_name || MANIFEST.version;

extensionApi.action.onClicked.addListener(async (tab) => {
  if (!tab.id) {
    return;
  }

  const url = tab.url || "";
  if (!/^https?:/i.test(url)) {
    return;
  }

  await annotateRoleButtonKeyboardEvidence(tab.id);

  await extensionApi.scripting.executeScript({
    target: { tabId: tab.id },
    func: injectTzedekRunner,
    args: [extensionApi.runtime.getURL(RUNNER_PATH), extensionApi.runtime.getURL(THEME_PATH), RELEASE_VERSION]
  });
});

async function annotateRoleButtonKeyboardEvidence(tabId) {
  if (!extensionApi.debugger || typeof extensionApi.debugger.attach !== "function") {
    return;
  }

  const target = { tabId };
  const sendCommand = (method, params = {}) => new Promise((resolve, reject) => {
    extensionApi.debugger.sendCommand(target, method, params, (result) => {
      const lastError = extensionApi.runtime?.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve(result || {});
    });
  });

  const attach = () => new Promise((resolve, reject) => {
    extensionApi.debugger.attach(target, "1.3", () => {
      const lastError = extensionApi.runtime?.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve();
    });
  });

  const detach = () => new Promise((resolve) => {
    extensionApi.debugger.detach(target, () => resolve());
  });

  let attached = false;

  try {
    await attach();
    attached = true;

    await sendCommand("Runtime.enable");

    await sendCommand("Runtime.evaluate", {
      expression: `(() => {
        const nodes = Array.from(document.querySelectorAll("[role='button']"));
        window.__tzedekRoleButtons = nodes;
        for (const node of nodes) {
          node.removeAttribute("${CDP_KEYBOARD_EVIDENCE_ATTR}");
          node.removeAttribute("${CDP_CLICK_EVIDENCE_ATTR}");
        }
        return nodes.length;
      })()`,
      returnByValue: true
    });

    const countResult = await sendCommand("Runtime.evaluate", {
      expression: "window.__tzedekRoleButtons ? window.__tzedekRoleButtons.length : 0",
      returnByValue: true
    });

    const count = Number(countResult?.result?.value || 0);

    for (let index = 0; index < count; index += 1) {
      const objectResult = await sendCommand("Runtime.evaluate", {
        expression: `window.__tzedekRoleButtons[${index}]`,
        objectGroup: "tzedek-role-buttons",
        returnByValue: false
      });

      const objectId = objectResult?.result?.objectId;
      if (!objectId) {
        continue;
      }

      const listenersResult = await sendCommand("DOMDebugger.getEventListeners", {
        objectId,
        depth: 4,
        pierce: true
      });

      const listeners = Array.isArray(listenersResult?.listeners) ? listenersResult.listeners : [];
      const hasKeyboard = listeners.some((listener) => {
        const eventType = String(listener?.type || "").toLowerCase();
        return eventType === "keydown" || eventType === "keyup" || eventType === "keypress";
      });
      const hasClick = listeners.some((listener) => String(listener?.type || "").toLowerCase() === "click");

      if (hasKeyboard) {
        await sendCommand("Runtime.callFunctionOn", {
          objectId,
          functionDeclaration: `function(){ this.setAttribute("${CDP_KEYBOARD_EVIDENCE_ATTR}", "true"); }`
        });
      }

      if (hasClick) {
        await sendCommand("Runtime.callFunctionOn", {
          objectId,
          functionDeclaration: `function(){ this.setAttribute("${CDP_CLICK_EVIDENCE_ATTR}", "true"); }`
        });
      }
    }

    await sendCommand("Runtime.releaseObjectGroup", { objectGroup: "tzedek-role-buttons" });
    await sendCommand("Runtime.evaluate", {
      expression: "window.__tzedekRoleButtons = undefined"
    });
  } catch (error) {
    console.warn("Tzedek debugger listener enrichment skipped:", error instanceof Error ? error.message : error);
  } finally {
    if (attached) {
      await detach();
    }
  }
}

function injectTzedekRunner(runnerUrl, themeUrl, releaseVersion) {
  // Clear runner state so a same-page reinjection does not short-circuit on the stale flag.
  window.__smlComplianceRunnerActive = undefined;
  window.__smlComplianceLastReport = undefined;

  const existingBootstrap = document.getElementById("sml-compliance-module-bootstrap");
  if (existingBootstrap) {
    existingBootstrap.remove();
  }

  const existing = document.getElementById("tzedek-extension-runner");
  if (existing) {
    existing.remove();
  }

  const existingTheme = document.getElementById("tzedek-extension-theme");
  if (existingTheme) {
    existingTheme.remove();
  }

  const assetBaseUrl = runnerUrl.replace(/smlComplianceRunner\.js(?:\?.*)?$/, "assets/");
  const currentConfig = globalThis.TzedekConfig && typeof globalThis.TzedekConfig === "object"
    ? globalThis.TzedekConfig
    : undefined;

  globalThis.TzedekConfig = {
    ...currentConfig,
    moduleUrl: runnerUrl.replace(/smlComplianceRunner\.js(?:\?.*)?$/, "smlCompliance.js"),
    bootstrapIconsHref: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css",
    assetBaseUrl,
    releaseVersion: typeof releaseVersion === "string" && releaseVersion.trim().length > 0 ? releaseVersion : (currentConfig?.releaseVersion || "")
  };

  const link = document.createElement("link");
  link.id = "tzedek-extension-theme";
  link.rel = "stylesheet";
  link.href = `${themeUrl}?t=${Date.now()}`;
  link.dataset.smlc = "1";
  (document.head || document.documentElement).appendChild(link);

  const script = document.createElement("script");
  script.id = "tzedek-extension-runner";
  script.src = `${runnerUrl}?t=${Date.now()}`;
  script.async = false;
  script.dataset.smlc = "1";
  script.dataset.moduleUrl = globalThis.TzedekConfig.moduleUrl;
  (document.head || document.documentElement).appendChild(script);
}
