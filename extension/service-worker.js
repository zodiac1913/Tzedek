const RUNNER_PATH = "page/smlComplianceRunner.js";
const THEME_PATH = "page/assets/Tzedek.css";
const extensionApi = globalThis.browser || globalThis.chrome;

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
    args: [extensionApi.runtime.getURL(RUNNER_PATH), extensionApi.runtime.getURL(THEME_PATH)]
  });
});

function injectTzedekRunner(runnerUrl, themeUrl) {
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
    assetBaseUrl
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
