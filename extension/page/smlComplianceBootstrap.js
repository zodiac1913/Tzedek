// External module fallback for pages whose CSP blocks inline scripts.
// Report import failures to the runner so it can try the next loading strategy.
const readyEventName = "smlComplianceModuleReady";
try {
  const moduleUrl = new URL(import.meta.url).searchParams.get("moduleUrl");
  if (!moduleUrl) throw new Error("Module bootstrap URL is missing moduleUrl");
  const runtime = await import(moduleUrl);
  if (typeof runtime.smlCompliance !== "function") {
    throw new Error("Loaded module but smlCompliance export is missing");
  }
  window.smlCompliance = runtime.smlCompliance;
  window.runComplianceAudit = runtime.runComplianceAudit;
  window.smlComplianceGetMoreInfoUrl = runtime.getMoreInfoUrl;
  window.smlComplianceGetMoreInfoLinks = runtime.getMoreInfoLinks;
  window.smlComplianceGetNewWindowLinkLabel = runtime.getSmlcNewWindowLinkLabel;
  window.dispatchEvent(new Event(readyEventName));
} catch (error) {
  window.dispatchEvent(new CustomEvent(readyEventName, { detail: { error } }));
}
