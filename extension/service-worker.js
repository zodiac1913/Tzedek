const RUNNER_PATH = "page/smlComplianceRunner.js";
const THEME_PATH = "page/assets/Tzedek.css";
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

  await extensionApi.scripting.executeScript({
    target: { tabId: tab.id },
    func: injectTzedekRunner,
    args: [extensionApi.runtime.getURL(RUNNER_PATH), extensionApi.runtime.getURL(THEME_PATH), RELEASE_VERSION]
  });
});

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
    bootstrapIconsHref: "",
    assetBaseUrl,
    releaseVersion: typeof releaseVersion === "string" && releaseVersion.trim().length > 0 ? releaseVersion : (currentConfig?.releaseVersion || ""),
    repositoryUrl: typeof currentConfig?.repositoryUrl === "string" && currentConfig.repositoryUrl.trim().length > 0
      ? currentConfig.repositoryUrl.trim()
      : "https://github.com/zodiac1913/Tzedek"
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
