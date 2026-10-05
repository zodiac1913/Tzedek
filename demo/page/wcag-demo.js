function mountDemoFixtures() {
  const fixtures = {
    "fixture-links-buttons": [
      "<p><a href='#'>Click here</a> to read a vague link example.</p>",
      "<p><a href='/policies/telework'>Read more</a> about telework. <a href='/benefits/telework-request'>Read more</a> if you need the request form.</p>",
      "<p><a href='/demo'>Open the demo directory</a> to exercise same-origin redirect review.</p>",
      "<p><span class='fake-button' id='demoFakeButton'>Open settings</span></p>",
      "<p><button type='button' aria-label='Open employee profile'>View profile</button></p>",
      "<p><button type='button' class='issue-button'>Low contrast button</button></p>",
      "<p><input type='submit' value='Send request' aria-label='Submit form now'></p>",
      "<details><summary aria-label='Expand policy guidance'>Open billing panel</summary><p>Summary text mismatch example.</p></details>",
      "<div role='tab' aria-label='Account security tab' tabindex='0'>Profile</div>",
      "<p><a class='muted-link' href='/missing-page'>Review details</a></p>",
      "<p><a href='/smlDocs.html' aria-label='Request application access'>Need Access to an Application?</a></p>"
    ].join(""),
    "fixture-forms-media": [
      "<p><img src='./assets/smoke.png' width='160' height='100'></p>",
      "<p><input type='text' placeholder='Search policies'></p>",
      "<p><input type='checkbox' id='agree-demo'><span>I agree to the terms</span></p>",
      "<div><span id='demoAriaLabel'>Badge number</span><input type='text' aria-labelledby='demoAriaLabel demoAriaLabel demoMissingLabel'></div>",
      "<div><label for='demoBadgeField'>Badge number</label><span id='demoBadgeFieldAriaLabel'>Employee badge ID</span><input id='demoBadgeField' type='text' aria-labelledby='demoBadgeFieldAriaLabel'></div>",
      "<div><label for='demoSharedHelpField'>Agency email</label><span id='demoSharedHelp'>Use your agency email.</span><span id='demoSharedHelp'>Duplicate help text node.</span><input id='demoSharedHelpField' type='email' aria-describedby='demoSharedHelp'></div>",
      "<form aria-label='Demo validation form'><label for='email-demo'>Work email</label><input id='email-demo' type='email' required aria-invalid='true'><div id='email-demo-error' role='alert'>Enter a valid work email address.</div></form>",
      "<iframe srcdoc='<form><label>Name <input></label></form>' title='content'></iframe>",
      "<embed src='data:text/html,%3Cp%3EEmbedded%20policy%20preview%3C/p%3E' type='text/html'>"
    ].join(""),
    "fixture-structure": [
      "<table>",
      "<tr><td>Region</td><td>Open findings</td></tr>",
      "<tr><td>North</td><td>12</td></tr>",
      "<tr><td>South</td><td>7</td></tr>",
      "</table>",
      "<table>",
      "<caption>Regional staffing totals</caption>",
      "<thead>",
      "<tr><th rowspan='2'>Region</th><th colspan='2'>Open findings</th></tr>",
      "<tr><th>Critical</th><th>Warning</th></tr>",
      "</thead>",
      "<tbody>",
      "<tr><th scope='row'>North</th><td>5</td><td>7</td></tr>",
      "<tr><th scope='row'>South</th><td>2</td><td>4</td></tr>",
      "</tbody>",
      "</table>",
      "<table>",
      "<caption>Regional staffing totals with broken header ids</caption>",
      "<thead>",
      "<tr><th id='demoRegionHeader' rowspan='2' scope='col'>Region</th><th id='demoOpenFindingsHeader' colspan='2' scope='colgroup'>Open findings</th></tr>",
      "<tr><th id='demoCriticalHeader' scope='col'>Critical</th><th id='demoWarningHeader' scope='col'>Warning</th></tr>",
      "</thead>",
      "<tbody>",
      "<tr><th id='demoNorthRow' scope='row'>North</th><td headers='demoNorthRow demoCritcalHeader'>5</td><td headers='demoNorthRow demoWarningHeader'>7</td></tr>",
      "<tr><th id='demoSouthRow' scope='row'>South</th><td headers='demoSouthRow demoCriticalHeader'>2</td><td headers='demoSouthRow demoWarningHeader'>4</td></tr>",
      "</tbody>",
      "</table>"
    ].join("")
  };

  for (const [targetId, html] of Object.entries(fixtures)) {
    const target = document.getElementById(targetId);
    if (target) {
      target.innerHTML = html;
    }
  }
}

window.TzedekConfig = {
  moduleUrl: new URL("./smlCompliance.js", document.baseURI).href,
  assetBaseUrl: new URL("./assets/", document.baseURI).href,
  bootstrapIconsHref: "",
  repositoryUrl: "https://github.com/zodiac1913/Tzedek"
};

window.launchTzedek = function launchTzedek() {
  const existing = document.getElementById("tzedek-demo-runner");
  if (existing) {
    existing.remove();
  }

  const script = document.createElement("script");
  script.id = "tzedek-demo-runner";
  script.src = `./smlComplianceRunner.js?t=${Date.now()}`;
  script.dataset.moduleUrl = window.TzedekConfig.moduleUrl;
  document.head.appendChild(script);
};

// Keep the deliberately nonsemantic control, but wire it without a CSP-blocked inline handler.
mountDemoFixtures();
document.getElementById("demoFakeButton").addEventListener("click", () => alert("Not semantic"));
document.getElementById("runTzedekButton").addEventListener("click", window.launchTzedek);
window.launchTzedek();
