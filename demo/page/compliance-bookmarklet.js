(function () {
  const TZEDEK_VERSION = "2026.10.05.06";
  // A document base changes fragment navigation; keep the skip link on this page.
  const skipLink = document.querySelector(".skip-link");
  if (skipLink) {
    const skipTarget = new URL(window.location.href);
    skipTarget.hash = "maincontent";
    skipLink.href = skipTarget.href;
  }
  const runtimeBaseUrl = new URL("./", document.baseURI).href;
  const config = {
    moduleUrl: new URL("smlCompliance.js", runtimeBaseUrl).href,
    assetBaseUrl: new URL("assets/", runtimeBaseUrl).href,
    bootstrapIconsHref: "",
    repositoryUrl: "https://github.com/zodiac1913/Tzedek"
  };
  const bookmarkletCode = "javascript:(()=>{const base=" + JSON.stringify(runtimeBaseUrl) + ";const cfg=" + JSON.stringify(config) + ";window.TzedekConfig={...(window.TzedekConfig||{}),...cfg};document.getElementById('tzedek-bookmarklet-loader')?.remove();const script=document.createElement('script');script.id='tzedek-bookmarklet-loader';script.src=new URL('smlComplianceRunner.js?t='+Date.now()+'&bookmarkletVersion=" + TZEDEK_VERSION + "',base).href;script.dataset.moduleUrl=cfg.moduleUrl;document.documentElement.appendChild(script);})();";

  const bookmarkletLink = document.getElementById("bookmarkletLink");
  const bookmarkletCodeField = document.getElementById("bookmarkletCode");
  const copyButton = document.getElementById("copyBookmarkletButton");
  const hostSummary = document.getElementById("bookmarkletHost");

  if (bookmarkletLink instanceof HTMLAnchorElement) {
    bookmarkletLink.href = bookmarkletCode;
  }

  if (bookmarkletCodeField instanceof HTMLTextAreaElement) {
    bookmarkletCodeField.value = bookmarkletCode;
  }

  if (hostSummary) {
    hostSummary.textContent = "This bookmarklet will load Tzedek from " + runtimeBaseUrl;
  }

  if (copyButton instanceof HTMLButtonElement && bookmarkletCodeField instanceof HTMLTextAreaElement) {
    copyButton.addEventListener("click", async function () {
      try {
        await navigator.clipboard.writeText(bookmarkletCodeField.value);
        copyButton.textContent = "Copied";
      } catch (error) {
        console.warn("Tzedek could not copy the bookmarklet; use manual copying.", error);
        bookmarkletCodeField.focus();
        bookmarkletCodeField.select();
        copyButton.textContent = "Select the code and copy manually";
      }
    });
  }
})();
