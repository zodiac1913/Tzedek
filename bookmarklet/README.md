# Using Tzedek As A Bookmarklet

Tzedek's runner is built to start from a classic injected script, so you can use the shared runtime as a bookmarklet without the browser extension.

## Local Development Use

1. Sync the shared runtime into the demo bundle:

	```sh
	npm run demo:sync
	```

2. Serve the repo from the project root:

	```sh
	python3 -m http.server 4183
	```

3. Create a new bookmark in your browser.

4. Use this as the bookmark URL:

	```text
	javascript:(()=>{const base='http://localhost:4183/demo/page/';window.TzedekConfig={...(window.TzedekConfig||{}),moduleUrl:new URL('smlCompliance.js',base).href,assetBaseUrl:new URL('assets/',base).href,bootstrapIconsHref:'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css'};document.getElementById('tzedek-bookmarklet-loader')?.remove();const script=document.createElement('script');script.id='tzedek-bookmarklet-loader';script.src=new URL(`smlComplianceRunner.js?t=${Date.now()}`,base).href;script.dataset.moduleUrl=window.TzedekConfig.moduleUrl;document.documentElement.appendChild(script);})();
	```

5. Open the page you want to review and click the bookmark.

The bookmarklet loads the same shared runtime used by the extension. After Tzedek opens, use the page controls the same way you would in the extension flow.

## Notes

- The bookmarklet needs the runtime files to be reachable from the page you are reviewing. For local development, that means the `http.server` process must be running.
- Clicking the bookmarklet again after closing Tzedek will relaunch it on the current page.
- If you want to host bookmarklet assets publicly later, replace `http://localhost:4183/demo/page/` with the public base URL that serves `smlComplianceRunner.js`, `smlCompliance.js`, and `assets/`.

## Hosted Distribution Shape

For a public bookmarklet release, keep the same structure:

- one hosted `smlComplianceRunner.js`
- one hosted `smlCompliance.js`
- one hosted `assets/` directory
- one tiny bookmarklet that sets `window.TzedekConfig` and injects the runner
