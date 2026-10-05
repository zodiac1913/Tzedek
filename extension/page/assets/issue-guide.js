import { getCanonicalReferenceLinks, getComplianceFixContent, getPlainLanguageIssueDescription } from "../smlCompliance.js";
import { getIssueGuideDetails } from "./tzedekIssueGuideData.js";

const params = new URLSearchParams(window.location.search);
const title = (params.get("title") || "").trim() || "Accessibility Finding";
const message = (params.get("message") || "").trim();
const visibleLabel = (params.get("visibleLabel") || "").trim();
const labelSource = (params.get("labelSource") || "").trim();
const hasLabelMismatchContext = title === "Accessible Name Does Not Include Visible Label"
  && visibleLabel
  && ["aria-label", "aria-labelledby"].includes(labelSource);
const genericFixDescription = message
  ? `Inspect the flagged element and correct the underlying issue: ${message}`
  : `Inspect the flagged element, correct the ${title} condition using the guidance below, and run Tzedek again to verify the fix.`;
const summary = getPlainLanguageIssueDescription(title);
const fixContent = getComplianceFixContent(title, null);
const externalLinks = getCanonicalReferenceLinks(title, message);
const guideDetails = getIssueGuideDetails(title);

document.title = `${title} | Tzedek Issue Guide`;
document.getElementById("guideTitle").textContent = title;
document.getElementById("guideSummary").textContent = summary || `Tzedek found ${title} on the checked page.`;

const actions = document.getElementById("guideActions");
for (const externalLink of externalLinks) {
  const link = document.createElement("a");
  link.className = "btn btn-primary";
  link.href = externalLink.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = externalLink.label || "More Info";
  actions.appendChild(link);
}

const titleOnlyUrl = new URL(window.location.href);
titleOnlyUrl.search = new URLSearchParams({ title }).toString();
const resetLink = document.createElement("a");
resetLink.className = "btn btn-secondary";
resetLink.href = titleOnlyUrl.href;
resetLink.textContent = "Open Generic Guide View";
actions.appendChild(resetLink);

if (message) {
  document.getElementById("detectedSection").hidden = false;
  document.getElementById("detectedMessage").textContent = message;
}

document.getElementById("overviewSection").hidden = false;
document.getElementById("overviewText").textContent = guideDetails?.overview
  || `The flagged element meets Tzedek's ${title} check. The detected finding identifies the exact condition that must be corrected.`;

if (Array.isArray(guideDetails?.whyItMatters) && guideDetails.whyItMatters.length > 0) {
  document.getElementById("whySection").hidden = false;
  const whyList = document.getElementById("whyList");
  for (const item of guideDetails.whyItMatters) {
    const li = document.createElement("li");
    li.textContent = item;
    whyList.appendChild(li);
  }
}

document.getElementById("reviewSection").hidden = false;
const reviewList = document.getElementById("reviewList");
const reviewItems = Array.isArray(guideDetails?.reviewChecklist) && guideDetails.reviewChecklist.length > 0
  ? guideDetails.reviewChecklist
  : [
      "Return to the checked page and use Jump to location to inspect the flagged element.",
      message || `Correct the ${title} condition on the flagged element and any related markup.`,
      "Run Tzedek again and confirm this finding no longer appears."
    ];
for (const item of reviewItems) {
  const li = document.createElement("li");
  li.textContent = item;
  reviewList.appendChild(li);
}

const howToFix = Array.isArray(guideDetails?.howToFix) ? guideDetails.howToFix : [];
if (fixContent || howToFix.length > 0) {
  document.getElementById("fixSection").hidden = false;
  document.getElementById("fixDescription").textContent = hasLabelMismatchContext
    ? labelSource === "aria-labelledby"
      ? `For this finding, replace aria-labelledby with an aria-label that starts with the visible words "${visibleLabel}".`
      : `For this finding, change aria-label to start with the visible words "${visibleLabel}".`
    : fixContent?.description || genericFixDescription;
  if (howToFix.length > 0) {
    const howToFixList = document.createElement("ul");
    for (const item of howToFix) {
      const li = document.createElement("li");
      li.textContent = item;
      howToFixList.appendChild(li);
    }
    document.getElementById("fixSection").insertBefore(howToFixList, document.getElementById("fixSnippets"));
  }
  const fixSnippets = document.getElementById("fixSnippets");
  const guideExamples = hasLabelMismatchContext
    ? []
    : Array.isArray(guideDetails?.examples) ? guideDetails.examples : [];
  const snippetData = hasLabelMismatchContext
    ? [{
        heading: labelSource === "aria-labelledby"
          ? "Replace aria-labelledby with this aria-label"
          : "Set aria-label to the visible label",
        code: `aria-label=${JSON.stringify(visibleLabel)}`
      }]
    : guideExamples.length > 0 ? [] : fixContent?.snippets || [];
  for (const snippet of [...guideExamples, ...snippetData]) {
    const wrapper = document.createElement("div");
    wrapper.className = "guide-snippet";

    const heading = document.createElement("p");
    heading.className = "guide-note";
    heading.textContent = snippet.heading;

    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = snippet.code;
    pre.appendChild(code);

    wrapper.appendChild(heading);
    wrapper.appendChild(pre);
    fixSnippets.appendChild(wrapper);
  }
} else {
  document.getElementById("fixSection").hidden = false;
  document.getElementById("fixDescription").textContent = genericFixDescription;
  const fallbackSteps = [
    "Use Jump to location to inspect the reported element and its surrounding markup.",
    "Correct the underlying markup or behavior; do not hide or remove the finding just to silence the checker.",
    "Run Tzedek again and confirm the issue is resolved while the control or content still works as intended."
  ];
  const fallbackList = document.createElement("ul");
  for (const item of fallbackSteps) {
    const li = document.createElement("li");
    li.textContent = item;
    fallbackList.appendChild(li);
  }
  document.getElementById("fixSection").insertBefore(fallbackList, document.getElementById("fixSnippets"));
}
