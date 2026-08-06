/**
 * Tzedek runtime - WCAG 2.2 Level AA/AAA Compliance Checker
 * 
 * Comprehensive accessibility audit tool that validates:
 * - WCAG 2.2 Level AA compliance (minimum standard)
 * - WCAG 2.2 Level AAA enhancements (where practical)
 * - 508 Compliance (US Federal Accessibility Standard)
 * - Color contrast ratios (APCA algorithm)
 * - Keyboard navigation
 * - Screen reader support
 * - Motion sensitivity
 * - Focus management
 * - Form accessibility
 * - Semantic HTML
 * - Media alternatives
 * 
 * Imported from the earlier public-domain CATS-era runtime and being adapted for Tzedek.
 * Published: 2026-07-20
 */
"use strict";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])"
].join(", ");

const ALERT_CLASSES = {
  critical: "alert bg-danger text-white border border-3 border-danger shadow-lg",
  error: "alert bg-danger text-white border border-3 border-danger shadow-lg",
  warning: "alert bg-warning text-white border border-3 border-warning shadow-lg",
  info: "alert bg-info text-white border border-3 border-info shadow-lg",
  success: "alert bg-success text-white border border-3 border-success shadow-lg"
};

const INLINE_ALERT_STYLE_ID = "sml-compliance-inline-alert-style";
const INLINE_ALERT_HOSTS = new WeakMap();
const INLINE_ALERT_WRAPPERS = new WeakMap();
const INLINE_ALERT_REPOSITIONERS = new WeakMap();
const INLINE_ALERT_TOGGLES = new WeakMap();
let INLINE_ALERT_DISMISS_HANDLERS_BOUND = false;
const ALERT_LEVEL_PRIORITY = {
  critical: 4,
  error: 3,
  warning: 2,
  info: 1,
  success: 0
};
const BOOTSTRAP_ICONS_LINK_ID = "sml-compliance-bootstrap-icons";
const DEFAULT_BOOTSTRAP_ICONS_HREF = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
const DEFAULT_SMOKE_IMAGE_URL = new URL("./assets/smoke.png", import.meta.url).href;
const BROKEN_LINK_STATUS_CACHE = new Map();
const MDN_ARIA_REFERENCE_BASE = "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/";
const MDN_ARIA_ROLE_REFERENCE_BASE = "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/";
const MDN_SEARCH_BASE = "https://developer.mozilla.org/en-US/search?q=";
const MORE_INFO_URL_BY_TITLE = {
  "Duplicate ID": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/id",
  "Duplicate ID Referenced": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/id",
  "ARIA Attribute Misspelled": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA",
  "Invalid Role Value": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles",
  "Heading Role Missing aria-level": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/heading_role",
  "Invalid aria-level Value": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-level",
  "Duplicate aria-labelledby Reference": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-labelledby",
  "Focusable Element Hidden From Screen Readers": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden",
  "Missing Page Title": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/title",
  "Vague Page Title": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/title",
  "Missing Language Declaration": "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang",
  "Missing Lang Attribute": "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang",
  "Redundant Lang Attribute": "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang",
  "Missing Viewport Meta Tag": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport",
  "Missing Skip to Main Content Link": "https://www.w3.org/WAI/WCAG22/Techniques/general/G1",
  "Missing Skip Link": "https://www.w3.org/WAI/WCAG22/Techniques/general/G1",
  "No Headings Found": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements",
  "Missing Level 1 Heading": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements",
  "Multiple Level 1 Headings": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements",
  "Heading Level Skip": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements",
  "Empty Heading": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements",
  "Consider ARIA Heading Roles": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/heading_role",
  "Missing Alt Text": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/alt",
  "Presentation Role Conflicts with Alt Text": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/alt",
  "Empty Alt Text": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/alt",
  "Redundant Alt Text": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/alt",
  "Link Missing Text": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Text_labels_and_names",
  "Accessible Name Does Not Include Visible Label": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Text_labels_and_names",
  "Vague Link Text": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Text_labels_and_names",
  "Ambiguous Link Text": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Text_labels_and_names",
  "Duplicate Link Text, Different Destination": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Text_labels_and_names",
  "Broken Fragment Link": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a",
  "Broken Same-Origin Link": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a",
  "Same-Origin Link Redirects": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections",
  "Same-Origin Link Requires Authentication": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401",
  "Link Opens in New Window": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a",
  "Button Missing Text": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button",
  "Button Role Missing Keyboard Handler": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role",
  "Button Role Not Focusable": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role",
  "Button Role Keyboard Handler Not Statically Verifiable": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role",
  "Anchor Uses Button Role": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a",
  "Disabled State Not Announced": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled",
  "Icon-Only Button Missing Label": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Text_labels_and_names",
  "Form Should Be Labeled": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label",
  "Grouped Choices Missing Fieldset": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fieldset",
  "Input Missing Label": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label",
  "Search Input Role Missing": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/searchbox_role",
  "Low Color Contrast": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Color_contrast",
  "Missing Focus Indicator": "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html",
  "Non-Standard Click Handler": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role",
  "Audio Missing Transcript": "https://www.w3.org/WAI/WCAG22/Understanding/audio-only-and-video-only-prerecorded.html",
  "Iframe Missing Title": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe",
  "Iframe Title Too Generic": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe",
  "Embedded Content Missing Label": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/object",
  "Video Missing Captions": "https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html",
  "Video Missing Descriptions": "https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html",
  "Table Missing Caption": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/caption",
  "Table Missing thead": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/thead",
  "Table Missing tbody": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/tbody",
  "Table Header Missing Scope": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/th",
  "Table Missing Header Cells": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/th",
  "Complex Table Missing Header Associations": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/td#headers",
  "Possible Layout Table": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/table",
  "Empty List": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ul",
  "Invalid List Content": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/li",
  "Motion Not Reduced": "https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion",
  "Missing Main Content Region": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/main",
  "Missing Error Message Element": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby",
  "Missing Navigation Landmark": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/navigation_role",
  "Missing Main Landmark": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/main_role",
  "Custom Navigation Container Missing Landmark": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/navigation_role",
  "Custom Main Content Container Missing Landmark": "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/main_role",
  "Non-Semantic Button": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button",
  "Non-Semantic Link": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a"
};

function getRuntimeAssetUrl(fileName) {
  const assetBaseUrl = globalThis.TzedekConfig?.assetBaseUrl;
  if (typeof assetBaseUrl === "string" && assetBaseUrl.trim().length > 0) {
    return new URL(fileName, assetBaseUrl).href;
  }

  if (fileName === "smoke.png") {
    return DEFAULT_SMOKE_IMAGE_URL;
  }

  return new URL(`./assets/${fileName}`, import.meta.url).href;
}

const SMOKE_IMAGE_URL = getRuntimeAssetUrl("smoke.png");
const MORE_INFO_QUERY_BY_TITLE = {
  "Duplicate ID": "HTML id attribute uniqueness accessibility",
  "Duplicate ID Referenced": "HTML id attribute uniqueness accessibility",
  "ARIA Attribute Misspelled": "ARIA attribute spelling accessibility",
  "Invalid Role Value": "ARIA role accessibility",
  "Heading Role Missing aria-level": "ARIA heading role aria-level accessibility",
  "Invalid aria-level Value": "aria-level accessibility",
  "Duplicate aria-labelledby Reference": "aria-labelledby accessibility",
  "Duplicate aria-describedby Reference": "aria-describedby accessibility",
  "Focusable Element Hidden From Screen Readers": "aria-hidden focus accessibility",
  "Missing Page Title": "HTML title element accessibility",
  "Vague Page Title": "HTML title element accessibility",
  "Missing Language Declaration": "HTML lang attribute accessibility",
  "Missing Lang Attribute": "HTML lang attribute accessibility",
  "Redundant Lang Attribute": "HTML lang attribute accessibility",
  "Missing Viewport Meta Tag": "HTML viewport meta accessibility",
  "Missing Skip to Main Content Link": "skip link accessibility",
  "Missing Skip Link": "skip link accessibility",
  "No Headings Found": "HTML headings accessibility",
  "Missing Level 1 Heading": "HTML h1 accessibility",
  "Multiple Level 1 Headings": "HTML headings accessibility",
  "Heading Level Skip": "HTML heading hierarchy accessibility",
  "Empty Heading": "HTML headings accessibility",
  "Consider ARIA Heading Roles": "ARIA heading role aria-level accessibility",
  "Missing Alt Text": "HTML img alt attribute accessibility",
  "Presentation Role Conflicts with Alt Text": "HTML img alt attribute accessibility",
  "Empty Alt Text": "HTML img alt attribute accessibility",
  "Redundant Alt Text": "HTML img alt attribute accessibility",
  "Link Missing Text": "HTML link accessibility",
  "Accessible Name Does Not Include Visible Label": "accessible name visible label accessibility",
  "Vague Link Text": "HTML link accessibility descriptive link text",
  "Ambiguous Link Text": "HTML link accessibility descriptive link text",
  "Duplicate Link Text, Different Destination": "duplicate link text different destination accessibility",
  "Broken Fragment Link": "HTML fragment link target accessibility",
  "Broken Same-Origin Link": "same origin broken link accessibility",
  "Same-Origin Link Redirects": "same origin link redirect accessibility",
  "Same-Origin Link Requires Authentication": "same origin link authentication accessibility",
  "Link Opens in New Window": "link opens in new window accessibility",
  "Button Missing Text": "HTML button accessibility",
  "Button Role Missing Keyboard Handler": "custom button keyboard accessibility",
  "Button Role Not Focusable": "custom button focus accessibility",
  "Button Role Keyboard Handler Not Statically Verifiable": "custom element delegated keyboard handler accessibility",
  "Anchor Uses Button Role": "HTML anchor button role accessibility",
  "Disabled State Not Announced": "aria-disabled accessibility",
  "Icon-Only Button Missing Label": "icon button aria-label accessibility",
  "Form Should Be Labeled": "HTML form accessibility aria-label",
  "Grouped Choices Missing Fieldset": "fieldset legend radio checkbox group accessibility",
  "Input Missing Label": "HTML form label accessibility",
  "Required Field Not Indicated": "aria-required accessibility",
  "Invalid Input Not Described": "aria-describedby form error accessibility",
  "Search Input Role Missing": "search input role accessibility",
  "Empty ARIA Label": "aria-label accessibility",
  "Invalid aria-labelledby Reference": "aria-labelledby accessibility",
  "Invalid aria-describedby Reference": "aria-describedby accessibility",
  "Low Color Contrast": "color contrast accessibility",
  "Missing Focus Indicator": "focus indicator accessibility",
  "Non-Standard Click Handler": "button role keyboard accessibility",
  "Audio Missing Transcript": "audio transcript accessibility",
  "Iframe Missing Title": "HTML iframe title accessibility",
  "Iframe Title Too Generic": "HTML iframe descriptive title accessibility",
  "Embedded Content Missing Label": "embedded content accessible label accessibility",
  "Video Missing Captions": "video captions accessibility",
  "Video Missing Descriptions": "audio descriptions accessibility",
  "Table Missing Caption": "HTML table caption accessibility",
  "Table Missing thead": "HTML table thead accessibility",
  "Table Missing tbody": "HTML table tbody accessibility",
  "Table Header Missing Scope": "HTML th scope accessibility",
  "Table Missing Header Cells": "HTML data table header cells accessibility",
  "Complex Table Missing Header Associations": "complex table header association accessibility",
  "Possible Layout Table": "layout table accessibility",
  "Empty List": "HTML list accessibility",
  "Invalid List Content": "HTML ul ol li accessibility",
  "Motion Not Reduced": "prefers reduced motion accessibility",
  "Missing Main Content Region": "main landmark accessibility",
  "Missing Error Message Element": "form error message accessibility",
  "Invalid aria-live Value": "aria-live accessibility",
  "Live Region Should Have aria-atomic": "aria-atomic accessibility",
  "Missing Navigation Landmark": "navigation landmark accessibility",
  "Missing Main Landmark": "main landmark accessibility",
  "Custom Navigation Container Missing Landmark": "custom navigation container landmark accessibility",
  "Custom Main Content Container Missing Landmark": "custom main content landmark accessibility",
  "Non-Semantic Button": "HTML button accessibility",
  "Non-Semantic Link": "HTML link accessibility"
};
const COMMON_ARIA_ATTRIBUTE_MISSPELLINGS = {
  "aria-labeledby": "aria-labelledby",
  "arialabelledby": "aria-labelledby",
  "labelledby": "aria-labelledby",
  "ariadescribedby": "aria-describedby",
  "describedby": "aria-describedby",
  "arialabel": "aria-label",
  "aria-role": "role"
};
const VALID_ARIA_ROLES = new Set([
  "alert", "alertdialog", "application", "article", "banner", "blockquote", "button", "caption", "cell", "checkbox",
  "code", "columnheader", "combobox", "command", "complementary", "composite", "contentinfo", "definition", "deletion",
  "dialog", "directory", "document", "emphasis", "feed", "figure", "form", "generic", "grid", "gridcell", "group",
  "heading", "img", "input", "insertion", "link", "list", "listbox", "listitem", "log", "main", "mark", "marquee",
  "math", "menu", "menubar", "menuitem", "menuitemcheckbox", "menuitemradio", "meter", "navigation", "none", "note",
  "option", "paragraph", "presentation", "progressbar", "radio", "radiogroup", "region", "row", "rowgroup", "rowheader",
  "scrollbar", "search", "searchbox", "separator", "slider", "spinbutton", "status", "strong", "subscript", "superscript",
  "switch", "tab", "table", "tablist", "tabpanel", "term", "textbox", "time", "timer", "toolbar", "tooltip", "tree",
  "treegrid", "treeitem"
]);
const BOOTSTRAP_COLOR_PALETTE = [
  { name: "primary", hex: "#0D6EFD" },
  { name: "secondary", hex: "#6C757D" },
  { name: "success", hex: "#198754" },
  { name: "info", hex: "#0DCAF0" },
  { name: "warning", hex: "#FFC107" },
  { name: "danger", hex: "#DC3545" },
  { name: "light", hex: "#F8F9FA" },
  { name: "dark", hex: "#212529" },
  { name: "blue", hex: "#0D6EFD" },
  { name: "indigo", hex: "#6610F2" },
  { name: "purple", hex: "#6F42C1" },
  { name: "pink", hex: "#D63384" },
  { name: "red", hex: "#DC3545" },
  { name: "orange", hex: "#FD7E14" },
  { name: "yellow", hex: "#FFC107" },
  { name: "green", hex: "#198754" },
  { name: "teal", hex: "#20C997" },
  { name: "cyan", hex: "#0DCAF0" },
  { name: "white", hex: "#FFFFFF" },
  { name: "black", hex: "#000000" }
];
const BOOTSTRAP_BUTTON_PALETTE = [
  { name: "btn-primary", backgroundHex: "#0D6EFD" },
  { name: "btn-secondary", backgroundHex: "#6C757D" },
  { name: "btn-success", backgroundHex: "#198754" },
  { name: "btn-info", backgroundHex: "#0DCAF0" },
  { name: "btn-warning", backgroundHex: "#FFC107" },
  { name: "btn-danger", backgroundHex: "#DC3545" },
  { name: "btn-light", backgroundHex: "#F8F9FA" },
  { name: "btn-dark", backgroundHex: "#212529" }
];
const LEGACY_THEME_COLOR_PALETTE = [
  { name: "dark-lava", hex: "#4B4237" },
  { name: "alabaster", hex: "#EDE7D9" },
  { name: "spanish-gray", hex: "#A49694" },
  { name: "dim-gray", hex: "#736B60" },
  { name: "purple-100", hex: "#E2D9F3" },
  { name: "blue-200", hex: "#9EC5FE" },
  { name: "teal-800", hex: "#0D503C" },
  { name: "alert-success-bg", hex: "#D4EDDA" },
  { name: "alert-success-text", hex: "#0F5132" },
  { name: "alert-info-bg", hex: "#CFF4FC" },
  { name: "alert-info-text", hex: "#055160" }
];
const SML_BUTTON_PALETTE = [
  { name: "btn-blue", backgroundHex: "#0D6EFD" },
  { name: "btn-indigo", backgroundHex: "#6610F2" },
  { name: "btn-purple", backgroundHex: "#6F42C1" },
  { name: "btn-pink", backgroundHex: "#D63384" },
  { name: "btn-red", backgroundHex: "#DC3545" },
  { name: "btn-orange", backgroundHex: "#FD7E14" },
  { name: "btn-yellow", backgroundHex: "#FFC107" },
  { name: "btn-green", backgroundHex: "#198754" },
  { name: "btn-teal", backgroundHex: "#20C997" },
  { name: "btn-cyan", backgroundHex: "#0DCAF0" },
  { name: "btn-Aqua", backgroundHex: "#00FFFF" },
  { name: "btn-CornflowerBlue", backgroundHex: "#6495ED" },
  { name: "btn-Cyan", backgroundHex: "#00FFFF" },
  { name: "btn-DarkBlue", backgroundHex: "#00008B" },
  { name: "btn-DarkCyan", backgroundHex: "#008B8B" },
  { name: "btn-LightCyan", backgroundHex: "#E0FFFF" },
  { name: "btn-LightSteelBlue", backgroundHex: "#B0C4DE" },
  { name: "btn-black", backgroundHex: "#000000" },
  { name: "btn-white", backgroundHex: "#FFFFFF" },
  { name: "btn-dark-lava", backgroundHex: "#4B4237" },
  { name: "btn-goldenrod", backgroundHex: "#D5A021" },
  { name: "btn-alabaster", backgroundHex: "#EDE7D9" },
  { name: "btn-spanish-gray", backgroundHex: "#A49694" },
  { name: "btn-dim-gray", backgroundHex: "#736B60" },
  { name: "btn-purple-100", backgroundHex: "#E2D9F3" },
  { name: "btn-blue-200", backgroundHex: "#9EC5FE" },
  { name: "btn-teal-800", backgroundHex: "#0D503C" }
];

/**
 * Calculate APCA contrast ratio (more accurate than WCAG contrast)
 * Returns a value where 60+ is AA, 90+ is AAA
 */
function calculateAPCAContrast(rgb1, rgb2) {
  const normalize = (c) => {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const r1 = normalize(rgb1.r);
  const g1 = normalize(rgb1.g);
  const b1 = normalize(rgb1.b);

  const r2 = normalize(rgb2.r);
  const g2 = normalize(rgb2.g);
  const b2 = normalize(rgb2.b);

  const l1 = 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
  const l2 = 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2;

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return ((lighter + 0.05) / (darker + 0.05));
}

/**
 * Parse RGB color string
 */
function parseRGB(colorStr) {
  const rgba = parseCssColorToRgba(colorStr);
  return { r: rgba.r, g: rgba.g, b: rgba.b };
}

function parseCssColorToRgba(colorStr) {
  if (!colorStr) return { r: 0, g: 0, b: 0, a: 1 };

  const rgbaMatch = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i.exec(colorStr);
  if (rgbaMatch) {
    return {
      r: Number.parseInt(rgbaMatch[1], 10),
      g: Number.parseInt(rgbaMatch[2], 10),
      b: Number.parseInt(rgbaMatch[3], 10),
      a: rgbaMatch[4] == null ? 1 : Math.max(0, Math.min(1, Number.parseFloat(rgbaMatch[4])))
    };
  }

  const hexMatch = /#([0-9A-Fa-f]{6})/.exec(colorStr);
  if (hexMatch) {
    const hex = hexMatch[1];
    return {
      r: Number.parseInt(hex.substring(0, 2), 16),
      g: Number.parseInt(hex.substring(2, 4), 16),
      b: Number.parseInt(hex.substring(4, 6), 16),
      a: 1
    };
  }

  return { r: 0, g: 0, b: 0, a: 1 };
}

function getRepresentativeBackgroundImageColor(backgroundImage) {
  const safeBackgroundImage = String(backgroundImage || "").trim();
  if (!safeBackgroundImage || safeBackgroundImage === "none") return null;

  const colorTokens = safeBackgroundImage.match(/rgba?\([^)]*\)|#[0-9A-Fa-f]{3,8}/g) || [];
  const colors = colorTokens
    .map((token) => parseCssColorToRgba(token))
    .filter((color) => color.a > 0);

  if (colors.length === 0) return null;

  const midpointColor = colors[Math.floor(colors.length / 2)];
  return {
    r: midpointColor.r,
    g: midpointColor.g,
    b: midpointColor.b,
    a: midpointColor.a
  };
}

function compositeRgbaOver(top, bottom) {
  const outAlpha = top.a + (bottom.a * (1 - top.a));
  if (outAlpha <= 0) return { r: 0, g: 0, b: 0, a: 0 };

  return {
    r: ((top.r * top.a) + (bottom.r * bottom.a * (1 - top.a))) / outAlpha,
    g: ((top.g * top.a) + (bottom.g * bottom.a * (1 - top.a))) / outAlpha,
    b: ((top.b * top.a) + (bottom.b * bottom.a * (1 - top.a))) / outAlpha,
    a: outAlpha
  };
}

/**
 * Get computed background color including parent chain
 */
function getEffectiveBackgroundColor(element) {
  if (!(element instanceof Element)) return { r: 255, g: 255, b: 255 };

  const layers = [];
  let current = element;

  while (current) {
    const styles = window.getComputedStyle(current);
    const bgImageColor = getRepresentativeBackgroundImageColor(styles.backgroundImage);
    if (bgImageColor) {
      layers.push(bgImageColor);
    }

    const bgColor = styles.backgroundColor;
    const parsed = parseCssColorToRgba(bgColor);
    if (parsed.a > 0) {
      layers.push(parsed);
    }
    if (current === document.body) break;
    current = current.parentElement;
  }

  let composed = { r: 255, g: 255, b: 255, a: 1 };
  for (let i = layers.length - 1; i >= 0; i--) {
    composed = compositeRgbaOver(layers[i], composed);
  }

  return { r: composed.r, g: composed.g, b: composed.b };
}

function clampColorChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToHsl(rgb) {
  const r = clampColorChannel(rgb.r) / 255;
  const g = clampColorChannel(rgb.g) / 255;
  const b = clampColorChannel(rgb.b) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs((2 * l) - 1));
    switch (max) {
      case r:
        h = ((g - b) / delta) % 6;
        break;
      case g:
        h = ((b - r) / delta) + 2;
        break;
      default:
        h = ((r - g) / delta) + 4;
        break;
    }
    h = (h * 60 + 360) % 360;
  }

  return { h, s, l };
}

function hslToRgb(hsl) {
  const h = ((hsl.h % 360) + 360) % 360;
  const s = Math.max(0, Math.min(1, hsl.s));
  const l = Math.max(0, Math.min(1, hsl.l));

  if (s === 0) {
    const gray = clampColorChannel(l * 255);
    return { r: gray, g: gray, b: gray };
  }

  const c = (1 - Math.abs((2 * l) - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - (c / 2);

  let rPrime;
  let gPrime;
  let bPrime;
  if (h < 60) {
    [rPrime, gPrime, bPrime] = [c, x, 0];
  } else if (h < 120) {
    [rPrime, gPrime, bPrime] = [x, c, 0];
  } else if (h < 180) {
    [rPrime, gPrime, bPrime] = [0, c, x];
  } else if (h < 240) {
    [rPrime, gPrime, bPrime] = [0, x, c];
  } else if (h < 300) {
    [rPrime, gPrime, bPrime] = [x, 0, c];
  } else {
    [rPrime, gPrime, bPrime] = [c, 0, x];
  }

  return {
    r: clampColorChannel((rPrime + m) * 255),
    g: clampColorChannel((gPrime + m) * 255),
    b: clampColorChannel((bPrime + m) * 255)
  };
}

function moveRgbLightnessToward(startRgb, targetRgb, amount) {
  const hsl = rgbToHsl(startRgb);
  const targetIsLighter = relativeLuminance(targetRgb) > relativeLuminance(startRgb);
  const nextLightness = targetIsLighter
    ? hsl.l + ((1 - hsl.l) * amount)
    : hsl.l * (1 - amount);

  return hslToRgb({ h: hsl.h, s: hsl.s, l: nextLightness });
}

function rgbToHex(rgb) {
  const toHex = (value) => clampColorChannel(value).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

function rgbDistanceSquared(rgbA, rgbB) {
  const dr = rgbA.r - rgbB.r;
  const dg = rgbA.g - rgbB.g;
  const db = rgbA.b - rgbB.b;
  return dr * dr + dg * dg + db * db;
}

function getHueDistanceDegrees(hueA, hueB) {
  const diff = Math.abs(hueA - hueB) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function getButtonRecommendationScore(textRgb, backgroundRgb, candidateTextRgb, candidateBackgroundRgb) {
  const sourceHsl = rgbToHsl(backgroundRgb);
  const candidateHsl = rgbToHsl(candidateBackgroundRgb);
  const sourceIsChromatic = sourceHsl.s >= 0.14;
  const candidateIsChromatic = candidateHsl.s >= 0.14;
  const bothChromatic = sourceIsChromatic && candidateIsChromatic;
  const hueDistance = bothChromatic ? getHueDistanceDegrees(sourceHsl.h, candidateHsl.h) / 180 : 0;
  const saturationDistance = Math.abs(sourceHsl.s - candidateHsl.s);
  const lightnessDistance = Math.abs(sourceHsl.l - candidateHsl.l);
  const backgroundDistance = rgbDistanceSquared(backgroundRgb, candidateBackgroundRgb);
  const textDistance = rgbDistanceSquared(textRgb, candidateTextRgb);
  const neutralPenalty = sourceIsChromatic && !candidateIsChromatic ? 140000 : 0;

  return neutralPenalty
    + (hueDistance * 200000)
    + (saturationDistance * 50000)
    + (lightnessDistance * 35000)
    + backgroundDistance
    + (textDistance * 0.35);
}

function interpolateRgbTowardTarget(startRgb, targetRgb, amount) {
  return {
    r: clampColorChannel(startRgb.r + ((targetRgb.r - startRgb.r) * amount)),
    g: clampColorChannel(startRgb.g + ((targetRgb.g - startRgb.g) * amount)),
    b: clampColorChannel(startRgb.b + ((targetRgb.b - startRgb.b) * amount))
  };
}

function relativeLuminance(rgb) {
  const normalize = (c) => {
    const channel = clampColorChannel(c) / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  };

  const r = normalize(rgb.r);
  const g = normalize(rgb.g);
  const b = normalize(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastTargets(textRgb, backgroundRgb) {
  const black = { r: 0, g: 0, b: 0 };
  const white = { r: 255, g: 255, b: 255 };
  const textLuminance = relativeLuminance(textRgb);
  const backgroundLuminance = relativeLuminance(backgroundRgb);

  if (textLuminance <= backgroundLuminance) {
    return { textTarget: black, backgroundTarget: white };
  }

  return { textTarget: white, backgroundTarget: black };
}

function findClosestContrastColor(startRgb, fixedRgb, required, isForegroundSuggestion, targetRgb) {

  const getContrast = (candidate) => isForegroundSuggestion
    ? calculateAPCAContrast(candidate, fixedRgb)
    : calculateAPCAContrast(fixedRgb, candidate);

  let low = 0;
  let high = 1;
  let best = null;

  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    const candidate = moveRgbLightnessToward(startRgb, targetRgb, mid);
    const contrast = getContrast(candidate);

    if (contrast >= required) {
      best = { rgb: candidate, contrast };
      high = mid;
    } else {
      low = mid;
    }
  }

  if (!best) {
    const endpoint = moveRgbLightnessToward(startRgb, targetRgb, 1);
    return { hex: rgbToHex(endpoint), contrast: getContrast(endpoint) };
  }

  return { hex: rgbToHex(best.rgb), contrast: best.contrast };
}

function getLegacyBalancedContrastSuggestion(textRgb, backgroundRgb, required) {
  const targets = getContrastTargets(textRgb, backgroundRgb);
  const textPinned = rgbDistanceSquared(textRgb, targets.textTarget) === 0;
  const backgroundPinned = rgbDistanceSquared(backgroundRgb, targets.backgroundTarget) === 0;

  let low = 0;
  let high = 1;
  let best = null;

  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    const candidateText = moveRgbLightnessToward(textRgb, targets.textTarget, mid);
    const candidateBackground = moveRgbLightnessToward(backgroundRgb, targets.backgroundTarget, mid);
    const contrast = calculateAPCAContrast(candidateText, candidateBackground);

    if (contrast >= required) {
      best = { text: candidateText, background: candidateBackground, contrast };
      high = mid;
    } else {
      low = mid;
    }
  }

  if (!best) {
    const finalText = moveRgbLightnessToward(textRgb, targets.textTarget, 1);
    const finalBackground = moveRgbLightnessToward(backgroundRgb, targets.backgroundTarget, 1);
    best = {
      text: finalText,
      background: finalBackground,
      contrast: calculateAPCAContrast(finalText, finalBackground)
    };
  }

  let note = "";
  if (textPinned && !backgroundPinned) {
    note = `Foreground is already at ${rgbToHex(textRgb)}; increase background contrast further.`;
  } else if (backgroundPinned && !textPinned) {
    note = `Background is already at ${rgbToHex(backgroundRgb)}; increase foreground contrast further.`;
  } else if (backgroundPinned && textPinned) {
    note = "Foreground and background are already at boundary colors; adjust typography (size/weight) or redesign the palette.";
  }

  return {
    foregroundHex: rgbToHex(best.text),
    backgroundHex: rgbToHex(best.background),
    contrast: best.contrast,
    note
  };
}

function getPairContrast(pair) {
  return calculateAPCAContrast(pair.text, pair.background);
}

function buildBalancedBoundaryPair(textRgb, backgroundRgb, targets, textAmount, backgroundAmount = textAmount) {
  return {
    text: interpolateRgbTowardTarget(textRgb, targets.textTarget, textAmount),
    background: interpolateRgbTowardTarget(backgroundRgb, targets.backgroundTarget, backgroundAmount)
  };
}

function findFirstContrastPair(required, low, high, buildCandidate, note = "") {
  let best = null;

  for (let i = 0; i < 24; i++) {
    const scale = (low + high) / 2;
    const candidate = buildCandidate(scale);
    const contrast = getPairContrast(candidate);

    if (contrast >= required) {
      best = { ...candidate, contrast, note };
      high = scale;
    } else {
      low = scale;
    }
  }

  return best;
}

function getPinnedMidpointNote(textPinnedFirst, pinnedCandidate) {
  return textPinnedFirst
    ? `Foreground reaches ${rgbToHex(pinnedCandidate.text)} first, so the background keeps moving on its own.`
    : `Background reaches ${rgbToHex(pinnedCandidate.background)} first, so the foreground keeps moving on its own.`;
}

function buildPinnedBalancedCandidate(textPinnedFirst, pinnedCandidate, textRgb, backgroundRgb, targets, movableAmount) {
  return textPinnedFirst
    ? {
        text: pinnedCandidate.text,
        background: interpolateRgbTowardTarget(backgroundRgb, targets.backgroundTarget, movableAmount)
      }
    : {
        text: interpolateRgbTowardTarget(textRgb, targets.textTarget, movableAmount),
        background: pinnedCandidate.background
      };
}

function getPinnedBalancedSuggestion(context) {
  const {
    textRgb,
    backgroundRgb,
    targets,
    textPinned,
    backgroundPinned,
    required,
    pinnedCandidate
  } = context;
  const textPinnedFirst = textPinned && !backgroundPinned;

  if (textPinned === backgroundPinned) {
    return {
      ...pinnedCandidate,
      contrast: getPairContrast(pinnedCandidate),
      note: "Both colors are already at their available boundary for this balanced path; use the one-sided suggestions or redesign the palette."
    };
  }

  const note = getPinnedMidpointNote(textPinnedFirst, pinnedCandidate);
  const buildCandidate = (movableAmount) => buildPinnedBalancedCandidate(
    textPinnedFirst,
    pinnedCandidate,
    textRgb,
    backgroundRgb,
    targets,
    movableAmount
  );
  const best = findFirstContrastPair(required, 0, 1, buildCandidate, note);

  if (best) {
    return best;
  }

  const endpointCandidate = buildCandidate(1);
  const endpointContrast = getPairContrast(endpointCandidate);

  if (endpointContrast >= required) {
    return {
      ...endpointCandidate,
      contrast: endpointContrast,
      note
    };
  }

  return {
    ...endpointCandidate,
    contrast: endpointContrast,
    note: "Balanced RGB-preserving separation maxes out before the target ratio, so consider the one-sided suggestions if you need more contrast."
  };
}

function getBalancedContrastSuggestion(textRgb, backgroundRgb, required) {
  const targets = getContrastTargets(textRgb, backgroundRgb);
  const textPinned = rgbDistanceSquared(textRgb, targets.textTarget) === 0;
  const backgroundPinned = rgbDistanceSquared(backgroundRgb, targets.backgroundTarget) === 0;
  const buildPair = (textAmount, backgroundAmount = textAmount) => buildBalancedBoundaryPair(
    textRgb,
    backgroundRgb,
    targets,
    textAmount,
    backgroundAmount
  );

  let best = findFirstContrastPair(required, 0, 1, (amount) => buildPair(amount));

  if (!best) {
    const sharedCandidate = buildPair(1);
    const sharedContrast = getPairContrast(sharedCandidate);

    if (sharedContrast >= required) {
      best = { ...sharedCandidate, contrast: sharedContrast, note: "" };
    } else {
      best = getPinnedBalancedSuggestion({
        textRgb,
        backgroundRgb,
        targets,
        textPinned,
        backgroundPinned,
        required,
        pinnedCandidate: sharedCandidate
      });
    }
  }

  if (best.contrast < required) {
    const fallback = getLegacyBalancedContrastSuggestion(textRgb, backgroundRgb, required);
    return {
      ...fallback,
      note: [best.note, fallback.note, "Balanced RGB-preserving separation could not reach the target, so this falls back to the boundary-based balanced suggestion."].filter(Boolean).join(" ")
    };
  }

  return {
    foregroundHex: rgbToHex(best.text),
    backgroundHex: rgbToHex(best.background),
    contrast: best.contrast,
    note: best.note
  };
}

function getContrastSuggestions(textRgb, backgroundRgb, required) {
  const targets = getContrastTargets(textRgb, backgroundRgb);
  return {
    foreground: findClosestContrastColor(textRgb, backgroundRgb, required, true, targets.textTarget),
    background: findClosestContrastColor(backgroundRgb, textRgb, required, false, targets.backgroundTarget),
    balanced: getBalancedContrastSuggestion(textRgb, backgroundRgb, required),
    textTargetHex: rgbToHex(targets.textTarget),
    backgroundTargetHex: rgbToHex(targets.backgroundTarget)
  };
}

function hasDirectReadableText(element) {
  if (!(element instanceof Element)) return false;

  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && (node.textContent || "").trim().length > 0) {
      return true;
    }
  }

  return false;
}

function getContrastAuditTarget(element) {
  if (!(element instanceof Element)) return null;

  const buttonHost = element.closest("button, [role='button']");
  if (buttonHost instanceof Element && (buttonHost.textContent || "").trim().length > 0) {
    return buttonHost;
  }

  return element;
}

function isElementVisibleForContrastAudit(element) {
  if (!(element instanceof Element)) return false;

  if (element.classList.contains("hidden")
    || element.hasAttribute("hidden")
    || String(element.getAttribute("aria-hidden") || "").toLowerCase() === "true") {
    return false;
  }

  const styles = window.getComputedStyle(element);
  if (styles.display === "none" || styles.visibility === "hidden") return false;
  if (Number.parseFloat(styles.opacity || "1") === 0) return false;

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isHeadingVisibleForAudit(element) {
  if (!(element instanceof Element)) return false;

  // Dialog/modal headings are contextual and should not be counted as page-level headings.
  if (element.closest("[role='dialog'], [aria-modal='true'], .modal, .modal-dialog, .modal-content")) {
    return false;
  }

  // Ignore hidden modal trees and hidden ancestors to avoid false positives.
  const hiddenAncestor = element.closest("[hidden], .hidden, template, [aria-hidden='true'], .modal[aria-hidden='true'], .modal:not(.show)");
  if (hiddenAncestor) return false;

  return isElementVisibleForContrastAudit(element);
}

function describeElementForContrast(element) {
  if (!(element instanceof Element)) return "element";

  const tag = element.tagName.toLowerCase();
  const idPart = element.id ? `#${element.id}` : "";
  const classes = Array.from(element.classList || []).slice(0, 2).join(".");
  const classPart = classes ? `.${classes}` : "";
  return `<code>${tag}${idPart}${classPart}</code>`;
}

function escapeAttribute(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function ensureAuditTargetId(element) {
  if (!(element instanceof Element)) return "";

  if (element.id) return element.id;

  const randomBytes = new Uint32Array(1);
  window.crypto.getRandomValues(randomBytes);
  const generatedId = `smlc-audit-target-${Date.now()}-${randomBytes[0].toString(36)}`;
  element.id = generatedId;
  return generatedId;
}

function toggleColorSourceHighlight(targetId, shouldHighlight) {
  if (!targetId) return;

  const target = document.getElementById(targetId);
  if (!(target instanceof Element)) return;

  target.classList.toggle("sml-compliance-color-source-highlight", Boolean(shouldHighlight));
}

async function copyTextToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "readonly");
  textArea.style.position = "fixed";
  textArea.style.top = "-9999px";
  textArea.style.left = "-9999px";
  markSmlcElementTree(textArea);
  document.body.appendChild(textArea);
  textArea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    textArea.remove();
  }

  return copied;
}

function setCopiedColorFeedback(valueEl, hex, copied) {
  if (!(valueEl instanceof HTMLElement)) return;

  const message = copied ? `Copied ${hex} to clipboard` : `Unable to copy ${hex}`;
  valueEl.dataset.smlcCopied = copied ? "true" : "false";
  valueEl.setAttribute("title", message);
  valueEl.setAttribute("aria-label", message);
  window.setTimeout(() => {
    if (!valueEl.isConnected) return;
    valueEl.dataset.smlcCopied = "";
    const resetTitle = `Click to copy ${hex}`;
    valueEl.setAttribute("title", resetTitle);
    valueEl.setAttribute("aria-label", resetTitle);
  }, 1400);
}

function resolveDisplayedColorHex(valueEl) {
  if (!(valueEl instanceof HTMLElement)) return "";

  const visibleHex = String(valueEl.querySelector("code")?.textContent || "").trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(visibleHex)) {
    valueEl.dataset.smlcColorHex = visibleHex;
    return visibleHex;
  }

  const storedHex = String(valueEl.dataset.smlcColorHex || "").trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(storedHex) ? storedHex : "";
}

function queueCopyColorValue(valueEl) {
  if (!(valueEl instanceof HTMLElement)) return;

  const hex = resolveDisplayedColorHex(valueEl);
  if (!hex) return;

  void copyTextToClipboard(hex)
    .then((copied) => setCopiedColorFeedback(valueEl, hex, copied))
    .catch(() => setCopiedColorFeedback(valueEl, hex, false));
}

function wireColorSourceHoverHandlers(alertContainer) {
  if (!(alertContainer instanceof Element)) return;

  const swatchValues = Array.from(alertContainer.querySelectorAll(".sml-compliance-color-value[data-smlc-color-hex]"));
  for (const valueEl of swatchValues) {
    if (!(valueEl instanceof HTMLElement)) continue;

    const targetId = valueEl.dataset.smlcColorTarget || "";
    if (targetId) {
      valueEl.addEventListener("mouseenter", () => toggleColorSourceHighlight(targetId, true));
      valueEl.addEventListener("mouseleave", () => toggleColorSourceHighlight(targetId, false));
      valueEl.addEventListener("focus", () => toggleColorSourceHighlight(targetId, true));
      valueEl.addEventListener("blur", () => toggleColorSourceHighlight(targetId, false));
    }

    valueEl.addEventListener("click", (event) => {
      stopComplianceControlEvent(event);
      queueCopyColorValue(valueEl);
    });
    valueEl.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      stopComplianceControlEvent(event);
      queueCopyColorValue(valueEl);
    });
  }
}

function wireButtonPreviewHandlers(alertContainer) {
  if (!(alertContainer instanceof Element)) return;

  const previewButtons = Array.from(alertContainer.querySelectorAll(".sml-compliance-button-preview"));
  for (const previewEl of previewButtons) {
    if (!(previewEl instanceof HTMLElement)) continue;

    ["pointerdown", "mousedown", "mouseup", "click", "keydown", "keyup"].forEach((eventName) => {
      previewEl.addEventListener(eventName, (event) => {
        if (eventName === "keydown") {
          const keyEvent = /** @type {KeyboardEvent} */ (event);
          if (keyEvent.key !== "Enter" && keyEvent.key !== " ") return;
        }
        stopComplianceControlEvent(event);
      });
    });
  }
}

function formatHexWithSwatch(hex, sampledTargetId = "") {
  const safeHex = /^#[0-9A-F]{6}$/i.test(String(hex || "")) ? String(hex).toUpperCase() : "#000000";
  const targetAttr = sampledTargetId ? ` data-smlc-color-target="${escapeAttribute(sampledTargetId)}"` : "";
  const label = `Click to copy ${safeHex}`;
  const interactive = arguments.length < 3 ? true : Boolean(arguments[2]);
  const interactiveAttrs = interactive
    ? ` data-smlc-color-hex="${escapeAttribute(safeHex)}"${targetAttr} tabindex="0" role="button" title="${escapeAttribute(label)}" aria-label="${escapeAttribute(label)}"`
    : `${targetAttr} aria-label="Color ${escapeAttribute(safeHex)}"`;
  const staticClass = interactive ? "" : " sml-compliance-color-value-static";
  return `<span class="sml-compliance-color-value${staticClass}"${interactiveAttrs}><code>${safeHex}</code><span class="sml-compliance-color-swatch" aria-hidden="true" style="background-color:${safeHex};"></span></span>`;
}

function formatNamedColorChoice(choice, sampledTargetId = "", formatHex = formatHexWithSwatch) {
  if (!choice) {
    return "No compliant palette pair found";
  }

  return `<code>${escapeHtml(choice.name)}</code> ${formatHex(choice.hex, sampledTargetId)}`;
}

function formatNamedButtonChoice(choice) {
  if (!choice) {
    return "No compliant sml.css button found";
  }

  return `<code>${escapeHtml(choice.name)}</code>`;
}

function formatButtonChoice(choice) {
  if (!choice) {
    return "No compliant button found";
  }

  const preview = `<button type="button" class="btn btn-sm ${escapeAttribute(choice.name)} sml-compliance-button-preview" title="Example ${escapeAttribute(choice.name)}" aria-label="Example ${escapeAttribute(choice.name)} button">${escapeHtml(choice.name)}</button>`;
  return `<span class="sml-compliance-button-choice"><code>${escapeHtml(choice.name)}</code>${preview}<span class="sml-compliance-button-contrast">${choice.contrast.toFixed(1)}:1</span></span>`;
}

function formatButtonChoiceList(choices) {
  if (!Array.isArray(choices) || choices.length === 0) {
    return "No compliant button replacements found";
  }

  return choices.map((choice, index) => `${index + 1}. ${formatButtonChoice(choice)}`).join("<br>");
}

function getPolarOppositeRgb(rgb) {
  return {
    r: 255 - clampColorChannel(rgb.r),
    g: 255 - clampColorChannel(rgb.g),
    b: 255 - clampColorChannel(rgb.b)
  };
}

function getSmlButtonStateBackgrounds(backgroundRgb) {
  return {
    default: backgroundRgb,
    hover: backgroundRgb,
    active: backgroundRgb
  };
}

function buildSmlButtonContrastStates(textRgb, backgroundRgb) {
  const backgrounds = getSmlButtonStateBackgrounds(backgroundRgb);
  return {
    default: calculateAPCAContrast(textRgb, backgrounds.default),
    hover: calculateAPCAContrast(textRgb, backgrounds.hover),
    active: calculateAPCAContrast(textRgb, backgrounds.active)
  };
}

function getSimpleButtonForegroundSuggestion(backgroundRgb, required) {
  const candidates = [
    { textRgb: { r: 255, g: 255, b: 255 }, source: "white" },
    { textRgb: { r: 0, g: 0, b: 0 }, source: "black" }
  ];

  let best = null;
  for (const candidate of candidates) {
    const states = buildSmlButtonContrastStates(candidate.textRgb, backgroundRgb);
    const minContrast = Math.min(states.default, states.hover, states.active);
    if (minContrast < required) continue;

    if (!best || minContrast > best.minContrast) {
      best = {
        textRgb: candidate.textRgb,
        states,
        minContrast,
        source: candidate.source,
        pushedForeground: false
      };
    }
  }

  return best;
}

function getButtonOppositeForegroundSuggestion(backgroundRgb, required) {
  const simpleSuggestion = getSimpleButtonForegroundSuggestion(backgroundRgb, required);
  if (simpleSuggestion) {
    return simpleSuggestion;
  }

  const oppositeRgb = getPolarOppositeRgb(backgroundRgb);
  const initialStates = buildSmlButtonContrastStates(oppositeRgb, backgroundRgb);
  const initialMinContrast = Math.min(initialStates.default, initialStates.hover, initialStates.active);

  if (initialMinContrast >= required) {
    return {
      textRgb: oppositeRgb,
      states: initialStates,
      minContrast: initialMinContrast,
      source: "opposite",
      pushedForeground: false
    };
  }

  const textTarget = getContrastTargets(oppositeRgb, backgroundRgb).textTarget;
  const pushedForeground = findClosestContrastColor(oppositeRgb, backgroundRgb, required, true, textTarget);
  const pushedTextRgb = parseRGB(pushedForeground.hex);
  const pushedStates = buildSmlButtonContrastStates(pushedTextRgb, backgroundRgb);
  const pushedMinContrast = Math.min(pushedStates.default, pushedStates.hover, pushedStates.active);

  return {
    textRgb: pushedTextRgb,
    states: pushedStates,
    minContrast: pushedMinContrast,
    source: "opposite-pushed",
    pushedForeground: rgbDistanceSquared(oppositeRgb, pushedTextRgb) !== 0
  };
}

function formatButtonStateContrastSummary(choice) {
  if (!choice?.stateContrasts) {
    return "";
  }

  return `default ${choice.stateContrasts.default.toFixed(1)}:1 | hover ${choice.stateContrasts.hover.toFixed(1)}:1 | active ${choice.stateContrasts.active.toFixed(1)}:1`;
}

function findClosestButtonStyle(textRgb, backgroundRgb, required, buttonPalette) {
  const matches = findClosestButtonStyles(textRgb, backgroundRgb, required, buttonPalette, 1);
  return matches[0] || null;
}

function findClosestButtonStyles(textRgb, backgroundRgb, required, buttonPalette, limit = 3) {
  const matches = [];

  for (const buttonStyle of buttonPalette) {
    const buttonBackgroundRgb = parseRGB(buttonStyle.backgroundHex);
    const buttonForegroundSuggestion = getButtonOppositeForegroundSuggestion(buttonBackgroundRgb, required);
    if (buttonForegroundSuggestion.minContrast < required) continue;

    const score = getButtonRecommendationScore(
      textRgb,
      backgroundRgb,
      buttonForegroundSuggestion.textRgb,
      buttonBackgroundRgb
    );
    matches.push({
      name: buttonStyle.name,
      foregroundHex: rgbToHex(buttonForegroundSuggestion.textRgb),
      backgroundHex: rgbToHex(buttonBackgroundRgb),
      contrast: buttonForegroundSuggestion.minContrast,
      stateContrasts: buttonForegroundSuggestion.states,
      source: buttonForegroundSuggestion.source,
      pushedForeground: buttonForegroundSuggestion.pushedForeground,
      score
    });
  }

  return matches
    .sort((a, b) => a.score - b.score)
    .slice(0, Math.max(1, limit));
}

function findBestPaletteReplacement(textRgb, backgroundRgb, required, paletteEntries) {
  const textIsDarker = relativeLuminance(textRgb) <= relativeLuminance(backgroundRgb);
  const palette = paletteEntries.map((entry) => ({
    ...entry,
    rgb: parseRGB(entry.hex)
  }));

  const evaluate = (preservePolarity) => {
    let best = null;

    for (const foreground of palette) {
      for (const background of palette) {
        if (foreground.hex === background.hex) continue;

        const foregroundLuminance = relativeLuminance(foreground.rgb);
        const backgroundLuminance = relativeLuminance(background.rgb);
        if (preservePolarity) {
          if (textIsDarker && foregroundLuminance > backgroundLuminance) continue;
          if (!textIsDarker && foregroundLuminance < backgroundLuminance) continue;
        }

        const contrast = calculateAPCAContrast(foreground.rgb, background.rgb);
        if (contrast < required) continue;

        const score = rgbDistanceSquared(textRgb, foreground.rgb) + rgbDistanceSquared(backgroundRgb, background.rgb);
        if (!best || score < best.score) {
          best = { foreground, background, contrast, score };
        }
      }
    }

    return best;
  };

  return evaluate(true) || evaluate(false);
}

/**
 * Create compliance alert element
 */
function ensureInlineAlertStyles() {
  ensureBootstrapIconsStyles();

  if (document.getElementById(INLINE_ALERT_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = INLINE_ALERT_STYLE_ID;
  style.textContent = [
    ".sml-compliance-alert{display:flex;align-items:flex-start;gap:0.5rem;margin:0.5rem 0;position:relative;z-index:2147483643;isolation:isolate;}",
    ".sml-compliance-alert-toggle{display:inline-flex;align-items:center;justify-content:center;gap:0.35rem;min-width:2.25rem;height:2.25rem;padding:0.25rem 0.45rem;cursor:pointer;flex:0 0 auto;}",
    ".sml-compliance-alert-toggle[aria-expanded='true']{filter:brightness(0.92);}",
    ".sml-compliance-alert-toggle .bi{font-size:1rem;line-height:1;}",
    ".sml-compliance-alert-count{display:inline-block;min-width:1.1rem;padding:0 0.25rem;border-radius:999px;background:rgba(255,255,255,0.2);font-size:0.75rem;font-weight:700;line-height:1.2;text-align:center;}",
    ".sml-compliance-alert-panes{flex:1 1 auto;min-width:0;text-align:left;position:relative;z-index:2147483643;}",
    ".sml-compliance-alert-panes-floating{position:fixed !important;top:0;left:0;min-width:50px;width:min(32rem,calc(100vw - 1.5rem));max-width:calc(100vw - 1.5rem);max-height:min(70vh,40rem);overflow:auto;padding-right:0.15rem;z-index:2147483646;}",
    ".sml-compliance-alert-panes[hidden]{display:none !important;}",
    ".sml-compliance-alert-pane{margin:0 0 0.45rem 0;min-width:50px;text-align:left;justify-content:flex-start;align-items:flex-start;position:relative;z-index:2147483643;padding-right:2.75rem;}",
    ".sml-compliance-alert-pane:last-child{margin-bottom:0;}",
    ".sml-compliance-alert-pane[hidden]{display:none !important;}",
    ".sml-compliance-alert-pane{background-repeat:no-repeat;background-position:center;background-size:cover;background-color:transparent !important;backdrop-filter:blur(1px);}",
    ".sml-compliance-pane-close{position:absolute;top:0.55rem;right:0.55rem;display:inline-flex;align-items:center;justify-content:center;width:1.45rem;height:1.45rem;padding:0;border-radius:999px;border:1px solid currentColor;background:rgba(255,255,255,0.12);color:inherit;font-size:1rem;font-weight:700;line-height:1;cursor:pointer;opacity:0.92;}",
    ".sml-compliance-pane-close:hover,.sml-compliance-pane-close:focus{opacity:1;transform:scale(1.04);}",
    ".sml-compliance-pane-close:focus-visible{outline:2px solid #ffffff;outline-offset:2px;}",
    ".sml-compliance-alert-pane.text-dark .sml-compliance-pane-close{background:rgba(15,23,42,0.08);}",
    ".sml-compliance-alert-pane.text-white .sml-compliance-pane-close{background:rgba(255,255,255,0.16);}",
    `.sml-compliance-alert-pane.bg-danger{background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),url('${SMOKE_IMAGE_URL}') center/cover no-repeat !important;}`,
    `.sml-compliance-alert-pane.bg-warning{background:linear-gradient(rgba(0,0,0,0.58),rgba(0,0,0,0.58)),url('${SMOKE_IMAGE_URL}') center/cover no-repeat !important;}`,
    `.sml-compliance-alert-pane.bg-info{background:linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6)),url('${SMOKE_IMAGE_URL}') center/cover no-repeat !important;}`,
    `.sml-compliance-alert-pane.bg-success{background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),url('${SMOKE_IMAGE_URL}') center/cover no-repeat !important;}`,
    ".sml-compliance-alert-pane code{display:inline-block;max-width:100%;padding:0.08rem 0.35rem;border-radius:0.3rem;font-weight:700;white-space:normal;overflow-wrap:anywhere;word-break:break-word;vertical-align:top;}",
    ".sml-compliance-alert-pane.text-white code{color:#ffffff;background:#7e22ce;border:1px solid #c084fc;}",
    ".sml-compliance-alert-pane.text-dark code{color:#3b0764;background:#f3e8ff;border:1px solid #a855f7;}",
    ".sml-compliance-alert-pane.text-white .sml-compliance-more-info{color:#e9d5ff;}",
    ".sml-compliance-alert-pane.text-dark .sml-compliance-more-info{color:#6b21a8;}",
    ".sml-compliance-plain{display:block;margin-top:0.35rem;font-size:0.78rem;line-height:1.35;opacity:0.96;}",
    ".sml-compliance-color-value{display:inline-flex;align-items:center;gap:0.1em;cursor:copy;position:relative;z-index:2147483643;}",
    ".sml-compliance-color-value-static{cursor:default;}",
    ".sml-compliance-color-value:focus{outline:2px solid #c084fc;outline-offset:2px;border-radius:0.25rem;}",
    ".sml-compliance-color-value[data-smlc-copied='true'] code{box-shadow:0 0 0 2px rgba(34,197,94,0.7);}",
    ".sml-compliance-color-value[data-smlc-copied='false'] code{box-shadow:0 0 0 2px rgba(239,68,68,0.7);}",
    ".sml-compliance-color-swatch{display:inline-block;width:1.1em;height:1.1em;margin-left:0.4em;vertical-align:-0.1em;border-radius:0.2em;border:1px solid rgba(15,23,42,0.55);box-shadow:inset 0 0 0 1px rgba(255,255,255,0.32);}",
    ".sml-compliance-alert-pane.text-white .sml-compliance-color-swatch{border-color:rgba(255,255,255,0.7);box-shadow:inset 0 0 0 1px rgba(0,0,0,0.32);}",
    ".sml-compliance-button-choice{display:inline-flex;align-items:center;gap:0.35rem;flex-wrap:wrap;margin:0.1rem 0 0.2rem 0;}",
    ".sml-compliance-button-contrast{font-weight:600;white-space:nowrap;}",
    ".sml-compliance-button-preview{margin:0;text-decoration:none;}",
    ".sml-compliance-button-preview:hover,.sml-compliance-button-preview:focus,.sml-compliance-button-preview:active{text-decoration:none;}",
    ".sml-compliance-color-source-highlight{outline:4px solid #a855f7 !important;outline-offset:2px !important;box-shadow:0 0 0 4px rgba(168,85,247,0.25) !important;}",
    ".sml-compliance-more-info{display:inline-block;margin-top:0.5rem;font-weight:600;text-decoration:underline;position:relative;z-index:2147483643;}",
    ".sml-compliance-alert-modal-header{margin-left:auto;max-width:min(48rem,95vw);position:relative;z-index:2147483643;isolation:isolate;}",
    ".sml-compliance-fix-actions{display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-top:0.5rem;}",
    ".sml-compliance-btn,.sml-compliance-alert-toggle,.sml-compliance-fix-btn{display:inline-flex;align-items:center;gap:0.35rem;border:2px solid #7c3aed !important;box-shadow:0 0 1.25rem rgba(196,181,253,0.9),0 0.55rem 1.5rem rgba(76,29,149,0.45) !important;position:relative;z-index:2147483643;}",
    ".sml-compliance-btn.btn-dark,.sml-compliance-fix-btn.btn-dark{color:#ffffff !important;background:#1f2937 !important;border-color:#111827 !important;}",
    ".sml-compliance-btn.btn-secondary,.sml-compliance-fix-btn.btn-secondary{color:#ffffff !important;background:#64748b !important;border-color:#475569 !important;}",
    ".sml-compliance-btn.btn-danger,.sml-compliance-fix-btn.btn-danger{color:#ffffff !important;background:#dc3545 !important;border-color:#b02a37 !important;}",
    ".sml-compliance-btn.btn-warning,.sml-compliance-alert-toggle.btn-warning,.sml-compliance-fix-btn.btn-warning{color:#0f172a !important;background:#facc15 !important;border-color:#eab308 !important;}",
    ".sml-compliance-btn.btn-info,.sml-compliance-alert-toggle.btn-info,.sml-compliance-fix-btn.btn-info{color:#082f49 !important;background:#bae6fd !important;border-color:#38bdf8 !important;}",
    ".sml-compliance-heading-highlight{outline:3px solid goldenrod !important;outline-offset:2px !important;border-radius:0.25rem !important;}",
    ".sml-compliance-fix-modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.7);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:1rem;}",
    ".sml-compliance-fix-modal{position:relative;z-index:1;background:#ffffff;color:#0f172a;max-width:980px;width:min(980px,96vw);max-height:90vh;overflow:auto;border:2px solid #0f172a;border-radius:0.75rem;box-shadow:0 18px 40px rgba(0,0,0,0.35);}",
    ".sml-compliance-fix-modal-head{display:flex;justify-content:space-between;align-items:center;gap:0.5rem;padding:0.75rem 1rem;border-bottom:1px solid #cbd5e1;}",
    ".sml-compliance-fix-modal-body{padding:0.9rem 1rem;}",
    ".sml-compliance-fix-modal pre{background:#0f172a;color:#e2e8f0;padding:0.75rem;border-radius:0.5rem;overflow:auto;}",
    ".sml-compliance-fix-modal code{background:transparent !important;border:none !important;color:inherit !important;padding:0 !important;}",
    ".sml-compliance-fix-modal-foot{display:flex;justify-content:flex-end;gap:0.5rem;padding:0.75rem 1rem;border-top:1px solid #cbd5e1;}"
  ].join("");
  markSmlcElementTree(style);
  document.head.appendChild(style);
}

function getReferencedTextContent(idrefs) {
  return String(idrefs || "")
    .split(/\s+/)
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => String(document.getElementById(id)?.textContent || "").trim())
    .filter((text) => text.length > 0)
    .join(" ")
    .trim();

}

function getReferencedElements(idrefs) {
  return String(idrefs || "")
    .split(/\s+/)
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => document.getElementById(id))
    .filter((element) => element instanceof Element);
}

function getAssociatedLabelText(element) {
  if (!(element instanceof Element)) return "";

  const getTrimmedText = (node) => String(node?.textContent || "").trim();
  const getSiblingLabelText = (control) => {
    const previousSiblingLabel = control.previousElementSibling;
    if (previousSiblingLabel?.tagName === "LABEL") {
      const previousSiblingText = getTrimmedText(previousSiblingLabel);
      if (previousSiblingText) return previousSiblingText;
    }

    const parent = control.parentElement;
    if (!parent) return "";

    const sameContainerLabel = Array.from(parent.children)
      .find((child) => child.tagName === "LABEL");
    const sameContainerText = getTrimmedText(sameContainerLabel);
    if (sameContainerText) return sameContainerText;

    const formGroupLabel = control.closest(".form-group, .form-floating, .input-group")?.querySelector("label");
    return getTrimmedText(formGroupLabel);
  };

  const associatedLabelText = ("labels" in element && element.labels)
    ? Array.from(element.labels)
      .map((label) => getTrimmedText(label))
      .filter(Boolean)
      .join(" ")
      .trim()
    : "";

  const wrappedLabelText = getTrimmedText(element.closest("label"));
  const siblingLabelText = getSiblingLabelText(element);
  const byId = element.id ? document.querySelector(`label[for='${CSS.escape(element.id)}']`) : null;

  return [associatedLabelText, wrappedLabelText, siblingLabelText, getTrimmedText(byId)]
    .find((value) => typeof value === "string" && value.trim().length > 0) || "";
}

function toReadableLabelText(element) {
  if (!(element instanceof Element)) return "Describe this field";
  const candidate = [
    getAssociatedLabelText(element),
    getReferencedTextContent(element.getAttribute("aria-labelledby")),
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.getAttribute("name"),
    element.dataset?.smlProperty,
    element.dataset?.ccProperty,
    element.getAttribute("id")
  ].find((value) => typeof value === "string" && value.trim().length > 0);

  return String(candidate || "Describe this field").trim();
}

function buildInputLabelFixMarkup(element) {
  if (!(element instanceof Element)) {
    return "<label for=\"exampleInput\">Describe this field</label>\n<input id=\"exampleInput\" type=\"text\" aria-label=\"Describe this field\" />";
  }

  const clone = /** @type {HTMLElement} */ (element.cloneNode(true));
  const generatedId = clone.id || `smlcFix${Date.now()}`;
  clone.id = generatedId;

  const labelText = toReadableLabelText(element);
  const labelId = `${generatedId}Label`;
  const hasUsableAriaLabel = String(clone.getAttribute("aria-label") || "").trim().length > 0;
  const hasUsableAriaLabelledBy = String(clone.getAttribute("aria-labelledby") || "").trim().length > 0;

  if (!hasUsableAriaLabel && !hasUsableAriaLabelledBy) {
    clone.setAttribute("aria-labelledby", labelId);
  }

  const cloneType = String(clone.getAttribute("type") || "").toLowerCase();
  if (cloneType === "search" && !clone.hasAttribute("role")) {
    clone.setAttribute("role", "search");
  }

  if (clone.hasAttribute("required") && !clone.hasAttribute("aria-required")) {
    clone.setAttribute("aria-required", "true");
  }

  const labelMarkup = `<label id="${escapeAttribute(labelId)}" for="${escapeAttribute(generatedId)}">${escapeHtml(labelText)}</label>`;
  const controlMarkup = clone.outerHTML;
  return `${labelMarkup}\n${controlMarkup}`;
}

function toReadableFormLabelText(form) {
  if (!(form instanceof HTMLFormElement)) return "Describe this form";

  const getTrimmedText = (node) => String(node?.textContent || "").trim();

  const documentTitle = String(document.title || "").split(" - ")[0].trim();
  const candidate = [
    form.getAttribute("aria-label"),
    getReferencedTextContent(form.getAttribute("aria-labelledby")),
    getTrimmedText(form.querySelector("h1, h2, h3")),
    documentTitle
  ].find((value) => typeof value === "string" && value.trim().length > 0);

  return String(candidate || "Describe this form").trim();
}

function buildFormLabelFixSuggestions(element) {
  const formLabel = toReadableFormLabelText(element);
  return [
    {
      heading: "HTML form example",
      code: `<form aria-label="${escapeAttribute(formLabel)}">\n  ...\n</form>`
    },
    {
      heading: "Razor Html.BeginForm example",
      code: `@using (Html.BeginForm(null, null, FormMethod.Post,\n            new { aria_label = "${escapeAttribute(formLabel)}" }))\n{\n    ...\n}`
    }
  ];
}

function buildChoiceGroupFixSuggestions(element) {
  const inputType = String(element?.getAttribute?.("type") || "radio").toLowerCase() === "checkbox"
    ? "checkbox"
    : "radio";
  const legendText = inputType === "checkbox" ? "Select all that apply" : "Choose one option";
  const optionOne = inputType === "checkbox"
    ? `<label><input type="checkbox" name="contactMethod" value="email" /> Email</label>`
    : `<label><input type="radio" name="contactMethod" value="email" /> Email</label>`;
  const optionTwo = inputType === "checkbox"
    ? `<label><input type="checkbox" name="contactMethod" value="phone" /> Phone</label>`
    : `<label><input type="radio" name="contactMethod" value="phone" /> Phone</label>`;

  return [
    {
      heading: "Wrap the related choices in a fieldset",
      code: `<fieldset>\n  <legend>${legendText}</legend>\n  ${optionOne}\n  ${optionTwo}\n</fieldset>`
    },
    {
      heading: "Keep the group question in the legend",
      code: `<fieldset>\n  <legend>Preferred contact method</legend>\n  ${optionOne}\n  ${optionTwo}\n</fieldset>`
    }
  ];
}

function collectGroupedChoiceFieldsetIssues() {
  const groupedChoices = Array.from(document.querySelectorAll("input[type='radio'][name], input[type='checkbox'][name]"));
  const rootIds = new WeakMap();
  const groups = new Map();
  let nextRootId = 1;

  const getRootKey = (input) => {
    const root = input.form || input.closest("main, section, article, aside, dialog") || document.body;
    if (!rootIds.has(root)) {
      rootIds.set(root, nextRootId++);
    }
    return String(rootIds.get(root));
  };

  for (const input of groupedChoices) {
    if (!(input instanceof HTMLInputElement)) continue;
    if (isSmlcOwnedElement(input) || isHiddenFromAllUsers(input)) continue;

    const name = String(input.getAttribute("name") || "").trim();
    const type = String(input.getAttribute("type") || "").toLowerCase();
    if (!name || (type !== "radio" && type !== "checkbox")) continue;

    const key = `${getRootKey(input)}::${type}::${name}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(input);
  }

  return Array.from(groups.values())
    .filter((inputs) => inputs.length >= 2)
    .map((inputs) => {
      const fieldset = inputs[0].closest("fieldset");
      const allShareSameFieldset = fieldset instanceof HTMLFieldSetElement && inputs.every((input) => input.closest("fieldset") === fieldset);
      const legend = allShareSameFieldset ? fieldset.querySelector("legend") : null;
      const hasLegend = String(legend?.textContent || "").trim().length > 0;
      return {
        inputs,
        fieldset,
        hasLegend
      };
    })
    .filter((group) => !(group.fieldset instanceof HTMLFieldSetElement && group.hasLegend));
}

function getReadablePageTitle() {
  const documentTitle = String(document.title || "").split(" - ")[0].trim();
  return documentTitle || "Page title";
}

function buildHeadingFixSuggestions(title) {
  const pageTitle = escapeAttribute(getReadablePageTitle());

  if (title === "No Headings Found") {
    return [
      {
        heading: "Native heading example",
        code: `<main id="pageContentWrapper">\n  <h1>${pageTitle}</h1>\n  ...\n</main>`
      },
      {
        heading: "ARIA heading example",
        code: `<main id="pageContentWrapper">\n  <div role="heading" aria-level="1">${pageTitle}</div>\n  ...\n</main>`
      }
    ];
  }

  return [
    {
      heading: "Add a single level 1 heading",
      code: `<h1>${pageTitle}</h1>`
    },
    {
      heading: "ARIA level 1 heading alternative",
      code: `<div role="heading" aria-level="1">${pageTitle}</div>`
    }
  ];
}

function buildDocumentMetadataFixSuggestions(title) {
  const normalizedTitle = String(title || "").trim();
  const pageTitle = escapeHtml(getReadablePageTitle() || "Descriptive page title");
  const documentLang = escapeAttribute((document.documentElement.getAttribute("lang") || "en").trim() || "en");

  if (["Missing Page Title", "Vague Page Title"].includes(normalizedTitle)) {
    return [
      {
        heading: "Use a descriptive page title",
        code: `<head>\n  <title>${pageTitle}</title>\n</head>`
      },
      {
        heading: "Keep the unique page topic in the title",
        code: `<title>${pageTitle} | Small-Mighty-Light</title>`
      }
    ];
  }

  if (normalizedTitle === "Missing Viewport Meta Tag") {
    return [
      {
        heading: "Add the standard responsive viewport meta tag",
        code: `<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n</head>`
      }
    ];
  }

  if (normalizedTitle === "Redundant Lang Attribute") {
    return [
      {
        heading: "Keep the language on the html element and remove the duplicate",
        code: `<html lang="${documentLang}">\n  <body>\n    ...\n  </body>\n</html>`
      }
    ];
  }

  return [
    {
      heading: "Declare the page language on the html element",
      code: `<html lang="${documentLang}">\n  ...\n</html>`
    }
  ];
}

function getHeadingLevelFromElement(element) {
  if (!(element instanceof Element)) return 2;

  const nativeMatch = /^H([1-6])$/.exec(element.tagName);
  if (nativeMatch) {
    return Number.parseInt(nativeMatch[1], 10);
  }

  const ariaLevel = Number.parseInt(String(element.getAttribute("aria-level") || "2"), 10);
  return Number.isNaN(ariaLevel) || ariaLevel < 1 ? 2 : ariaLevel;
}

function buildHeadingStructureFixSuggestions(title, element) {
  const normalizedTitle = String(title || "").trim();
  const headingText = escapeHtml(String(element?.textContent || "Section heading").trim() || "Section heading");
  const currentLevel = getHeadingLevelFromElement(element);
  const correctedLevel = Math.min(Math.max(currentLevel - 1, 1), 6);

  if (normalizedTitle === "Heading Level Skip") {
    return [
      {
        heading: "Move to the next heading level instead of skipping",
        code: `<h${correctedLevel}>${headingText}</h${correctedLevel}>`
      },
      {
        heading: "If you must use a custom heading, give it the corrected aria-level",
        code: `<div role="heading" aria-level="${correctedLevel}">${headingText}</div>`
      }
    ];
  }

  if (normalizedTitle === "Empty Heading") {
    return [
      {
        heading: "Put real heading text inside the existing heading",
        code: `<h${currentLevel}>${headingText}</h${currentLevel}>`
      },
      {
        heading: "If the heading is decorative only, remove heading semantics",
        code: `<div>${headingText}</div>`
      }
    ];
  }

  return [
    {
      heading: "Prefer a native heading element",
      code: `<h${Math.min(Math.max(currentLevel, 1), 6)}>${headingText}</h${Math.min(Math.max(currentLevel, 1), 6)}>`
    },
    {
      heading: "If you keep a custom heading, pair the role with aria-level",
      code: `<div role="heading" aria-level="${Math.min(Math.max(currentLevel, 1), 6)}">${headingText}</div>`
    }
  ];
}

function buildHeadingCountFixSuggestions() {
  const levelOneHeadings = getLevelOneHeadingElements();
  const primaryHeading = escapeHtml(String(levelOneHeadings[0]?.textContent || getReadablePageTitle() || "Page title").trim() || "Page title");
  const secondaryHeading = escapeHtml(String(levelOneHeadings[1]?.textContent || "Section heading").trim() || "Section heading");

  return [
    {
      heading: "Keep one page h1 and demote the others",
      code: `<h1>${primaryHeading}</h1>\n<section>\n  <h2>${secondaryHeading}</h2>\n</section>`
    },
    {
      heading: "If the extra heading is only a style hook, remove the heading semantics",
      code: `<h1>${primaryHeading}</h1>\n<div class="section-title">${secondaryHeading}</div>`
    }
  ];
}

function buildMainLandmarkFixSuggestions() {
  return [
    {
      heading: "Use a native main landmark",
      code: `<main id="pageContentWrapper">\n  ...\n</main>`
    },
    {
      heading: "Fallback role main example",
      code: `<div id="pageContentWrapper" role="main">\n  ...\n</div>`
    }
  ];
}

function buildSkipLinkFixSuggestions() {
  return [
    {
      heading: "Skip link plus main target",
      code: `<a href="#pageContentWrapper" class="visually-hidden-focusable">Skip to main content</a>\n<main id="pageContentWrapper">\n  ...\n</main>`
    },
    {
      heading: "Role main fallback with skip target",
      code: `<a href="#pageContentWrapper" class="visually-hidden-focusable">Skip to main content</a>\n<div id="pageContentWrapper" role="main">\n  ...\n</div>`
    }
  ];
}

function buildNavigationLandmarkFixSuggestions() {
  return [
    {
      heading: "Preferred: use a native nav landmark",
      code: `<nav aria-label="Primary">
  <a href="/home">Home</a>
  <a href="/docs">Docs</a>
</nav>`
    },
    {
      heading: "Fallback: use role navigation on the existing container",
      code: `<div role="navigation" aria-label="Primary">
  <a href="/home">Home</a>
  <a href="/docs">Docs</a>
</div>`
    }
  ];
}

function getElementLandmarkHintText(element) {
  if (!(element instanceof Element)) return "";

  return [
    element.getAttribute("id"),
    element.getAttribute("class"),
    element.getAttribute("aria-label"),
    element.dataset.testid
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getCustomNavigationLandmarkCandidate() {
  const candidates = Array.from(document.querySelectorAll("div, section, header, aside"));
  return candidates.find((element) => {
    if (!(element instanceof HTMLElement)) return false;
    if (isSmlcOwnedElement(element) || isHiddenFromAllUsers(element)) return false;
    if (element.closest("nav, [role='navigation']")) return false;

    const hintText = getElementLandmarkHintText(element);
    if (!/\b(nav|navigation|menu|breadcrumb|breadcrumbs|pagination|pager)\b/.test(hintText)) return false;

    const linkCount = element.querySelectorAll("a[href]").length;
    return linkCount >= 2;
  }) || null;
}

function getCustomMainLandmarkCandidate() {
  const candidates = Array.from(document.querySelectorAll("div, section, article"));
  return candidates.find((element) => {
    if (!(element instanceof HTMLElement)) return false;
    if (isSmlcOwnedElement(element) || isHiddenFromAllUsers(element)) return false;
    if (element.closest("main, [role='main']")) return false;

    const hintText = getElementLandmarkHintText(element);
    if (!/\b(main|content|primary|page-content|pagecontent|app-content|appcontent)\b/.test(hintText)) return false;

    const hasHeading = Boolean(element.querySelector("h1, h2, h3, [role='heading']"));
    const contentBlockCount = element.querySelectorAll("p, section, article, table, form, ul, ol").length;
    return hasHeading && contentBlockCount >= 2;
  }) || null;
}

function buildEmbeddedContentFixSuggestions(title, element) {
  const source = escapeAttribute(String(
    element?.getAttribute?.("src")
    || element?.getAttribute?.("data")
    || "/embedded-content"
  ).trim() || "/embedded-content");
  const tagName = String(element?.tagName || "IFRAME").toLowerCase();

  if (title === "Embedded Content Missing Label") {
    return [
      {
        heading: "Add a descriptive title to the embedded content",
        code: `<${tagName} src="${source}" title="Benefits enrollment document"></${tagName}>`
      },
      {
        heading: "If the content is interactive, name the task or destination",
        code: `<${tagName} src="${source}" title="Benefits enrollment form"></${tagName}>`
      }
    ];
  }

  return [
    {
      heading: "Replace the generic title with a specific one",
      code: `<iframe src="${source}" title="Quarterly staffing dashboard"></iframe>`
    },
    {
      heading: "If the frame is interactive, describe what users can do there",
      code: `<iframe src="${source}" title="Training registration form"></iframe>`
    }
  ];
}

function buildImageAltFixSuggestions(title, element) {
  const imageName = String(element?.getAttribute?.("src") || "").split("/").pop() || "meaningful image";
  const readableName = imageName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim() || "meaningful image";

  if (title === "Empty Alt Text") {
    return [
      {
        heading: "Decorative image example",
        code: `<img src="${escapeAttribute(imageName)}" alt="" role="presentation" />`
      },
      {
        heading: "Informative image example",
        code: `<img src="${escapeAttribute(imageName)}" alt="${escapeAttribute(readableName)}" />`
      }
    ];
  }

  return [
    {
      heading: "Informative image example",
      code: `<img src="${escapeAttribute(imageName)}" alt="${escapeAttribute(readableName)}" />`
    },
    {
      heading: "Decorative image example",
      code: `<img src="${escapeAttribute(imageName)}" alt="" role="presentation" />`
    }
  ];
}

function buildImageMeaningFixSuggestions(title, element) {
  const source = escapeAttribute(String(element?.getAttribute?.("src") || "meaningful-image.png").trim() || "meaningful-image.png");
  const currentAlt = String(element?.getAttribute?.("alt") || "").trim();
  const cleanedAlt = escapeAttribute(currentAlt.replace(/\b(image|photo|picture|graphic|icon)\b/gi, "").replace(/\s+/g, " ").trim() || "Meaningful image description");

  if (title === "Presentation Role Conflicts with Alt Text") {
    return [
      {
        heading: "If the image is decorative, keep it hidden from assistive technology",
        code: `<img src="${source}" alt="" role="presentation" />`
      },
      {
        heading: "If the image conveys meaning, remove the presentation role and keep the alt text",
        code: `<img src="${source}" alt="${cleanedAlt}" />`
      }
    ];
  }

  return [
    {
      heading: "Remove redundant words from the alt text",
      code: `<img src="${source}" alt="${cleanedAlt}" />`
    },
    {
      heading: "If the image adds no meaning, mark it decorative instead",
      code: `<img src="${source}" alt="" role="presentation" />`
    }
  ];
}

function buildButtonLabelFixSuggestions(element) {
  const clone = /** @type {HTMLElement | null} */ (element instanceof Element ? element.cloneNode(true) : null);
  const sourceMarkup = clone ? clone.outerHTML : `<button type="button"><i class="bi bi-gear" aria-hidden="true"></i></button>`;
  const labeledMarkup = sourceMarkup.replace(/^<([^\s>]+)/, `<$1 aria-label="Describe button action"`);
  return [
    {
      heading: "Icon-only button example",
      code: labeledMarkup
    },
    {
      heading: "Visible text button example",
      code: `<button type="button">Describe button action</button>`
    }
  ];
}

function buildLinkTextFixSuggestions(title, element) {
  const href = escapeAttribute(String(element?.getAttribute?.("href") || "/target").trim() || "/target");

  if (title === "Link Missing Text") {
    return [
      {
        heading: "Add visible link text",
        code: `<a href="${href}">Open employee profile</a>`
      },
      {
        heading: "Icon-only link with accessible name",
        code: `<a href="${href}" aria-label="Open employee profile"><i class="bi bi-person" aria-hidden="true"></i></a>`
      }
    ];
  }

  if (title === "Vague Link Text") {
    return [
      {
        heading: "Replace vague text with a destination",
        code: `<a href="${href}">View employee leave balance</a>`
      },
      {
        heading: "If short text must stay, add context to the accessible name",
        code: `<a href="${href}" aria-label="View employee leave balance">View details</a>`
      }
    ];
  }

  if (title === "Duplicate Link Text, Different Destination") {
    return [
      {
        heading: "Make each repeated link name say where it goes",
        code: `<a href="${href}">Read the telework policy</a>\n<a href="/benefits/telework-request">Start a telework request</a>`
      },
      {
        heading: "If the short visible text must stay, add unique accessible names",
        code: `<a href="${href}" aria-label="Read the telework policy">Read more</a>\n<a href="/benefits/telework-request" aria-label="Start a telework request">Read more</a>`
      }
    ];
  }

  return [
    {
      heading: "Keep the short visible text but add context",
      code: `<a href="${href}" aria-label="Read more about telework policy updates">Read more</a>`
    },
    {
      heading: "Prefer specific visible text when you can",
      code: `<a href="${href}">Read more about telework policy updates</a>`
    }
  ];
}

function buildInputStateFixSuggestions(title, element) {
  const fieldId = escapeAttribute(String(element?.getAttribute?.("id") || "exampleField").trim() || "exampleField");

  if (title === "Disabled State Not Announced") {
    return [
      {
        heading: "Expose the disabled state programmatically",
        code: `<button type="button" disabled aria-disabled="true">Submit request</button>`
      },
      {
        heading: "Custom disabled control example",
        code: `<div role="button" aria-disabled="true" tabindex="-1">Submit request</div>`
      }
    ];
  }

  if (title === "Required Field Not Indicated") {
    return [
      {
        heading: "Show the required state visually and programmatically",
        code: `<label for="${fieldId}">Work email <span aria-hidden="true">*</span></label>\n<input id="${fieldId}" type="email" required aria-required="true" />`
      },
      {
        heading: "Explain the requirement in the accessible name when needed",
        code: `<label for="${fieldId}">Work email <span aria-hidden="true">*</span></label>\n<input id="${fieldId}" type="email" required aria-required="true" aria-describedby="${fieldId}Hint" />\n<div id="${fieldId}Hint">Required field</div>`
      }
    ];
  }

  return [
    {
      heading: "Add the expected search role",
      code: `<input id="${fieldId}" type="search" role="search" aria-label="Search employees" />`
    },
    {
      heading: "Wrap the search field in a labeled search landmark",
      code: `<form role="search" aria-label="Employee search">\n  <label for="${fieldId}">Search employees</label>\n  <input id="${fieldId}" type="search" />\n</form>`
    }
  ];
}

function buildContextualLinkFixSuggestions(title, element) {
  const href = escapeAttribute(String(element?.getAttribute?.("href") || "/target").trim() || "/target");
  const linkText = escapeHtml(String(element?.textContent || "Open destination").trim() || "Open destination");

  return [
    {
      heading: "Warn users in the visible link text",
      code: `<a href="${href}" target="_blank" rel="noopener noreferrer">${linkText} (opens in new window)</a>`
    },
    {
      heading: "Keep short visible text but add the warning to the accessible name",
      code: `<a href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${linkText} (opens in new window)">${linkText}</a>`
    }
  ];
}

function buildContrastFixSuggestions(element) {
  const sampleText = escapeHtml(getVisibleControlText(element) || String(element?.textContent || "Readable text").trim() || "Readable text");
  const tagName = String(element?.tagName || "SPAN").toLowerCase();

  return [
    {
      heading: "Increase the foreground and background contrast",
      code: `<${tagName} class="accessible-contrast-sample">${sampleText}</${tagName}>\n<style>\n  .accessible-contrast-sample {\n    color: #1f1f1f;\n    background: #ffffff;\n  }\n</style>`
    },
    {
      heading: "If this is a button-like control, use a stronger visual treatment",
      code: `<button type="button" class="btn btn-primary">${sampleText}</button>`
    }
  ];
}

function buildFocusIndicatorFixSuggestions(element) {
  const selector = element?.id
    ? `#${escapeAttribute(element.id)}`
    : ".focusable-control";
  const sampleText = escapeHtml(getVisibleControlText(element) || String(element?.textContent || "Open details").trim() || "Open details");
  const buttonAttributes = element?.id
    ? ` id="${escapeAttribute(element.id)}"`
    : " class=\"focusable-control\"";

  return [
    {
      heading: "Add a visible focus ring with focus-visible",
      code: `<button${buttonAttributes}>${sampleText}</button>\n<style>\n  ${selector}:focus-visible {\n    outline: 3px solid #0b5fff;\n    outline-offset: 2px;\n  }\n</style>`
    }
  ];
}

function buildMediaAlternativeFixSuggestions(title, element) {
  const normalizedTitle = String(title || "").trim();
  const source = escapeAttribute(String(element?.getAttribute?.("src") || "media.mp4").trim() || "media.mp4");

  if (normalizedTitle === "Audio Missing Transcript") {
    return [
      {
        heading: "Pair the audio with a transcript",
        code: `<audio controls src="${source}"></audio>\n<details>\n  <summary>Transcript</summary>\n  <p>Speaker: ...</p>\n</details>`
      }
    ];
  }

  if (normalizedTitle === "Video Missing Captions") {
    return [
      {
        heading: "Add a captions track to the current video",
        code: `<video controls src="${source}">\n  <track kind="captions" srclang="en" src="captions-en.vtt" label="English captions" default />\n</video>`
      }
    ];
  }

  return [
    {
      heading: "Add an audio description track or nearby described alternative",
      code: `<video controls src="${source}">\n  <track kind="descriptions" srclang="en" src="descriptions-en.vtt" label="English audio descriptions" />\n</video>`
    },
    {
      heading: "If a descriptions track is not available, provide a nearby text alternative",
      code: `<div>Detailed video description: Describe the important visual information here.</div>`
    }
  ];
}

function buildListFixSuggestions(title, element) {
  const normalizedTitle = String(title || "").trim();
  const listTag = String(element?.tagName || "UL").toLowerCase() === "ol" ? "ol" : "ul";

  if (normalizedTitle === "Empty List") {
    return [
      {
        heading: "Add real list items or remove the empty list",
        code: `<${listTag}>\n  <li>First item</li>\n  <li>Second item</li>\n</${listTag}>`
      },
      {
        heading: "If this is only for layout, replace it with a non-list container",
        code: `<div>First item</div>\n<div>Second item</div>`
      }
    ];
  }

  return [
    {
      heading: "Wrap each direct list child in an li",
      code: `<${listTag}>\n  <li>First item</li>\n  <li>Second item</li>\n</${listTag}>`
    }
  ];
}

function buildMotionFixSuggestions() {
  return [
    {
      heading: "Respect prefers-reduced-motion in CSS",
      code: `@media (prefers-reduced-motion: reduce) {\n  .animated-content {\n    animation: none !important;\n    transition: none !important;\n    scroll-behavior: auto;\n  }\n}`
    },
    {
      heading: "Stop auto-playing motion when reduced motion is requested",
      code: `const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;\nif (!reduceMotion) {\n  startAnimation();\n}`
    }
  ];
}

function buildLiveRegionFixSuggestions(title, element) {
  const normalizedTitle = String(title || "").trim();
  const role = escapeAttribute(String(element?.getAttribute?.("role") || "status").trim() || "status");

  if (normalizedTitle === "Invalid aria-live Value") {
    return [
      {
        heading: "Use a valid aria-live value",
        code: `<div aria-live="polite">Status message updates</div>`
      },
      {
        heading: "If the update is urgent, use assertive instead",
        code: `<div role="${role}" aria-live="assertive">Urgent status update</div>`
      }
    ];
  }

  return [
    {
      heading: "Mark the whole live region as atomic when multi-part updates should be announced together",
      code: `<div role="${role}" aria-live="polite" aria-atomic="true">\n  <span>Status:</span>\n  <span>Saved successfully</span>\n</div>`
    }
  ];
}

function buildSemanticControlFixSuggestions(title, element) {
  if (title === "Accessible Name Does Not Include Visible Label") {
    const visibleText = escapeHtml(getVisibleControlText(element) || "Visible control text");
    return [
      {
        heading: "Keep one visible label source and match the accessible name",
        code: `<button type="button" aria-label="${visibleText}">\n  <i class="bi bi-play-circle" aria-hidden="true"></i>\n  <span>${visibleText}</span>\n</button>`
      },
      {
        heading: "Add extra context after the visible label when needed",
        code: `<button type="button" aria-label="${visibleText} for current record">${visibleText}</button>`
      }
    ];
  }

  if (title === "Button Role Missing Keyboard Handler" || title === "Button Role Keyboard Handler Not Statically Verifiable") {
    return [
      {
        heading: "Prefer a native button",
        code: `<button type="button" id="openDetailsBtn">Open details</button>\n<script>\n  document.getElementById('openDetailsBtn')?.addEventListener('click', openDetails);\n<\/script>`
      },
      {
        heading: "If you keep role=button, add keyboard activation",
        code: `<div role="button" tabindex="0" id="openDetailsControl">Open details</div>\n<script>\n  const control = document.getElementById('openDetailsControl');\n  control?.addEventListener('click', openDetails);\n  control?.addEventListener('keydown', (event) => {\n    if (event.key === 'Enter' || event.key === ' ') {\n      event.preventDefault();\n      openDetails();\n    }\n  });\n<\/script>`
      },
      {
        heading: "Verify runtime key handlers (including delegated listeners)",
        code: `const el = document.querySelector('[role="button"]');\nconst direct = getEventListeners(el);\nconst keyFns = (direct.keydown || []).map(x => x.listener.toString()).join('\\n');\nconst hasEnter = keyFns.includes('Enter');\nconst hasSpace = keyFns.includes(' ') || keyFns.includes('Spacebar');\n\nfunction listenersUp(node) {\n  const out = [];\n  let cur = node;\n  while (cur) {\n    out.push({ node: cur, listeners: getEventListeners(cur) });\n    cur = cur.parentElement;\n  }\n  out.push({ node: document, listeners: getEventListeners(document) });\n  out.push({ node: window, listeners: getEventListeners(window) });\n  return out;\n}\n\n({ hasEnter, hasSpace, direct, delegatedChain: listenersUp(el) });`
      }
    ];
  }

  if (title === "Button Role Not Focusable") {
    return [
      {
        heading: "Prefer a native button",
        code: `<button type="button" id="openDetailsBtn">Open details</button>\n<script>\n  document.getElementById('openDetailsBtn')?.addEventListener('click', openDetails);\n<\/script>`
      },
      {
        heading: "If you keep role=button, make it keyboard reachable",
        code: `<div role="button" tabindex="0" id="openDetailsControl">Open details</div>\n<script>\n  const control = document.getElementById('openDetailsControl');\n  control?.addEventListener('click', openDetails);\n  control?.addEventListener('keydown', (event) => {\n    if (event.key === 'Enter' || event.key === ' ') {\n      event.preventDefault();\n      openDetails();\n    }\n  });\n<\/script>`
      },
      {
        heading: "Confirm focusability and delegated handling at runtime",
        code: `const el = document.querySelector('[role="button"]');\n({\n  tabIndex: el?.tabIndex,\n  canReceiveFocus: !!el && el.tabIndex >= 0\n});\n\n// If listeners are delegated, inspect ancestors too.\nfunction listenersUp(node) {\n  const out = [];\n  let cur = node;\n  while (cur) {\n    out.push({ node: cur, listeners: getEventListeners(cur) });\n    cur = cur.parentElement;\n  }\n  out.push({ node: document, listeners: getEventListeners(document) });\n  out.push({ node: window, listeners: getEventListeners(window) });\n  return out;\n}\nlistenersUp(el);`
      }
    ];
  }

  if (title === "Non-Standard Click Handler") {
    return [
      {
        heading: "Use a real button for page actions",
        code: `<button type="button" id="openDetailsBtn">Open details</button>\n<script>\n  document.getElementById('openDetailsBtn')?.addEventListener('click', openDetails);\n<\/script>`
      },
      {
        heading: "Use a real link for navigation",
        code: `<a href="/target">Open details</a>`
      }
    ];
  }

  if (title === "Anchor Uses Button Role") {
    return [
      {
        heading: "Use a real link when the control navigates",
        code: `<a href="/target">Open details</a>`
      },
      {
        heading: "Use a real button when the control triggers page behavior",
        code: `<button type="button" id="openDetailsBtn">Open details</button>\n<script>\n  document.getElementById('openDetailsBtn')?.addEventListener('click', openDetails);\n<\/script>`
      }
    ];
  }

  return [
    {
      heading: "Replace the custom control with a native button",
      code: `<button type="button">Perform action</button>`
    },
    {
      heading: "If the control navigates, use a native link instead",
      code: `<a href="/target">Open destination</a>`
    }
  ];
}

function buildBrokenLinkFixSuggestions(title, element) {
  const href = String(element?.getAttribute("href") || "").trim();
  const safeHref = escapeAttribute(href || "/target");

  if (title === "Broken Fragment Link") {
    const fragment = href.startsWith("#") ? href : "#sectionId";
    const safeFragment = escapeAttribute(fragment);
    const targetId = safeFragment.startsWith("#") ? safeFragment.slice(1) : "sectionId";

    return [
      {
        heading: "Point the link to an existing element ID",
        code: `<a href="${safeFragment}">Jump to section</a>\n<section id="${escapeAttribute(targetId)}">Section content</section>`
      },
      {
        heading: "Or update the href to a valid fragment target",
        code: `<a href="#mainContent">Skip to main content</a>\n<main id="mainContent">...</main>`
      }
    ];
  }

  if (title === "Same-Origin Link Redirects") {
    return [
      {
        heading: "Link directly to the final destination when the redirect is intentional",
        code: `<a href="${safeHref}">Open resource</a>`
      },
      {
        heading: "If the redirect is temporary, verify users still reach the expected page",
        code: `<a href="${safeHref}">Open current resource location</a>`
      }
    ];
  }

  if (title === "Same-Origin Link Requires Authentication") {
    return [
      {
        heading: "Tell users they may need to sign in before following the link",
        code: `<a href="${safeHref}">Open employee benefits portal (sign-in required)</a>`
      },
      {
        heading: "If the destination should be public, fix the route or permissions",
        code: `<a href="${safeHref}">Open employee benefits portal</a>`
      }
    ];
  }

  return [
    {
      heading: "Update the href to a route or file that returns successfully",
      code: `<a href="${safeHref}">Open resource</a>`
    },
    {
      heading: "If the destination is no longer available, remove or replace the link",
      code: `<span>Resource currently unavailable</span>`
    }
  ];
}

function getTableStructureSummary(table) {
  if (!(table instanceof HTMLTableElement)) {
    return {
      rowCount: 0,
      maxColumns: 0,
      hasCaption: false,
      hasThead: false,
      hasTbody: false,
      headerCells: [],
      dataRows: []
    };
  }

  const rows = Array.from(table.querySelectorAll("tr"));
  const maxColumns = rows.reduce((max, row) => {
    return Math.max(max, row.querySelectorAll("th, td").length);
  }, 0);

  return {
    rowCount: rows.length,
    maxColumns,
    hasCaption: Boolean(table.querySelector("caption")),
    hasThead: Boolean(table.querySelector("thead")),
    hasTbody: Boolean(table.querySelector("tbody")),
    headerCells: Array.from(table.querySelectorAll("th")),
    dataRows: rows.filter((row) => row.querySelectorAll("td").length > 0)
  };
}

function isLikelyDataTable(table) {
  const summary = getTableStructureSummary(table);
  return summary.hasThead
    || summary.headerCells.length > 0
    || (summary.rowCount >= 2 && summary.maxColumns >= 2);
}

function isPossibleLayoutTable(table) {
  if (!(table instanceof HTMLTableElement)) return false;

  const summary = getTableStructureSummary(table);
  if (summary.hasThead || summary.headerCells.length > 0 || summary.hasCaption) return false;
  if (summary.maxColumns < 2 || summary.rowCount > 2) return false;

  return Boolean(table.querySelector("form, input, select, textarea, button, nav, section, article, aside, .row, .col"));
}

function hasComplexTableStructure(table) {
  if (!(table instanceof HTMLTableElement)) return false;

  if (table.querySelector("th[colspan], th[rowspan], td[colspan], td[rowspan]")) {
    const spanningCell = table.querySelector("th[colspan], th[rowspan], td[colspan], td[rowspan]");
    const colspan = Number.parseInt(spanningCell?.getAttribute("colspan") || "1", 10);
    const rowspan = Number.parseInt(spanningCell?.getAttribute("rowspan") || "1", 10);
    if (colspan > 1 || rowspan > 1) {
      return true;
    }
  }

  const theadRows = table.querySelectorAll("thead tr").length;
  return theadRows > 1;
}

function hasExplicitTableHeaderAssociations(table, headerCells) {
  if (!(table instanceof HTMLTableElement)) return false;

  if (table.querySelector("td[headers]")) return true;
  return headerCells.some((header) => {
    const scope = String(header.getAttribute("scope") || "").trim().toLowerCase();
    return scope === "colgroup" || scope === "rowgroup";
  });
}

function buildTableFixSuggestions(title, element) {
  const table = element instanceof HTMLTableElement ? element : element?.closest?.("table");
  const headerText = String(element?.textContent || "Column heading").trim() || "Column heading";

  if (title === "Table Missing Caption") {
    return [
      {
        heading: "Add a table caption",
        code: `<table>
  <caption class="visually-hidden">Monthly staffing totals</caption>
  <thead>
    <tr>
      <th scope="col">Employee</th>
      <th scope="col">Hours</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Ana</td>
      <td>40</td>
    </tr>
  </tbody>
</table>`
      }
    ];
  }

  if (title === "Table Missing thead") {
    return [
      {
        heading: "Group header rows inside thead",
        code: `<table>
  <caption>Monthly staffing totals</caption>
  <thead>
    <tr>
      <th scope="col">Employee</th>
      <th scope="col">Hours</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Ana</td>
      <td>40</td>
    </tr>
  </tbody>
</table>`
      }
    ];
  }

  if (title === "Table Missing Header Cells") {
    return [
      {
        heading: "Use th cells for row or column labels",
        code: `<table>
  <caption>Quarterly totals</caption>
  <thead>
    <tr>
      <th scope="col">Quarter</th>
      <th scope="col">Total</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Q1</td>
      <td>120</td>
    </tr>
  </tbody>
</table>`
      }
    ];
  }

  if (title === "Table Header Missing Scope") {
    return [
      {
        heading: "Add scope to each header cell",
        code: `<th scope="col">${escapeHtml(headerText)}</th>
<th scope="row">Row label</th>`
      }
    ];
  }

  if (title === "Complex Table Missing Header Associations") {
    return [
      {
        heading: "Use ids on complex headers and point each data cell to them",
        code: `<table>
  <caption>Regional staffing totals</caption>
  <thead>
    <tr>
      <th id="region" rowspan="2" scope="col">Region</th>
      <th id="openFindings" colspan="2" scope="colgroup">Open findings</th>
    </tr>
    <tr>
      <th id="critical" scope="col">Critical</th>
      <th id="warning" scope="col">Warning</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th id="north" scope="row">North</th>
      <td headers="north critical">5</td>
      <td headers="north warning">7</td>
    </tr>
  </tbody>
</table>`
      }
    ];
  }

  if (title === "Possible Layout Table") {
    return [
      {
        heading: "Use layout containers instead of a table",
        code: `<div class="d-flex gap-3 align-items-start">
  <div>
    <label for="searchHelp">Search help</label>
    <input id="searchHelp" type="search" />
  </div>
  <button type="button">Go</button>
</div>`
      }
    ];
  }

  if (title === "Table Missing tbody") {
    return [
      {
        heading: "Group data rows in tbody",
        code: `<table>
  <thead>
    <tr>
      <th scope="col">Column heading</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Value</td>
    </tr>
  </tbody>
</table>`
      }
    ];
  }

  const summary = getTableStructureSummary(table);
  const sampleRows = summary.dataRows.length > 0 ? "Use headers, caption, and grouped body rows." : "Use caption, headers, and body rows.";
  return [
    {
      heading: "Accessible table example",
      code: `<table>
  <caption>Monthly staffing totals</caption>
  <thead>
    <tr>
      <th scope="col">Employee</th>
      <th scope="col">Hours</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Ana</td>
      <td>40</td>
    </tr>
  </tbody>
</table>
<!-- ${sampleRows} -->`
    }
  ];
}

function reportTableCaptionIssue(compliance, table, summary, likelyDataTable) {
  if (likelyDataTable && !summary.hasCaption) {
    compliance.addAlert("warning", "Table Missing Caption",
      `Data table should have a <caption> describing what the table contains.`, table);
  }
}

function reportTableHeaderStructureIssues(compliance, table, summary, likelyDataTable) {
  if (!likelyDataTable) return;

  if (summary.headerCells.length === 0) {
    compliance.addAlert("error", "Table Missing Header Cells",
      `Data table should use <th> cells for row or column headings so relationships are announced correctly.`, table);
    return;
  }

  if (!summary.hasThead) {
    compliance.addAlert("warning", "Table Missing thead",
      `Header rows should be grouped inside <thead> when the table has column headings.`, table);
  }

  if (summary.dataRows.length > 0 && !summary.hasTbody) {
    compliance.addAlert("info", "Table Missing tbody",
      `Data rows should be grouped inside <tbody> for clearer table structure.`, table);
  }
}

function reportTableHeaderScopeIssues(compliance, headerCells) {
  for (const header of headerCells) {
    if (!header.hasAttribute("scope")) {
      compliance.addAlert("warning", "Table Header Missing Scope",
        `<th> should have scope="col" or scope="row" so assistive technology can map the heading correctly.`, header);
    }
  }
}

function reportComplexTableAssociationIssues(compliance, table, summary, likelyDataTable) {
  if (!likelyDataTable || !hasComplexTableStructure(table)) return;
  if (hasExplicitTableHeaderAssociations(table, summary.headerCells)) return;

  compliance.addAlert("warning", "Complex Table Missing Header Associations",
    `This data table has grouped or spanning headers. Add explicit associations with headers/id or group scopes so assistive technology can map each data cell to the right headings.`, table);
}

function reportPossibleLayoutTableIssue(compliance, table, likelyDataTable) {
  if (!likelyDataTable && isPossibleLayoutTable(table)) {
    compliance.addAlert("info", "Possible Layout Table",
      `This table looks like it is being used for visual layout rather than tabular data. Prefer div, flex, or grid layout when there is no real row/column relationship.`, table);
  }
}

function buildAriaMarkupFixSuggestions(title, element) {
  const normalizedTitle = String(title || "");
  const elementId = String(element?.getAttribute?.("id") || "controlId").trim() || "controlId";
  const labelId = `${elementId}Label`;
  const errorId = `${elementId}Error`;
  const misspelling = getMisspelledAriaAttributes(element)[0];

  if (["Invalid aria-labelledby Reference", "Duplicate aria-labelledby Reference", "Duplicate ID Referenced"].includes(normalizedTitle)) {
    return [
      {
        heading: "Use a unique label element and reference it once",
        code: `<span id="${escapeAttribute(labelId)}">Field label</span>\n<input id="${escapeAttribute(elementId)}" aria-labelledby="${escapeAttribute(labelId)}" />`
      }
    ];
  }

  if (["Invalid aria-describedby Reference", "Duplicate aria-describedby Reference", "Invalid Input Not Described", "Missing Error Message Element"].includes(normalizedTitle)) {
    return [
      {
        heading: "Point aria-describedby to a real helper or error element",
        code: `<input id="${escapeAttribute(elementId)}" aria-describedby="${escapeAttribute(errorId)}" aria-invalid="true" />\n<div id="${escapeAttribute(errorId)}">Explain the validation problem here.</div>`
      },
      {
        heading: "Use aria-errormessage for the validation message",
        code: `<input id="${escapeAttribute(elementId)}" aria-invalid="true" aria-errormessage="${escapeAttribute(errorId)}" />\n<div id="${escapeAttribute(errorId)}" role="alert">Explain the validation problem here.</div>`
      }
    ];
  }

  if (normalizedTitle === "Duplicate ID") {
    return [
      {
        heading: "Give each related element a unique id",
        code: `<label for="emailPrimary">Primary email</label>\n<input id="emailPrimary" type="email" />\n\n<label for="emailBackup">Backup email</label>\n<input id="emailBackup" type="email" />`
      }
    ];
  }

  if (normalizedTitle === "ARIA Attribute Misspelled") {
    return [
      {
        heading: "Correct the misspelled attribute name",
        code: misspelling
          ? `<div ${escapeAttribute(misspelling.expected)}="${escapeAttribute(labelId)}"></div>`
          : `<div aria-labelledby="${escapeAttribute(labelId)}"></div>`
      }
    ];
  }

  if (normalizedTitle === "Empty ARIA Label") {
    return [
      {
        heading: "Give the control a real aria-label or remove the empty one",
        code: `<button type="button" aria-label="Open details">Open details</button>`
      },
      {
        heading: "Prefer visible text over an empty aria-label",
        code: `<button type="button">Open details</button>`
      }
    ];
  }

  if (normalizedTitle === "Invalid Role Value") {
    return [
      {
        heading: "Use a valid role value or remove the role",
        code: `<span role="img" aria-label="Meaningful icon"></span>\n<button type="button">Perform action</button>`
      }
    ];
  }

  if (["Heading Role Missing aria-level", "Invalid aria-level Value"].includes(normalizedTitle)) {
    return [
      {
        heading: "Define a valid heading level",
        code: `<div role="heading" aria-level="2">Section heading</div>`
      },
      {
        heading: "Prefer native heading markup when practical",
        code: `<h2>Section heading</h2>`
      }
    ];
  }

  if (normalizedTitle === "Focusable Element Hidden From Screen Readers") {
    return [
      {
        heading: "Do not hide focusable controls from assistive technology",
        code: `<button type="button">Open details</button>`
      },
      {
        heading: "If it should be hidden, remove it from interaction",
        code: `<div aria-hidden="true" hidden>Decorative or inactive content only</div>`
      }
    ];
  }

  return [
    {
      heading: "Correct the accessibility markup",
      code: buildInputLabelFixMarkup(element)
    }
  ];
}

function getDocumentMetadataFixContent(normalizedTitle) {
  if (!["Missing Page Title", "Vague Page Title", "Missing Language Declaration", "Missing Lang Attribute", "Redundant Lang Attribute", "Missing Viewport Meta Tag"].includes(normalizedTitle)) {
    return null;
  }

  return {
    heading: "Suggested Fix: Correct the document metadata",
    description: "These issues are fixed in the page head or root html element so browsers and assistive technology get the right page metadata.",
    snippets: buildDocumentMetadataFixSuggestions(normalizedTitle)
  };
}

function getAriaFixContent(normalizedTitle, element) {
  if (!["Duplicate ID", "Duplicate ID Referenced", "ARIA Attribute Misspelled", "Invalid Role Value", "Heading Role Missing aria-level", "Invalid aria-level Value", "Empty ARIA Label", "Invalid aria-labelledby Reference", "Invalid aria-describedby Reference", "Duplicate aria-labelledby Reference", "Duplicate aria-describedby Reference", "Focusable Element Hidden From Screen Readers", "Invalid Input Not Described", "Missing Error Message Element", "Invalid aria-live Value", "Live Region Should Have aria-atomic"].includes(normalizedTitle)) {
    return null;
  }

  const isLiveRegionFix = ["Invalid aria-live Value", "Live Region Should Have aria-atomic"].includes(normalizedTitle);
  return {
    heading: "Suggested Fix: Correct the ARIA or reference markup",
    description: isLiveRegionFix
      ? "Live regions need valid ARIA state so assistive technology announces updates at the right time and in the right way."
      : "This issue is usually resolved by using valid ARIA attributes, unique IDs, and references that point to real elements exactly once.",
    snippets: isLiveRegionFix
      ? buildLiveRegionFixSuggestions(normalizedTitle, element)
      : buildAriaMarkupFixSuggestions(normalizedTitle, element)
  };
}

function getTableFixContent(normalizedTitle, element) {
  if (!["Table Missing Caption", "Table Missing thead", "Table Missing tbody", "Table Header Missing Scope", "Table Missing Header Cells", "Complex Table Missing Header Associations", "Possible Layout Table"].includes(normalizedTitle)) {
    return null;
  }

  return {
    heading: "Suggested Fix: Correct the table structure",
    description: "Data tables need a caption, real header cells, and clear row grouping. Layout tables should usually be replaced with non-table layout markup.",
    snippets: buildTableFixSuggestions(normalizedTitle, element)
  };
}

function getFormLabelFixContent(normalizedTitle, element) {
  if (normalizedTitle !== "Form Should Be Labeled") return null;
  return {
    heading: "Suggested Fix: Add an accessible form label",
    description: "This form needs an accessible name. You can label the form directly with aria-label, or add the same label through Razor Html.BeginForm.",
    snippets: buildFormLabelFixSuggestions(element)
  };
}

function getPageHeadingFixContent(normalizedTitle) {
  if (["No Headings Found", "Missing Level 1 Heading"].includes(normalizedTitle)) {
    return {
      heading: "Suggested Fix: Add a page heading",
      description: "This page needs a clear heading so screen reader and keyboard users can understand the page structure quickly.",
      snippets: buildHeadingFixSuggestions(normalizedTitle)
    };
  }

  if (normalizedTitle === "Multiple Level 1 Headings") {
    return {
      heading: "Suggested Fix: Keep one level 1 heading",
      description: "A page should usually have one main heading that identifies the page. Other headings should step down to h2 and below.",
      snippets: buildHeadingCountFixSuggestions()
    };
  }

  return null;
}

function getHeadingStructureFixContent(normalizedTitle, element) {
  if (!["Heading Level Skip", "Empty Heading", "Consider ARIA Heading Roles"].includes(normalizedTitle)) return null;
  return {
    heading: "Suggested Fix: Repair the heading structure",
    description: "Headings should have real text and move through the outline one level at a time so users can understand page structure quickly.",
    snippets: buildHeadingStructureFixSuggestions(normalizedTitle, element)
  };
}

function getLandmarkFixContent(normalizedTitle) {
  if (["Missing Main Content Region", "Missing Main Landmark"].includes(normalizedTitle)) {
    return {
      heading: "Suggested Fix: Add a main content landmark",
      description: "This page needs a main content region so assistive technology users can jump directly to the primary content.",
      snippets: buildMainLandmarkFixSuggestions()
    };
  }

  if (normalizedTitle === "Custom Main Content Container Missing Landmark") {
    return {
      heading: "Suggested Fix: Mark this container as the main content",
      description: "This container already looks like the page's primary content area. Mark it as the main landmark so assistive technology users can jump straight to it.",
      snippets: buildMainLandmarkFixSuggestions()
    };
  }

  if (["Missing Navigation Landmark", "Custom Navigation Container Missing Landmark"].includes(normalizedTitle)) {
    const description = normalizedTitle === "Custom Navigation Container Missing Landmark"
      ? "This container already looks like navigation. Mark it as a navigation landmark so assistive technology users can find it quickly."
      : "Repeated site or section navigation should live in a named navigation landmark so assistive technology users can find it quickly.";
    return {
      heading: "Suggested Fix: Add a navigation landmark",
      description,
      snippets: buildNavigationLandmarkFixSuggestions()
    };
  }

  return null;
}

function getSkipLinkFixContent(normalizedTitle) {
  if (!["Missing Skip Link", "Missing Skip to Main Content Link"].includes(normalizedTitle)) return null;
  return {
    heading: "Suggested Fix: Add a skip link",
    description: "A skip link lets keyboard users bypass repeated navigation and jump straight to the main content region.",
    snippets: buildSkipLinkFixSuggestions()
  };
}

function getImageFixContent(normalizedTitle, element) {
  if (["Missing Alt Text", "Empty Alt Text"].includes(normalizedTitle)) {
    return {
      heading: "Suggested Fix: Add appropriate alt text",
      description: "Choose informative alt text when the image conveys meaning, or mark the image as decorative when it does not.",
      snippets: buildImageAltFixSuggestions(normalizedTitle, element)
    };
  }

  if (["Presentation Role Conflicts with Alt Text", "Redundant Alt Text"].includes(normalizedTitle)) {
    return {
      heading: "Suggested Fix: Align the image meaning with the alt text",
      description: "Decorative images should stay hidden from assistive technology, and meaningful images should use concise alt text without redundant words.",
      snippets: buildImageMeaningFixSuggestions(normalizedTitle, element)
    };
  }

  return null;
}

function getEmbeddedContentFixContent(normalizedTitle, element) {
  if (!["Iframe Missing Title", "Iframe Title Too Generic", "Embedded Content Missing Label"].includes(normalizedTitle)) return null;
  return {
    heading: normalizedTitle === "Embedded Content Missing Label"
      ? "Suggested Fix: Give embedded content an accessible label"
      : "Suggested Fix: Give the embedded frame a descriptive title",
    description: normalizedTitle === "Iframe Title Too Generic"
      ? "A frame title like 'frame' or 'content' is too vague. Name the actual content or task so users know what they are entering."
      : "An embedded-content title tells screen reader users what the content is before they enter it.",
    snippets: buildEmbeddedContentFixSuggestions(normalizedTitle, element)
  };
}

function getButtonLabelFixContent(normalizedTitle, element) {
  if (!["Icon-Only Button Missing Label", "Button Missing Text"].includes(normalizedTitle)) return null;
  return {
    heading: "Suggested Fix: Label the button action",
    description: "Buttons need an accessible name. Use visible text when possible, or add aria-label when the button is icon-only.",
    snippets: buildButtonLabelFixSuggestions(element)
  };
}

function getChoiceGroupFixContent(normalizedTitle, element) {
  if (normalizedTitle !== "Grouped Choices Missing Fieldset") return null;
  return {
    heading: "Suggested Fix: Group related choices with fieldset and legend",
    description: "When multiple radio buttons or checkboxes answer one question, wrap them in a fieldset and put the question in a legend.",
    snippets: buildChoiceGroupFixSuggestions(element)
  };
}

function getLinkFixContent(normalizedTitle, element) {
  if (["Link Missing Text", "Vague Link Text", "Ambiguous Link Text", "Duplicate Link Text, Different Destination"].includes(normalizedTitle)) {
    return {
      heading: "Suggested Fix: Make the link name descriptive",
      description: normalizedTitle === "Duplicate Link Text, Different Destination"
        ? "When repeated links go to different destinations, each one should say where it goes. Users should not have to guess which repeated label is the right one."
        : "Links need an accessible name that makes sense out of context. Prefer visible text that describes the destination or action.",
      snippets: buildLinkTextFixSuggestions(normalizedTitle, element)
    };
  }

  if (normalizedTitle === "Link Opens in New Window") {
    return {
      heading: "Suggested Fix: Warn users before opening a new window",
      description: "When a link opens a new tab or window, tell users in the visible text or accessible name so they do not lose context.",
      snippets: buildContextualLinkFixSuggestions(normalizedTitle, element)
    };
  }

  if (["Broken Fragment Link", "Broken Same-Origin Link", "Same-Origin Link Redirects", "Same-Origin Link Requires Authentication"].includes(normalizedTitle)) {
    let description = "This link should point to a real in-page target or a same-origin destination that returns successfully for the current user.";
    if (normalizedTitle === "Same-Origin Link Redirects") {
      description = "This link reaches a same-origin destination through a redirect. Prefer the final destination when that improves clarity and stability.";
    } else if (normalizedTitle === "Same-Origin Link Requires Authentication") {
      description = "This link reaches a protected same-origin destination. Make sure users are warned when sign-in is required, or fix the permissions if the content should be public.";
    }

    return {
      heading: "Suggested Fix: Repair the link target",
      description,
      snippets: buildBrokenLinkFixSuggestions(normalizedTitle, element)
    };
  }

  return null;
}

function getInputFixContent(normalizedTitle, element) {
  if (normalizedTitle === "Input Missing Label") {
    return {
      heading: "Suggested Fix: Add an accessible input label",
      description: "Inputs need a programmatic label. Prefer a real <label> tied to the field, or use aria-labelledby when the visible label lives elsewhere.",
      snippets: [
        {
          heading: "Suggested markup",
          code: buildInputLabelFixMarkup(element)
        }
      ]
    };
  }

  if (["Disabled State Not Announced", "Required Field Not Indicated", "Search Input Role Missing"].includes(normalizedTitle)) {
    return {
      heading: "Suggested Fix: Expose the field state clearly",
      description: "Make important field state available both visually and programmatically so assistive technology users get the same meaning.",
      snippets: buildInputStateFixSuggestions(normalizedTitle, element)
    };
  }

  return null;
}

function getSemanticControlFixContent(normalizedTitle, element) {
  if (normalizedTitle === "Accessible Name Does Not Include Visible Label") {
    return {
      heading: "Suggested Fix: Keep the visible words in the accessible name",
      description: "Assistive technology should announce the same visible words users rely on. Keep one visible label source and ensure the computed accessible name includes that exact text.",
      snippets: buildSemanticControlFixSuggestions(normalizedTitle, element)
    };
  }

  if (!["Non-Semantic Button", "Anchor Uses Button Role", "Non-Semantic Link", "Non-Standard Click Handler", "Button Role Missing Keyboard Handler", "Button Role Not Focusable", "Button Role Keyboard Handler Not Statically Verifiable"].includes(normalizedTitle)) {
    return null;
  }

  return {
    heading: "Suggested Fix: Use the native interactive element",
    description: "When a control navigates, use a real link. When it performs an action on the page, use a real button. Native controls give keyboard and assistive technology behavior for free.",
    snippets: buildSemanticControlFixSuggestions(normalizedTitle, element)
  };
}

function getContrastAndFocusFixContent(normalizedTitle, element) {
  if (normalizedTitle === "Low Color Contrast") {
    return {
      heading: "Suggested Fix: Increase the color contrast",
      description: "Text and interactive controls need enough foreground and background contrast to stay readable for low-vision users.",
      snippets: buildContrastFixSuggestions(element)
    };
  }

  if (normalizedTitle === "Missing Focus Indicator") {
    return {
      heading: "Suggested Fix: Add a visible keyboard focus indicator",
      description: "Keyboard users need a clear, persistent focus ring when they tab to an interactive control.",
      snippets: buildFocusIndicatorFixSuggestions(element)
    };
  }

  return null;
}

function getMediaFixContent(normalizedTitle, element) {
  if (!["Audio Missing Transcript", "Video Missing Captions", "Video Missing Descriptions"].includes(normalizedTitle)) return null;
  return {
    heading: "Suggested Fix: Add the missing media alternative",
    description: "Time-based media needs the right text or timed alternatives so people can access the same content without relying on hearing or vision alone.",
    snippets: buildMediaAlternativeFixSuggestions(normalizedTitle, element)
  };
}

function getListFixContent(normalizedTitle, element) {
  if (!["Empty List", "Invalid List Content"].includes(normalizedTitle)) return null;
  return {
    heading: "Suggested Fix: Repair the list structure",
    description: "Lists should contain real list items, and non-list layout patterns should not use ul or ol markup.",
    snippets: buildListFixSuggestions(normalizedTitle, element)
  };
}

function getMotionFixContent(normalizedTitle) {
  if (normalizedTitle !== "Motion Not Reduced") return null;
  return {
    heading: "Suggested Fix: Respect reduced-motion preferences",
    description: "Motion effects should stop, simplify, or become optional when the user asks for reduced motion.",
    snippets: buildMotionFixSuggestions()
  };
}

function getComplianceFixContent(title, element) {
  const normalizedTitle = String(title || "");

  return getDocumentMetadataFixContent(normalizedTitle)
    || getAriaFixContent(normalizedTitle, element)
    || getTableFixContent(normalizedTitle, element)
    || getFormLabelFixContent(normalizedTitle, element)
    || getPageHeadingFixContent(normalizedTitle)
    || getHeadingStructureFixContent(normalizedTitle, element)
    || getLandmarkFixContent(normalizedTitle)
    || getSkipLinkFixContent(normalizedTitle)
    || getImageFixContent(normalizedTitle, element)
    || getEmbeddedContentFixContent(normalizedTitle, element)
    || getButtonLabelFixContent(normalizedTitle, element)
    || getChoiceGroupFixContent(normalizedTitle, element)
    || getLinkFixContent(normalizedTitle, element)
    || getInputFixContent(normalizedTitle, element)
    || getSemanticControlFixContent(normalizedTitle, element)
    || getContrastAndFocusFixContent(normalizedTitle, element)
    || getMediaFixContent(normalizedTitle, element)
    || getListFixContent(normalizedTitle, element)
    || getMotionFixContent(normalizedTitle)
    || null;
}

function getBootstrapButtonClassForLevel(level) {
  switch (String(level || "").toLowerCase()) {
    case "critical":
    case "error":
      return "btn-danger";
    case "warning":
      return "btn-warning";
    case "success":
      return "btn-success";
    case "info":
    default:
      return "btn-info";
  }
}

function applyAlertSeverityToToggle(toggleButton, level) {
  if (!(toggleButton instanceof HTMLButtonElement)) return;

  const nextLevel = String(level || "info").toLowerCase();
  const currentLevel = String(toggleButton.dataset.smlcLevel || "").toLowerCase();
  const nextPriority = ALERT_LEVEL_PRIORITY[nextLevel] ?? -1;
  const currentPriority = ALERT_LEVEL_PRIORITY[currentLevel] ?? -1;
  if (nextPriority < currentPriority) return;

  toggleButton.dataset.smlcLevel = nextLevel;
  toggleButton.className = `btn btn-sm ${getBootstrapButtonClassForLevel(nextLevel)} sml-compliance-alert-toggle`;
}

function closeComplianceFixModal(modalBackdrop) {
  if (!(modalBackdrop instanceof HTMLElement)) return;
  modalBackdrop.remove();
}

function buildComplianceEvidenceSections(title, element) {
  if (!(element instanceof Element)) return [];

  const sections = [];
  sections.push({
    heading: "Detected element HTML",
    code: element.outerHTML
  });

  if (title === "Focusable Element Hidden From Screen Readers") {
    const hiddenAncestor = element.closest("[aria-hidden='true']");
    if (hiddenAncestor instanceof Element && hiddenAncestor !== element) {
      sections.push({
        heading: "Closest aria-hidden ancestor HTML",
        code: hiddenAncestor.outerHTML
      });
    }
  }

  return sections;
}

function showComplianceFixModal(title, element) {
  ensureInlineAlertStyles();

  const fixContent = getComplianceFixContent(title, element);
  const evidenceSections = buildComplianceEvidenceSections(title, element);
  const copyText = fixContent.snippets.map((snippet) => `${snippet.heading}\n${snippet.code}`).join("\n\n");
  const existing = document.querySelector(".sml-compliance-fix-modal-backdrop");
  if (existing) existing.remove();

  const backdrop = document.createElement("div");
  backdrop.className = "sml-compliance-fix-modal-backdrop";
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.setAttribute("aria-label", "WCAG fix suggestion");

  const modal = document.createElement("div");
  modal.className = "sml-compliance-fix-modal";

  const header = document.createElement("div");
  header.className = "sml-compliance-fix-modal-head";
  setSmlcOwnedHtml(header, `<strong>${escapeHtml(fixContent.heading)}</strong>`);

  const closeHeadButton = document.createElement("button");
  closeHeadButton.type = "button";
  closeHeadButton.className = "btn btn-sm btn-secondary";
  closeHeadButton.textContent = "Close";
  closeHeadButton.setAttribute("aria-label", "Close fix suggestion");
  closeHeadButton.addEventListener("click", () => closeComplianceFixModal(backdrop));
  header.appendChild(closeHeadButton);

  const body = document.createElement("div");
  body.className = "sml-compliance-fix-modal-body";
  setSmlcOwnedHtml(body, `<p class='mb-2'>${escapeHtml(fixContent.description)}</p>`);

  for (const evidence of evidenceSections) {
    const evidenceHeading = document.createElement("p");
    evidenceHeading.className = "mb-1 fw-bold";
    evidenceHeading.textContent = evidence.heading;

    const evidencePre = document.createElement("pre");
    const evidenceCode = document.createElement("code");
    evidenceCode.textContent = evidence.code;
    evidencePre.appendChild(evidenceCode);

    body.appendChild(evidenceHeading);
    body.appendChild(evidencePre);
  }

  for (const snippet of fixContent.snippets) {
    const snippetHeading = document.createElement("p");
    snippetHeading.className = "mb-1 fw-bold";
    snippetHeading.textContent = snippet.heading;

    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = snippet.code;
    pre.appendChild(code);

    body.appendChild(snippetHeading);
    body.appendChild(pre);
  }

  const footer = document.createElement("div");
  footer.className = "sml-compliance-fix-modal-foot";

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "btn btn-sm btn-dark sml-compliance-btn";
  copyButton.setAttribute("title", "Copy fix markup to clipboard");
  copyButton.setAttribute("aria-label", "Copy fix markup to clipboard");
  setSmlcOwnedHtml(copyButton, "<i class='bi bi-clipboard' aria-hidden='true'></i> Copy");
  copyButton.addEventListener("click", () => {
    void copyTextToClipboard(copyText).then((copied) => {
      setSmlcOwnedHtml(copyButton, copied
        ? "<i class='bi bi-clipboard-check' aria-hidden='true'></i> Copied"
        : "<i class='bi bi-clipboard-x' aria-hidden='true'></i> Failed");
    });
  });

  if (element instanceof Element) {
    const locateButton = document.createElement("button");
    locateButton.type = "button";
    locateButton.className = "btn btn-sm btn-info sml-compliance-btn";
    locateButton.setAttribute("title", "Take me to this element");
    locateButton.setAttribute("aria-label", "Take me to this element");
    setSmlcOwnedHtml(locateButton, "<i class='bi bi-crosshair' aria-hidden='true'></i> Take me to this element");
    locateButton.addEventListener("click", () => {
      const located = locateComplianceElement(element);
      if (located) {
        setSmlcOwnedHtml(locateButton, "<i class='bi bi-check2-circle' aria-hidden='true'></i> Element highlighted");
      }
    });
    footer.appendChild(locateButton);
  }

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "btn btn-sm btn-secondary sml-compliance-btn";
  closeButton.textContent = "Done";
  closeButton.setAttribute("aria-label", "Close fix suggestion");
  closeButton.addEventListener("click", () => closeComplianceFixModal(backdrop));

  footer.appendChild(copyButton);
  footer.appendChild(closeButton);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  markSmlcElementTree(backdrop);

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) {
      closeComplianceFixModal(backdrop);
    }
  });

  const onEsc = (event) => {
    if (event.key === "Escape") {
      closeComplianceFixModal(backdrop);
      document.removeEventListener("keydown", onEsc);
    }
  };
  document.addEventListener("keydown", onEsc);

  document.body.appendChild(backdrop);
}

function getLevelOneHeadingElements() {
  const nativeLevelOne = Array.from(document.querySelectorAll("h1"));
  const ariaLevelOne = Array.from(document.querySelectorAll("[role='heading'][aria-level='1']"));
  return Array.from(new Set([...nativeLevelOne, ...ariaLevelOne]));
}

function highlightLevelOneHeadings() {
  const targets = getLevelOneHeadingElements();
  for (const target of targets) {
    if (!(target instanceof Element)) continue;
    target.classList.add("sml-compliance-heading-highlight");
  }
  return targets.length;
}

function locateComplianceElement(element) {
  if (!(element instanceof Element) || !element.isConnected) return false;

  element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  element.classList.add("sml-compliance-color-source-highlight");
  window.setTimeout(() => {
    element.classList.remove("sml-compliance-color-source-highlight");
  }, 1800);

  return true;
}

function maybeAppendFixButton(alertDiv, level, title, element) {
  if (!(alertDiv instanceof HTMLElement)) return;
  const normalizedTitle = String(title || "");
  const fixContent = getComplianceFixContent(title, element);
  const hasSpecialActionOnly = ["Multiple Level 1 Headings", "Link Opens in New Window"].includes(normalizedTitle);
  if (!fixContent && !hasSpecialActionOnly) return;
  if (!fixContent && normalizedTitle !== "Multiple Level 1 Headings" && !(element instanceof Element)) return;

  const actionRow = document.createElement("div");
  actionRow.className = "sml-compliance-fix-actions";
  const alertButtonClass = getBootstrapButtonClassForLevel(level);

  if (fixContent) {
    const fixButton = document.createElement("button");
    fixButton.type = "button";
    fixButton.className = `btn btn-sm ${alertButtonClass} sml-compliance-fix-btn`;
    fixButton.setAttribute("title", "Show me how to fix this");
    fixButton.setAttribute("aria-label", "Show me how to fix this");
    setSmlcOwnedHtml(fixButton, "<i class='bi bi-wrench-adjustable-circle-fill' aria-hidden='true'></i> Show me how to fix this");
    fixButton.addEventListener("click", (event) => {
      stopComplianceControlEvent(event);
      showComplianceFixModal(normalizedTitle, element);
    });
    actionRow.appendChild(fixButton);
  }

  if (normalizedTitle === "Multiple Level 1 Headings") {
    const highlightButton = document.createElement("button");
    highlightButton.type = "button";
    highlightButton.className = `btn btn-sm ${alertButtonClass} sml-compliance-fix-btn`;
    highlightButton.setAttribute("title", "Highlight detected level 1 headings");
    highlightButton.setAttribute("aria-label", "Highlight detected level 1 headings");
    setSmlcOwnedHtml(highlightButton, "<i class='bi bi-highlighter' aria-hidden='true'></i> Highlight level 1 headings");
    highlightButton.addEventListener("click", (event) => {
      stopComplianceControlEvent(event);
      const count = highlightLevelOneHeadings();
      setSmlcOwnedHtml(highlightButton, `<i class='bi bi-check2-circle' aria-hidden='true'></i> Highlighted ${count}`);
    });
    actionRow.appendChild(highlightButton);
  }

  if (normalizedTitle === "Link Opens in New Window") {
    const locateButton = document.createElement("button");
    locateButton.type = "button";
    locateButton.className = `btn btn-sm ${alertButtonClass} sml-compliance-fix-btn`;
    locateButton.setAttribute("title", "Take me to this link");
    locateButton.setAttribute("aria-label", "Take me to this link");
    setSmlcOwnedHtml(locateButton, "<i class='bi bi-crosshair' aria-hidden='true'></i> Take me to this link");
    locateButton.addEventListener("click", (event) => {
      stopComplianceControlEvent(event);
      const located = locateComplianceElement(element);
      if (located) {
        setSmlcOwnedHtml(locateButton, "<i class='bi bi-check2-circle' aria-hidden='true'></i> Link highlighted");
      }
    });
    actionRow.appendChild(locateButton);
  }

  alertDiv.appendChild(actionRow);
}

function getFixableAlertTitles(alerts) {
  return Array.from(new Set((Array.isArray(alerts) ? alerts : [])
    .filter((alert) => getComplianceFixContent(alert?.title, alert?.element))
    .map((alert) => String(alert?.title || "").trim())
    .filter(Boolean)));
}

function getPlainLanguageIssueDescription(title) {
  const normalizedTitle = String(title || "").trim();
  const descriptions = {
    "Duplicate ID": "More than one thing on the page is using this same ID. Labels, links, scripts, or error messages can end up pointing to the wrong thing.",
    "Duplicate ID Referenced": "This element points to an ID that belongs to more than one thing. The page may pull the wrong label or description.",
    "Accessible Name Does Not Include Visible Label": "The name read out loud does not match the words the user sees on the screen. Make the spoken name include the same visible words so everyone is talking about the same control.",
    "ARIA Attribute Misspelled": "An aria- attribute is spelled wrong. Browsers and assistive tools will ignore it.",
    "Invalid Role Value": "This role name is not a real role. Assistive tools may not understand what this element is supposed to be.",
    "Heading Role Missing aria-level": "This is marked as a heading, but it does not say which heading level it is. Say whether it acts like an H1, H2, H3, and so on.",
    "Invalid aria-level Value": "This heading level is not valid. Assistive tools may place it in the wrong spot in the page outline.",
    "Focusable Element Hidden From Screen Readers": "Keyboard users can tab to this item, but screen readers are told to ignore it. Some users can reach it while others may not know it is there.",
    "Grouped Choices Missing Fieldset": "These choices belong to one question, but the group is not labeled as one group. Users may hear the answers without hearing the question first.",
    "Invalid aria-labelledby Reference": "The aria-labelledby points to something that is not on the page. The label may never be read out loud.",
    "Duplicate aria-labelledby Reference": "The same label is listed more than once. Screen readers may repeat the same label text.",
    "Invalid aria-describedby Reference": "The aria-describedby points to something that is not on the page. Help text or error text may never be read out loud.",
    "Duplicate aria-describedby Reference": "The same description is listed more than once. Screen readers may repeat the same description text.",
    "Required Field Not Indicated": "This field must be filled in, but the page is not clearly telling the user that.",
    "Search Input Role Missing": "This looks like a search box, but the markup does not say it is a search box. Assistive tools may treat it like a plain text field.",
    "Broken Fragment Link": "This link is supposed to jump to a spot on the same page, but that spot does not exist.",
    "Broken Same-Origin Link": "This link points to a page or file in this app, but that page or file could not be reached when checked.",
    "Same-Origin Link Redirects": "This link reaches the destination through a redirect. It may still work, but the extra hop can hide where the link really goes.",
    "Same-Origin Link Requires Authentication": "This link points to a page in this app that requires sign-in or permission. Users may hit an access barrier instead of the content they expected.",
    "Anchor Uses Button Role": "This is still a link in the code, but it is trying to behave like a button. That often causes confusing keyboard and screen reader behavior.",
    "Non-Semantic Button": "This acts like a button, but it is not built as a real button or an equally accessible pattern.",
    "Non-Standard Click Handler": "This element reacts to mouse clicks, but it is not exposed as a normal button or link. Keyboard and screen reader support may be incomplete.",
    "Button Role Missing Keyboard Handler": "This custom button can be clicked, but it does not fully support normal keyboard actions like Enter or Space.",
    "Button Role Not Focusable": "This custom button cannot be reached with normal keyboard tabbing, so some users may not be able to use it at all.",
    "Button Role Keyboard Handler Not Statically Verifiable": "This custom component uses button semantics, but keyboard handling is not visible in static markup. Verify Enter/Space support at runtime, especially when listeners are delegated.",
    "Invalid Input Not Described": "This field is marked as invalid, but its error message is not tied to the field. Screen readers may not say what is wrong.",
    "Iframe Missing Title": "This frame has no title, so users are not told what it contains before they move into it.",
    "Iframe Title Too Generic": "This frame has a title, but it is too generic to tell users what the embedded content actually is.",
    "Embedded Content Missing Label": "This embedded content has no clear accessible label, so users may not know what it contains or why it is there.",
    "Link Missing Text": "This link has no clear name. Users may find the link, but they will not know where it goes or what it does.",
    "Vague Link Text": "This link text is too generic, like 'click here' or 'read more.' It does not say where the link goes.",
    "Ambiguous Link Text": "This link text does not make sense by itself. If users hear it out of context, they still will not know what it means.",
    "Duplicate Link Text, Different Destination": "These links sound the same, but they go to different places. Users can have trouble knowing which one to choose.",
    "Disabled State Not Announced": "This control looks disabled, but assistive tools may not be told that it is disabled.",
    "Link Opens in New Window": "This link opens a new tab or window. If the page does not warn the user, they can lose their place and get confused.",
    "Table Missing Caption": "This table does not say what the table is about. Add a caption so users know the table's topic before reading the cells.",
    "Table Missing thead": "This table has no clear header section. That makes the table structure harder for browsers and assistive tools to understand.",
    "Table Header Missing Scope": "This header cell does not say whether it belongs to a row or a column. That makes cell relationships harder to announce clearly.",
    "Table Missing Header Cells": "This table has data cells, but it does not have the header cells users need to understand what the data means.",
    "Complex Table Missing Header Associations": "This table has grouped or spanning headers, but the cells are not explicitly tied to the right headers. Screen readers may announce the wrong context or not enough context.",
    "Possible Layout Table": "This looks like a table being used just for layout. Screen readers may still treat it like a real data table.",
    "Missing Navigation Landmark": "There is no clear navigation area for assistive tool users to jump to when they want the site's navigation.",
    "Missing Main Landmark": "There is no clear main content area, so users may have a harder time skipping past repeated page chrome to get to the real content.",
    "Custom Navigation Container Missing Landmark": "This area already looks like navigation, but it is not marked as a navigation landmark. Users may miss it when they jump through page regions.",
    "Custom Main Content Container Missing Landmark": "This looks like the page's main content, but it is not marked as the main landmark. Users may have a harder time jumping to the real content."
  };

  return descriptions[normalizedTitle] || "";
}

function getAriaAttributeNameFromText(text) {
  const temp = document.createElement("div");
  markSmlcElementTree(temp);
  temp.innerHTML = String(text || "");
  const visibleText = temp.textContent || "";
  const pattern = /\baria-[a-z0-9-]+\b/i;
  const match = pattern.exec(visibleText);
  return match ? match[0].toLowerCase() : "";
}

function getExpectedAriaAttributeNameFromMessage(message) {
  const visibleText = String(message || "");
  const expectedAttributePattern = /use\s+(aria-[a-z0-9-]+)\s+instead/i;
  const match = expectedAttributePattern.exec(visibleText);
  return match ? match[1].toLowerCase() : "";
}

function getSuggestedAriaRoleNameFromMessage(message) {
  const visibleText = String(message || "");
  const rolePattern = /use\s+role="([a-z0-9-]+)"\s+instead/i;
  const match = rolePattern.exec(visibleText);
  return match ? match[1].toLowerCase() : "";
}

function getAriaReferenceUrl(title, message) {
  const normalizedTitle = String(title || "").trim();

  if (normalizedTitle === "ARIA Attribute Misspelled") {
    const expectedAttributeName = getExpectedAriaAttributeNameFromMessage(message);
    return expectedAttributeName ? `${MDN_ARIA_REFERENCE_BASE}${expectedAttributeName}` : "";
  }

  if (normalizedTitle === "Invalid Role Value") {
    const suggestedRoleName = getSuggestedAriaRoleNameFromMessage(message);
    return suggestedRoleName ? `${MDN_ARIA_ROLE_REFERENCE_BASE}${suggestedRoleName}_role` : "";
  }

  const ariaAttributeName = getAriaAttributeNameFromText(`${title || ""} ${message || ""}`);
  return ariaAttributeName ? `${MDN_ARIA_REFERENCE_BASE}${ariaAttributeName}` : "";
}

function getIdReferenceTokens(value) {
  return String(value || "")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function markSmlcElementTree(element) {
  if (!(element instanceof Element)) return element;

  element.dataset.smlc = "1";
  element.querySelectorAll("*").forEach((child) => {
    child.dataset.smlc = "1";
  });

  return element;
}

function setSmlcOwnedHtml(element, html) {
  if (!(element instanceof Element)) return element;

  element.innerHTML = html;
  markSmlcElementTree(element);
  return element;
}

function getVisibleControlText(element) {
  if (!(element instanceof Element)) return "";

  const clone = element.cloneNode(true);
  if (!(clone instanceof Element)) return "";

  clone.querySelectorAll("[aria-hidden='true'], [hidden], .d-none, .hidden, script, style, title").forEach((node) => {
    node.remove();
  });

  // Remove child elements that have their own aria-labels (they're self-contained)
  clone.querySelectorAll("[aria-label]").forEach((node) => {
    if (node !== clone) {
      node.remove();
    }
  });

  return String(clone.textContent || "").replace(/\s+/g, " ").trim();
}

function getVisibleNameBearingText(element) {
  if (!(element instanceof Element)) return "";

  if (element instanceof HTMLInputElement) {
    const inputType = String(element.type || "text").toLowerCase();
    if (["button", "submit", "reset"].includes(inputType)) {
      return String(element.value || "").trim();
    }
  }

  return getVisibleControlText(element);
}

function normalizeAccessibleNameText(value) {
  return String(value || "")
    .toLowerCase()
    .replaceAll("&", " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getLinkAuditLabel(link) {
  if (!(link instanceof Element)) return "";

  const visibleText = getVisibleControlText(link);
  if (visibleText) return visibleText;

  const ariaLabel = String(link.getAttribute("aria-label") || "").trim();
  if (ariaLabel) return ariaLabel;

  const ariaLabelledbyText = getReferencedTextContent(link.getAttribute("aria-labelledby"));
  if (ariaLabelledbyText) return ariaLabelledbyText;

  return String(link.getAttribute("title") || "").trim();
}

function getNormalizedLinkDestination(rawHref) {
  const hrefText = String(rawHref || "").trim();
  if (!hrefText) return "";

  const auditUrl = resolveComplianceAuditUrl(hrefText);
  if (!(auditUrl instanceof URL)) return hrefText;

  if (auditUrl.protocol === "http:" || auditUrl.protocol === "https:") {
    return `${auditUrl.origin}${auditUrl.pathname}${auditUrl.search}${auditUrl.hash}`;
  }

  return auditUrl.href;
}

function getEmbeddedContentAccessibleLabel(element) {
  if (!(element instanceof Element)) return "";

  const title = String(element.getAttribute("title") || "").trim();
  if (title) return title;

  const ariaLabel = String(element.getAttribute("aria-label") || "").trim();
  if (ariaLabel) return ariaLabel;

  return getReferencedTextContent(element.getAttribute("aria-labelledby"));
}

function hasOverlyGenericEmbeddedTitle(value) {
  const normalized = normalizeAccessibleNameText(value);
  return ["frame", "iframe", "content", "embedded content", "widget", "panel", "document"].includes(normalized);
}

function collectValidationMessageElements(input) {
  if (!(input instanceof Element)) return [];

  const inputId = String(input.getAttribute("id") || "").trim();
  const describedByElements = getReferencedElements(input.getAttribute("aria-describedby"));
  const errorMessageElements = getReferencedElements(input.getAttribute("aria-errormessage"));
  const conventionalElements = inputId
    ? [
        document.getElementById(`${inputId}-error`),
        document.getElementById(`${inputId}Error`),
        document.querySelector(`[data-error-for='${CSS.escape(inputId)}']`)
      ].filter((element) => element instanceof Element)
    : [];

  return Array.from(new Set([
    ...describedByElements,
    ...errorMessageElements,
    ...conventionalElements
  ]));
}

function accessibleNameContainsVisibleLabel(visibleText, accessibleName) {
  const normalizedVisibleText = normalizeAccessibleNameText(visibleText);
  const normalizedAccessibleName = normalizeAccessibleNameText(accessibleName);

  if (!normalizedVisibleText || !normalizedAccessibleName) return true;
  return normalizedAccessibleName.includes(normalizedVisibleText);
}

function getAccessibleNameOverrideDetails(element) {
  if (!(element instanceof Element)) return null;

  const isInputControl = element.matches("input, select, textarea");
  const role = String(element.getAttribute("role") || "").trim().toLowerCase();
  let inputType = "";
  if (element instanceof HTMLInputElement) {
    inputType = String(element.type || "text").toLowerCase();
  }
  const usesOwnVisibleText = element.tagName === "SUMMARY"
    || ["button", "submit", "reset"].includes(inputType)
    || ["button", "link", "checkbox", "radio", "switch", "tab", "menuitem", "menuitemcheckbox", "menuitemradio", "option", "treeitem", "gridcell"].includes(role);
  let visibleText = getVisibleControlText(element);
  if (usesOwnVisibleText) {
    visibleText = getVisibleNameBearingText(element);
  } else if (isInputControl) {
    visibleText = getAssociatedLabelText(element);
  }
  let labelKind = "button text";
  if (isInputControl) {
    labelKind = "label";
  } else if (element.tagName === "A") {
    labelKind = "link text";
  } else if (element.tagName === "SUMMARY" || usesOwnVisibleText) {
    labelKind = "visible control text";
  }
  if (!visibleText) return null;

  const ariaLabel = String(element.getAttribute("aria-label") || "").trim();
  if (ariaLabel) {
    return {
      visibleText,
      accessibleName: ariaLabel,
      sourceAttribute: "aria-label",
      labelKind
    };
  }

  const ariaLabelledbyText = getReferencedTextContent(element.getAttribute("aria-labelledby"));
  if (ariaLabelledbyText) {
    return {
      visibleText,
      accessibleName: ariaLabelledbyText,
      sourceAttribute: "aria-labelledby",
      labelKind
    };
  }

  return null;
}

function isSmlcOwnedElement(element) {
  return element instanceof Element
    && Boolean(element.closest("[data-smlc='1']"));
}

function resolveComplianceAuditUrl(rawHref) {
  if (typeof rawHref !== "string" || rawHref.trim() === "") return null;

  try {
    return new URL(rawHref, window.location.href);
  } catch {
    return null;
  }
}

function isLinkAuditHttpUrl(url) {
  return url instanceof URL && (url.protocol === "http:" || url.protocol === "https:");
}

function isSameDocumentFragmentLink(url) {
  return url instanceof URL
    && url.hash.length > 1
    && url.origin === window.location.origin
    && url.pathname === window.location.pathname
    && url.search === window.location.search;
}

function resolveFragmentTarget(fragment) {
  const rawFragment = String(fragment || "");
  if (!rawFragment.startsWith("#") || rawFragment.length < 2) return null;

  const targetId = decodeURIComponent(rawFragment.slice(1));
  if (!targetId) return null;

  return document.getElementById(targetId);
}

function describeHttpStatus(statusCode) {
  const normalized = Number.parseInt(String(statusCode || "0"), 10) || 0;
  if (normalized === 404) return "Not Found";
  if (normalized === 410) return "Gone";
  if (normalized === 401) return "Unauthorized";
  if (normalized === 403) return "Forbidden";
  if (normalized >= 500 && normalized < 600) return "Server Error";
  if (normalized >= 400 && normalized < 500) return "Client Error";
  return "HTTP Error";
}

async function fetchComplianceLinkStatus(url, timeoutMs = 3000) {
  const methods = ["HEAD", "GET"];

  for (const method of methods) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method,
        credentials: "same-origin",
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal
      });
      window.clearTimeout(timeoutId);

      if (response.type === "opaqueredirect") {
        return {
          kind: "redirect",
          status: 0,
          finalUrl: response.url || url.toString()
        };
      }

      if (response.status >= 300 && response.status < 400) {
        return {
          kind: "redirect",
          status: response.status,
          finalUrl: response.headers.get("location") || response.url || url.toString()
        };
      }

      if ((response.status === 405 || response.status === 501) && method === "HEAD") {
        continue;
      }

      return {
        kind: response.ok ? "ok" : "http-error",
        status: response.status,
        finalUrl: response.url || url.toString()
      };
    } catch (error) {
      window.clearTimeout(timeoutId);

      if (error?.name === "AbortError") {
        return { kind: "timeout", timeoutMs };
      }

      if (method === "HEAD") {
        continue;
      }

      return {
        kind: "network-error",
        message: String(error?.message || error || "Unknown network error")
      };
    }
  }

  return { kind: "unknown" };
}

async function getCachedComplianceLinkStatus(url, timeoutMs) {
  const cacheKey = String(url);
  if (!BROKEN_LINK_STATUS_CACHE.has(cacheKey)) {
    BROKEN_LINK_STATUS_CACHE.set(cacheKey, fetchComplianceLinkStatus(url, timeoutMs));
  }

  return await BROKEN_LINK_STATUS_CACHE.get(cacheKey);
}

function isFocusableOrInteractiveElement(element) {
  if (!(element instanceof HTMLElement) || element.hasAttribute("disabled")) return false;
  if (element.matches("a[href], button, input:not([type='hidden']), select, textarea, summary, iframe, [contenteditable='true']")) return true;
  if (element.hasAttribute("tabindex")) {
    const tabindex = Number.parseInt(element.getAttribute("tabindex") || "", 10);
    if (!Number.isNaN(tabindex)) return true;
  }

  const role = String(element.getAttribute("role") || "").trim().toLowerCase();
  return [
    "button", "link", "checkbox", "radio", "switch", "tab", "menuitem", "menuitemcheckbox", "menuitemradio",
    "option", "textbox", "searchbox", "combobox", "spinbutton", "slider", "treeitem", "gridcell"
  ].includes(role);
}

function isHiddenFromAllUsers(element) {
  if (!(element instanceof Element)) return true;
  if (element.closest("[hidden], template, .hidden, .d-none, .modal:not(.show)")) return true;

  let current = element;
  while (current instanceof HTMLElement) {
    const styles = window.getComputedStyle(current);
    if (styles.display === "none" || styles.visibility === "hidden") {
      return true;
    }
    current = current.parentElement;
  }

  return false;
}

function collectDuplicateIdCounts() {
  const counts = new Map();
  const elementsWithIds = Array.from(document.querySelectorAll("[id]"));
  for (const element of elementsWithIds) {
    if (!(element instanceof Element) || isSmlcOwnedElement(element)) continue;
    const id = String(element.id || "").trim();
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return counts;
}

function getMisspelledAriaAttributes(element) {
  if (!(element instanceof Element)) return [];

  return element.getAttributeNames()
    .map((name) => name.toLowerCase())
    .filter((name) => COMMON_ARIA_ATTRIBUTE_MISSPELLINGS[name])
    .map((name) => ({ wrong: name, expected: COMMON_ARIA_ATTRIBUTE_MISSPELLINGS[name] }));
}

function getInvalidRoleTokens(roleValue) {
  return String(roleValue || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !VALID_ARIA_ROLES.has(token));
}

function getAriaAuditCandidateElements() {
  return new Set(document.querySelectorAll("[id], [role], [aria-hidden], [aria-level], [aria-label], [aria-labelledby], [aria-describedby], [aria-role], [aria-labeledby], [arialabelledby], [labelledby], [ariadescribedby], [describedby], [arialabel]"));
}

function buildInvalidRoleMessage(invalidRoleTokens) {
  if (invalidRoleTokens.length === 1 && invalidRoleTokens[0] === "image") {
    return `role="image" is invalid. Use role="img" instead.`;
  }

  const pluralSuffix = invalidRoleTokens.length > 1 ? "s" : "";
  return `role contains unsupported value${pluralSuffix}: ${invalidRoleTokens.join(", ")}`;
}

function reportDuplicateIdAlert(compliance, elem, duplicateIdCounts, reportedDuplicateIds) {
  const elementId = String(elem.getAttribute("id") || "").trim();
  const duplicateIdCount = elementId ? (duplicateIdCounts.get(elementId) || 0) : 0;
  if (!elementId || duplicateIdCount <= 1 || reportedDuplicateIds.has(elementId)) return;

  reportedDuplicateIds.add(elementId);

  compliance.addAlert("error", "Duplicate ID",
    `id="${elementId}" is used ${duplicateIdCount} times on the page. IDs must be unique.`, elem);
}

function reportMisspelledAriaAttributes(compliance, elem) {
  for (const misspelling of getMisspelledAriaAttributes(elem)) {
    compliance.addAlert("error", "ARIA Attribute Misspelled",
      `${misspelling.wrong} is not a valid accessibility attribute. Use ${misspelling.expected} instead.`, elem);
  }
}

function reportRoleIssues(compliance, elem) {
  const role = elem.getAttribute("role");
  if (!role) return;

  const invalidRoleTokens = getInvalidRoleTokens(role);
  if (invalidRoleTokens.length > 0) {
    compliance.addAlert("error", "Invalid Role Value", buildInvalidRoleMessage(invalidRoleTokens), elem);
  }

  if (String(role).trim().toLowerCase() === "heading" && !elem.hasAttribute("aria-level")) {
    compliance.addAlert("warning", "Heading Role Missing aria-level",
      `role="heading" should include aria-level="1-6" so assistive technology knows the heading level.`, elem);
  }
}

function reportAriaLevelIssues(compliance, elem) {
  if (!elem.hasAttribute("aria-level")) return;

  const ariaLevelValue = String(elem.getAttribute("aria-level") || "").trim();
  const ariaLevelNumber = Number.parseInt(ariaLevelValue, 10);
  if (!/^\d+$/.test(ariaLevelValue) || Number.isNaN(ariaLevelNumber) || ariaLevelNumber < 1) {
    compliance.addAlert("warning", "Invalid aria-level Value",
      `aria-level="${ariaLevelValue || ""}" is invalid. Use a positive integer such as aria-level="2".`, elem);
  }
}

function reportAriaLabelIssues(compliance, elem) {
  if (elem.getAttribute("aria-label")?.trim() === "") {
    compliance.addAlert("error", "Empty ARIA Label",
      `aria-label is empty - either remove it or provide text`, elem);
  }
}

function reportAriaReferenceIssues(compliance, elem, attributeName, invalidTitle, duplicateTitle, duplicateIdCounts) {
  const rawValue = elem.getAttribute(attributeName);
  if (!rawValue) return;

  const refs = getIdReferenceTokens(rawValue);
  const seenRefs = new Set();
  for (const ref of refs) {
    if (seenRefs.has(ref)) {
      compliance.addAlert("warning", duplicateTitle,
        `${attributeName} references the same ID more than once: ${ref}`, elem);
      continue;
    }
    seenRefs.add(ref);

    if (!document.getElementById(ref)) {
      compliance.addAlert(invalidTitle === "Invalid aria-labelledby Reference" ? "error" : "warning", invalidTitle,
        `${attributeName} references non-existent element ID: ${ref}`, elem);
      continue;
    }

    if ((duplicateIdCounts.get(ref) || 0) > 1) {
      compliance.addAlert("warning", "Duplicate ID Referenced",
        `${attributeName} references id="${ref}", but that ID is duplicated on the page.`, elem);
    }
  }
}

function reportAriaHiddenFocusConflict(compliance, elem) {
  const hiddenContainer = String(elem.getAttribute("aria-hidden") || "").toLowerCase() === "true"
    ? elem
    : elem.closest("[aria-hidden='true']");
  if (hiddenContainer && isFocusableOrInteractiveElement(elem) && !isHiddenFromAllUsers(elem)) {
    compliance.addAlert("warning", "Focusable Element Hidden From Screen Readers",
      `Interactive or focusable element is hidden from screen readers with aria-hidden="true". Remove aria-hidden or remove the element from interaction.`, elem);
  }
}

function getMoreInfoUrl(title, message) {
  const normalizedTitle = String(title || "").trim();
  const directUrl = MORE_INFO_URL_BY_TITLE[normalizedTitle];
  if (directUrl) return directUrl;

  const ariaReferenceUrl = getAriaReferenceUrl(title, message);
  if (ariaReferenceUrl) return ariaReferenceUrl;

  const query = MORE_INFO_QUERY_BY_TITLE[normalizedTitle];
  return query ? `${MDN_SEARCH_BASE}${encodeURIComponent(query)}` : "";
}

function getIssueGuideUrl(title = "", message = "") {
  const guideBaseUrl = globalThis.TzedekConfig?.assetBaseUrl;
  const baseUrl = typeof guideBaseUrl === "string" && guideBaseUrl.trim().length > 0
    ? guideBaseUrl
    : new URL("./assets/", import.meta.url).href;
  const guideUrl = new URL("issue-guide.html", baseUrl);
  const normalizedTitle = title.trim();
  const normalizedMessage = message.trim();
  guideUrl.searchParams.set("title", normalizedTitle);
  if (normalizedMessage) {
    guideUrl.searchParams.set("message", normalizedMessage);
  }
  return guideUrl.href;
}

function ensureBootstrapIconsStyles() {
  if (document.getElementById(BOOTSTRAP_ICONS_LINK_ID)) return;

  const existingLink = document.querySelector(`link[href*='bootstrap-icons.css']`);
  if (existingLink) return;

  const runtimeConfig = globalThis.TzedekConfig;
  const configuredHref = runtimeConfig && typeof runtimeConfig === "object"
    ? runtimeConfig.bootstrapIconsHref
    : "";

  const link = document.createElement("link");
  link.id = BOOTSTRAP_ICONS_LINK_ID;
  link.rel = "stylesheet";
  link.href = configuredHref || DEFAULT_BOOTSTRAP_ICONS_HREF;
  markSmlcElementTree(link);
  document.head.appendChild(link);
}

function createAlertId() {
  const randomBytes = new Uint32Array(1);
  window.crypto.getRandomValues(randomBytes);
  return `compliance-alert-${Date.now()}-${randomBytes[0].toString(36)}`;
}

function updateInlineAlertToggleCount(toggleButton, panesContainer) {
  if (!(toggleButton instanceof HTMLButtonElement) || !(panesContainer instanceof HTMLElement)) return;

  const count = panesContainer.querySelectorAll(".sml-compliance-alert-pane").length;
  const safeCount = count > 0 ? count : 1;

  const countEl = toggleButton.querySelector(".sml-compliance-alert-count");
  if (countEl) {
    countEl.textContent = String(safeCount);
  }

  const label = safeCount === 1
    ? "Select button to review 1 issue"
    : `Select button to review ${safeCount} issues`;

  toggleButton.setAttribute("aria-label", label);
  toggleButton.setAttribute("title", label);
}

function getInlineAlertHostForElement(element) {
  if (!(element instanceof Element)) return null;

  const hostWrapper = element.closest(".sml-compliance-alert");
  if (hostWrapper) {
    const wrapperHost = INLINE_ALERT_WRAPPERS.get(hostWrapper);
    if (wrapperHost) return wrapperHost;
  }

  return null;
}

function stopComplianceControlEvent(event) {
  event.preventDefault();
  event.stopPropagation();
  if (typeof event.stopImmediatePropagation === "function") {
    event.stopImmediatePropagation();
  }
}

function resolveInlineAlertMountTarget(element, title) {
  if (!(element instanceof Element)) return null;

  const normalizedTitle = String(title || "").trim().toLowerCase();
  const isControl = element.matches("button, [role='button'], input, select, textarea");

  if (normalizedTitle === "low color contrast" && element.matches("button, [role='button']")) {
    return element.closest(".modal-header") || element;
  }

  if (isControl && element.matches("input, select, textarea")) {
    return element.closest("sml-form-field, .form-floating, .form-group") || element;
  }

  return element.closest("sml-form-field, .form-floating, .form-group, .modal-header, td, th, li") || element;
}

function shouldForceBodyMountForInlineAlert(element, mountTarget) {
  const candidates = [mountTarget, element].filter((candidate) => candidate instanceof Element);

  for (const candidate of candidates) {
    let current = candidate;
    while (current instanceof Element) {
      const styles = window.getComputedStyle(current);
      const zIndex = Number.parseInt(styles.zIndex || "0", 10);
      if (current.matches("td, th, li, button, [role='button'], a, .list-group-item, .list-group")) {
        return true;
      }
      if (styles.display === "inline" || styles.display === "inline-flex" || styles.display === "inline-grid") {
        return true;
      }
      if (styles.overflowX === "hidden" || styles.overflowX === "clip") {
        return true;
      }
      if (styles.pointerEvents === "none" || (!Number.isNaN(zIndex) && zIndex < 0)) {
        return true;
      }
      current = current.parentElement;
    }
  }

  return false;
}

function positionFloatingInlineAlertPanes(toggleButton, panesContainer) {
  if (!(toggleButton instanceof HTMLElement) || !(panesContainer instanceof HTMLElement)) return;

  const toggleRect = toggleButton.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const margin = 12;
  const sideGap = 10;
  const preferredWidth = 512;
  const minimumWidth = 50;
  const availableRight = Math.max(0, viewportWidth - toggleRect.right - margin - sideGap);
  const availableLeft = Math.max(0, toggleRect.left - margin - sideGap);
  const useRightSide = availableRight >= availableLeft;
  const sideWidth = useRightSide ? availableRight : availableLeft;
  const desiredWidth = Math.min(preferredWidth, Math.max(minimumWidth, sideWidth || (viewportWidth - (margin * 2))));

  panesContainer.style.width = `${desiredWidth}px`;
  panesContainer.style.minWidth = `${minimumWidth}px`;
  panesContainer.style.maxWidth = `calc(100vw - ${margin * 2}px)`;

  const containerRect = panesContainer.getBoundingClientRect();
  const width = containerRect.width || desiredWidth;
  const height = containerRect.height || 0;
  const rightSideLeft = toggleRect.right + sideGap;
  const leftSideLeft = toggleRect.left - sideGap - width;
  const left = useRightSide
    ? Math.min(rightSideLeft, Math.max(margin, viewportWidth - width - margin))
    : Math.max(margin, leftSideLeft);
  const preferredTop = toggleRect.top + ((toggleRect.height - Math.min(toggleRect.height, height || toggleRect.height)) / 2);
  const top = Math.min(
    Math.max(margin, preferredTop),
    Math.max(margin, viewportHeight - height - margin)
  );

  panesContainer.style.left = `${Math.round(left)}px`;
  panesContainer.style.top = `${Math.round(top)}px`;
}

function ensureFloatingInlineAlertRepositioning(toggleButton, panesContainer) {
  if (!(toggleButton instanceof HTMLElement) || !(panesContainer instanceof HTMLElement)) return;
  if (INLINE_ALERT_REPOSITIONERS.has(panesContainer)) return;

  const reposition = () => {
    if (panesContainer.hidden) return;
    positionFloatingInlineAlertPanes(toggleButton, panesContainer);
  };

  window.addEventListener("resize", reposition);
  window.addEventListener("scroll", reposition, true);
  INLINE_ALERT_REPOSITIONERS.set(panesContainer, reposition);
}

function setInlineAlertExpanded(toggleButton, panesContainer, expanded) {
  if (!(toggleButton instanceof HTMLButtonElement) || !(panesContainer instanceof HTMLElement)) return;

  panesContainer.hidden = !expanded;
  toggleButton.setAttribute("aria-expanded", String(expanded));

  if (expanded && panesContainer.classList.contains("sml-compliance-alert-panes-floating")) {
    positionFloatingInlineAlertPanes(toggleButton, panesContainer);
  }
}

function closeAllFloatingInlineAlertPanes(exceptContainer = null) {
  document.querySelectorAll(".sml-compliance-alert-panes-floating").forEach((pane) => {
    if (!(pane instanceof HTMLElement) || pane === exceptContainer) return;
    const toggleButton = INLINE_ALERT_TOGGLES.get(pane);
    if (toggleButton instanceof HTMLButtonElement) {
      setInlineAlertExpanded(toggleButton, pane, false);
    } else {
      pane.hidden = true;
    }
  });
}

function ensureInlineAlertDismissHandlers() {
  if (INLINE_ALERT_DISMISS_HANDLERS_BOUND) return;

  document.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".sml-compliance-alert-toggle") || target.closest(".sml-compliance-alert-panes-floating")) {
      return;
    }
    closeAllFloatingInlineAlertPanes();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllFloatingInlineAlertPanes();
    }
  });

  INLINE_ALERT_DISMISS_HANDLERS_BOUND = true;
}

function createComplianceAlert(level, title, message, element) {
  ensureInlineAlertStyles();
  ensureInlineAlertDismissHandlers();

  const alertId = createAlertId();
  const alertClass = ALERT_CLASSES[level] || ALERT_CLASSES.info;
  const paneId = `${alertId}-pane`;
  const body = document.body || document.documentElement;
  const isElementNode = element instanceof Element;
  const mountTarget = isElementNode ? resolveInlineAlertMountTarget(element, title) : null;
  const shouldUseBodyMount = !isElementNode
    || !element.isConnected
    || element === document.documentElement
    || element === document.body
    || shouldForceBodyMountForInlineAlert(element, mountTarget);
  const shouldUseFloatingPane = isElementNode && shouldUseBodyMount;
  const localHostKey = mountTarget || element;
  const nestedHost = getInlineAlertHostForElement(element);
  let wrapper;
  let toggleButton;
  let panesContainer;

  if (nestedHost?.wrapper?.isConnected) {
    wrapper = nestedHost.wrapper;
    toggleButton = nestedHost.toggleButton;
    panesContainer = nestedHost.panesContainer;
    const controlledIds = (toggleButton.getAttribute("aria-controls") || "").trim();
    toggleButton.setAttribute("aria-controls", controlledIds ? controlledIds + " " + paneId : paneId);
  } else {
    let hostKey = localHostKey;
    if (!shouldUseFloatingPane && shouldUseBodyMount) {
      hostKey = body;
    }
    if (hostKey) {
      const existingHost = INLINE_ALERT_HOSTS.get(hostKey);
      if (existingHost?.wrapper?.isConnected) {
        wrapper = existingHost.wrapper;
        toggleButton = existingHost.toggleButton;
        panesContainer = existingHost.panesContainer;
        const controlledIds = (toggleButton.getAttribute("aria-controls") || "").trim();
        toggleButton.setAttribute("aria-controls", controlledIds ? controlledIds + " " + paneId : paneId);
      }
    }
  }

  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.className = "sml-compliance-alert";
    wrapper.dataset.smlcInlineAlert = "1";

    toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "btn btn-sm btn-info sml-compliance-alert-toggle";
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.setAttribute("aria-controls", paneId);
    toggleButton.setAttribute("aria-label", "Select button to review 1 issue");
    toggleButton.setAttribute("title", "Select button to review 1 issue");
    setSmlcOwnedHtml(toggleButton, "<i class='bi bi-universal-access' aria-hidden='true'></i><span class='sml-compliance-alert-count' aria-hidden='true'>1</span>");

    panesContainer = document.createElement("div");
    panesContainer.className = "sml-compliance-alert-panes";
    if (shouldUseFloatingPane) {
      panesContainer.classList.add("sml-compliance-alert-panes-floating");
    }
    panesContainer.hidden = true;
    INLINE_ALERT_TOGGLES.set(panesContainer, toggleButton);

    const guardComplianceInteraction = (event) => {
      stopComplianceControlEvent(event);
    };

    ["pointerdown", "mousedown", "mouseup", "keydown", "keyup"].forEach((eventName) => {
      toggleButton.addEventListener(eventName, guardComplianceInteraction);
    });

    toggleButton.addEventListener("click", (event) => {
      stopComplianceControlEvent(event);
      const willOpen = panesContainer.hidden;
      if (willOpen) {
        closeAllFloatingInlineAlertPanes(panesContainer);
      }
      setInlineAlertExpanded(toggleButton, panesContainer, willOpen);
    });

    wrapper.appendChild(toggleButton);
    markSmlcElementTree(wrapper);
    markSmlcElementTree(panesContainer);

    INLINE_ALERT_WRAPPERS.set(wrapper, { wrapper, toggleButton, panesContainer });

    if (body && shouldUseFloatingPane) {
      body.appendChild(panesContainer);
      ensureFloatingInlineAlertRepositioning(toggleButton, panesContainer);
      if (mountTarget instanceof Element) {
        if (mountTarget.matches(".modal-header")) {
          wrapper.classList.add("sml-compliance-alert-modal-header");
          mountTarget.appendChild(wrapper);
        } else {
          mountTarget.after(wrapper);
        }
        INLINE_ALERT_HOSTS.set(mountTarget, { wrapper, toggleButton, panesContainer });
      } else if (isElementNode) {
        element.after(wrapper);
        INLINE_ALERT_HOSTS.set(element, { wrapper, toggleButton, panesContainer });
        } else {
          body.prepend(wrapper);
          INLINE_ALERT_HOSTS.set(body, { wrapper, toggleButton, panesContainer });
      }
    } else if (body && shouldUseBodyMount) {
      wrapper.appendChild(panesContainer);
      body.prepend(wrapper);
      INLINE_ALERT_HOSTS.set(body, { wrapper, toggleButton, panesContainer });
    } else if (mountTarget instanceof Element) {
      wrapper.appendChild(panesContainer);
      if (mountTarget.matches(".modal-header")) {
        wrapper.classList.add("sml-compliance-alert-modal-header");
        mountTarget.appendChild(wrapper);
      } else {
        mountTarget.after(wrapper);
      }
      INLINE_ALERT_HOSTS.set(mountTarget, { wrapper, toggleButton, panesContainer });
    } else if (isElementNode) {
      wrapper.appendChild(panesContainer);
      element.after(wrapper);
      INLINE_ALERT_HOSTS.set(element, { wrapper, toggleButton, panesContainer });
    }
  }
  
  const alertDiv = document.createElement("div");
  alertDiv.id = paneId;
  alertDiv.className = `sml-compliance-alert-pane ${alertClass} my-0 mx-0 p-3 rounded`;
  alertDiv.setAttribute("role", "alert");
  alertDiv.setAttribute("aria-live", "polite");

  const closePaneButton = document.createElement("button");
  closePaneButton.type = "button";
  closePaneButton.className = "sml-compliance-pane-close";
  closePaneButton.setAttribute("aria-label", "Close issue details");
  closePaneButton.setAttribute("title", "Close issue details");
  closePaneButton.textContent = "×";
  ["pointerdown", "mousedown", "mouseup", "keydown", "keyup"].forEach((eventName) => {
    closePaneButton.addEventListener(eventName, (event) => {
      stopComplianceControlEvent(event);
    });
  });
  closePaneButton.addEventListener("click", (event) => {
    stopComplianceControlEvent(event);
    setInlineAlertExpanded(toggleButton, panesContainer, false);
  });
  alertDiv.appendChild(closePaneButton);
  
  const titleEl = document.createElement("strong");
  titleEl.textContent = `[${level.toUpperCase()}] ${title}`;
  alertDiv.appendChild(titleEl);

  const plainDescription = getPlainLanguageIssueDescription(title);
  if (plainDescription) {
    const plainDescriptionEl = document.createElement("small");
    plainDescriptionEl.className = "sml-compliance-plain";
    plainDescriptionEl.textContent = plainDescription;
    alertDiv.appendChild(plainDescriptionEl);
  }
  
  const messageEl = document.createElement("p");
  messageEl.className = "mb-0 mt-2";
  setSmlcOwnedHtml(messageEl, message);
  alertDiv.appendChild(messageEl);
  wireColorSourceHoverHandlers(alertDiv);
  wireButtonPreviewHandlers(alertDiv);

  const moreInfoUrl = getMoreInfoUrl(title, message);
  if (moreInfoUrl) {
    const moreInfoLink = document.createElement("a");
    moreInfoLink.className = "sml-compliance-more-info";
    moreInfoLink.href = moreInfoUrl;
    moreInfoLink.target = "_blank";
    moreInfoLink.rel = "noopener noreferrer";
    moreInfoLink.textContent = "More Info";
    alertDiv.appendChild(moreInfoLink);
  }

  const issueGuideLink = document.createElement("a");
  issueGuideLink.className = "sml-compliance-more-info";
  issueGuideLink.href = getIssueGuideUrl(title, message);
  issueGuideLink.target = "_blank";
  issueGuideLink.rel = "noopener noreferrer";
  issueGuideLink.textContent = "Tzedek Guide";
  alertDiv.appendChild(issueGuideLink);

  applyAlertSeverityToToggle(toggleButton, level);
  maybeAppendFixButton(alertDiv, level, title, element);
  markSmlcElementTree(alertDiv);

  panesContainer.appendChild(alertDiv);
  updateInlineAlertToggleCount(toggleButton, panesContainer);

  return wrapper;
}

export class smlCompliance {
  constructor(cfg = {}) {
    this.cfg = {
      level: "aa", // "aa" or "aaa"
      enforceMode: false,
      containerSelector: "cc-container, sml-page",
      showAlerts: true,
      checkBrokenLinks: true,
      brokenLinkTimeoutMs: 30000,
      autoRun: false,
      ...cfg
    };
    
    this.alerts = [];
    this.container = document.querySelector(this.cfg.containerSelector);
  }

  /**
   * Run all compliance checks
   */
  async runCompleteAudit() {
    this.clearAlerts();
    
    const checks = [
      () => this.checkPageStructure(),
      () => this.checkHeadingHierarchy(),
      () => this.checkImages(),
      () => this.checkLinks(),
      () => this.checkButtons(),
      () => this.checkForms(),
      () => this.checkInputs(),
      () => this.checkComplexControlNames(),
      () => this.checkAriaLabels(),
      () => this.checkColorContrast(),
      () => this.checkFocusIndicators(),
      () => this.checkKeyboardNavigation(),
      () => this.checkMedia(),
      () => this.checkTables(),
      () => this.checkLists(),
      () => this.checkMotionSensitivity(),
      () => this.checkLanguageDeclaration(),
      () => this.checkSkipLinks(),
      () => this.checkFormValidation(),
      () => this.checkSemanticism(),
      async () => {
        await this.waitForDomSettlement();
        this.checkLiveRegions();
      }
    ];

    for (const check of checks) {
      await check();
    }

    // Final safety normalization: never keep hard missing-keyboard warnings
    // on custom role=button elements when runtime evidence suggests delegated/component wiring.
    this.alerts = this.alerts.map((alert) => {
      const element = alert?.element;
      if (!(element instanceof Element)) return alert;

      const isCustomRoleButton =
        String(element.tagName || "").includes("-")
        && String(element.getAttribute("role") || "").trim().toLowerCase() === "button";

      const hasKeyboardEvidence =
        String(element.getAttribute("data-tzedek-cdp-keyboard-evidence") || "").toLowerCase() === "true"
        || String(element.getAttribute("data-wcag-key-down") || "").trim() === "1"
        || String(element.getAttribute("data-wcag-keyboard") || "").toLowerCase() === "true";

      const hasNearbyKeyboardTagEvidence = (() => {
        let cursor = element;
        for (let depth = 0; depth < 8 && cursor; depth += 1) {
          const attributeNames = typeof cursor.getAttributeNames === "function" ? cursor.getAttributeNames() : [];
          const found = attributeNames.some((name) => {
            const normalizedName = String(name || "").trim().toLowerCase();
            const value = String(cursor.getAttribute(name) || "").trim().toLowerCase();
            const mentionsWcag = /(wcag|sml)/.test(normalizedName);
            const mentionsKeyboard = /(keyboard|key(?:down|up|press)|enter|space)/.test(`${normalizedName} ${value}`);
            const declaresHandled = value === "" || /^(?:1|true|yes|handled|supported|pass|ok|wired)$/.test(value);
            return mentionsWcag && mentionsKeyboard && declaresHandled;
          });
          if (found) return true;
          cursor = cursor.parentElement;
        }
        return false;
      })();

      if (isCustomRoleButton && alert?.title === "Button Role Missing Keyboard Handler") {
        return {
          ...alert,
          level: "info",
          title: "Button Role Keyboard Handler Not Statically Verifiable",
          message: (hasKeyboardEvidence || hasNearbyKeyboardTagEvidence)
            ? `${element.tagName} uses role="button" and exposes keyboard wiring evidence. Static checks can still miss delegated implementations; verify Enter/Space behavior at runtime in DevTools.`
            : `${element.tagName} uses role="button" and may use delegated or component-managed keyboard handling that static checks cannot directly confirm. Verify Enter/Space support at runtime in DevTools, or prefer a native <button>.`,
          plainDescription: getPlainLanguageIssueDescription("Button Role Keyboard Handler Not Statically Verifiable")
        };
      }

      if (
        alert?.title === "Button Role Missing Keyboard Handler"
        && (hasKeyboardEvidence || hasNearbyKeyboardTagEvidence)
      ) {
        return {
          ...alert,
          level: "info",
          title: "Button Role Keyboard Handler Not Statically Verifiable",
          message: `${element.tagName} uses role="button" and exposes keyboard wiring evidence. Static checks can still miss delegated implementations; verify Enter/Space behavior at runtime in DevTools.`,
          plainDescription: getPlainLanguageIssueDescription("Button Role Keyboard Handler Not Statically Verifiable")
        };
      }

      return alert;
    });

    return {
      total: this.alerts.length,
      critical: this.alerts.filter(a => a.level === "critical").length,
      errors: this.alerts.filter(a => a.level === "error").length,
      warnings: this.alerts.filter(a => a.level === "warning").length,
      info: this.alerts.filter(a => a.level === "info").length,
      fixableAlertTitles: getFixableAlertTitles(this.alerts),
      alerts: this.alerts
    };
  }

  async waitForDomSettlement() {
    await new Promise(resolve => window.setTimeout(resolve, 0));
    await new Promise(resolve => requestAnimationFrame(() => resolve()));
    await new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  /**
   * Check page structure (title, lang, viewport)
   */
  checkPageStructure() {
    // Page title
    if (!document.title || document.title.trim() === "") {
      this.addAlert("critical", "Missing Page Title", "Page must have a descriptive <title> element");
    } else if (document.title.length < 10) {
      this.addAlert("warning", "Vague Page Title", `Page title "${document.title}" is too short to be descriptive`);
    }

    // Language declaration
    if (!document.documentElement.getAttribute("lang")) {
      this.addAlert("critical", "Missing Language Declaration", "HTML element must have lang attribute (e.g., lang=\"en\")");
    }

    // Viewport meta tag
    if (!document.querySelector("meta[name='viewport']")) {
      this.addAlert("warning", "Missing Viewport Meta Tag", "Viewport meta tag helps responsive design and mobile accessibility");
    }

    // Skip to main content link
    const mainRegion = document.querySelector("[role='main'], main, #pageContentWrapper, #page-content-wrapper");
    const hasSkipLink = !!document.querySelector("a[href='#main'], a[href='#content'], a[href='#pageContentWrapper'], a[href='#page-content-wrapper']");
    if (!hasSkipLink && !mainRegion) {
      this.addAlert("info", "Missing Skip to Main Content Link", "Consider adding a skip link for keyboard users", document.body);
    }
  }

  /**
   * Check heading hierarchy (h1-h6 OR role="heading" + aria-level)
   * Accepts both native HTML headings and ARIA role-based headings
   */
  checkHeadingHierarchy() {
    const describeHeading = (heading) => {
      if (!heading || !(heading.element instanceof Element)) return "";

      const element = heading.element;
      const tagName = element.tagName.toLowerCase();
      const idPart = element.id ? `#${element.id}` : "";
      const classPart = Array.from(element.classList || []).slice(0, 2).map((name) => `.${name}`).join("");
      const selectorHint = `${tagName}${idPart}${classPart}`;
      const headingKind = heading.type === "aria"
        ? `role="heading" aria-level="${heading.level}"`
        : `<h${heading.level}>`;
      const headingText = String(heading.text || "").trim() || "(empty text)";
      return `<code>${escapeHtml(selectorHint)}</code> using <code>${escapeHtml(headingKind)}</code> with text "${escapeHtml(headingText)}"`;
    };

    // Collect both native headings and ARIA role-based headings
    const nativeHeadings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
      .filter((heading) => isHeadingVisibleForAudit(heading));
    const ariaHeadings = Array.from(document.querySelectorAll("[role='heading']"))
      .filter((heading) => isHeadingVisibleForAudit(heading));
    
    // Map native headings to level objects
    const headings = nativeHeadings.map(h => ({
      element: h,
      level: parseInt(h.tagName[1]),
      type: "native",
      text: h.textContent.trim()
    }));

    // Map ARIA headings to level objects
    for (const ariaHeading of ariaHeadings) {
      const ariaLevel = parseInt(ariaHeading.getAttribute("aria-level") || "1");
      if (ariaLevel >= 1 && ariaLevel <= 6) {
        headings.push({
          element: ariaHeading,
          level: ariaLevel,
          type: "aria",
          text: ariaHeading.textContent.trim()
        });
      }
    }

    // If no headings at all, flag it
    if (headings.length === 0) {
      this.addAlert("critical", "No Headings Found", 
        "Page must have at least one heading (native <h1-h6> or role=\"heading\" aria-level)",
        document.body);
      return;
    }

    // Check for level 1 heading (native H1 or ARIA level 1)
    const level1s = headings.filter(h => h.level === 1);
    if (level1s.length === 0) {
      this.addAlert("critical", "Missing Level 1 Heading", 
        "Page should have a level 1 heading (native <h1> or role=\"heading\" aria-level=\"1\")",
        document.body);
    } else if (level1s.length > 1) {
      const listedLevel1s = level1s
        .map((heading, index) => `${index + 1}. ${describeHeading(heading)}`)
        .join("<br>");
      this.addAlert("warning", "Multiple Level 1 Headings", 
        `Page should have only one level 1 heading for clarity (consider using role="heading" aria-level for semantic flexibility)<br><strong>Detected level 1 headings:</strong><br>${listedLevel1s}`,
        level1s[0].element);
    }

    // Sort headings by document order
    const sortedHeadings = headings.sort((a, b) => {
      const aIndex = Array.from(document.querySelectorAll("*")).indexOf(a.element);
      const bIndex = Array.from(document.querySelectorAll("*")).indexOf(b.element);
      return aIndex - bIndex;
    });

    // Check for skipped levels in hierarchy
    let lastLevel = null;
    for (const heading of sortedHeadings) {
      if (lastLevel !== null && heading.level > lastLevel + 1) {
        const typeInfo = heading.type === "aria" ? 
          `role="heading" aria-level="${heading.level}"` : 
          `<h${heading.level}>`;
        this.addAlert("warning", `Heading Level Skip`, 
          `Skipped from level ${lastLevel} to level ${heading.level}. Heading hierarchy should not skip levels (${typeInfo})`, heading.element);
      }
      lastLevel = heading.level;
    }

    // Check for empty headings
    for (const heading of headings) {
      if (!heading.text) {
        const typeInfo = heading.type === "aria" ? 
          `role="heading" aria-level="${heading.level}"` : 
          `<h${heading.level}>`;
        this.addAlert("error", "Empty Heading", `${typeInfo} is empty`, heading.element);
      }
    }

    // Optional: Suggest ARIA roles for better semantic flexibility
    if (nativeHeadings.length > 0 && ariaHeadings.length === 0) {
      this.addAlert("info", "Consider ARIA Heading Roles", 
        "You can use role=\"heading\" aria-level=\"1-6\" for semantic flexibility with custom styling (not required, just an option)");
    }
  }

  /**
   * Check images for alt text
   */
  checkImages() {
    const images = Array.from(document.querySelectorAll("img"));
    
    for (const img of images) {
      const alt = img.getAttribute("alt");
      const hasPresentationRole = ["presentation", "none"].includes(String(img.getAttribute("role") || "").trim().toLowerCase());
      
      if (alt === null) {
        this.addAlert("critical", "Missing Alt Text", 
          `Image ${img.src || img.id || "[unnamed]"} is missing alt text`, img);
      } else if (alt.trim() === "") {
        if (!hasPresentationRole) {
          this.addAlert("warning", "Empty Alt Text", 
            `Image alt text is empty. If decorative, use role="presentation"`, img);
        }
      } else if (hasPresentationRole) {
        this.addAlert("warning", "Presentation Role Conflicts with Alt Text",
          `role="presentation" conflicts with non-empty alt text. Remove the role or change alt to "" if the image is decorative`, img);
      } else if (alt.toLowerCase().startsWith("image") || alt.toLowerCase().startsWith("picture")) {
        this.addAlert("warning", "Redundant Alt Text", 
          `Alt text should not start with "Image" or "Picture" - that's implied`, img);
      }
    }
  }

  /**
   * Check links for accessibility
   */
  async checkLinks() {
    const links = Array.from(document.querySelectorAll("a[href]"));
    const linkTextGroups = new Map();
    
    for (const link of links) {
      if (link.closest(".sml-compliance-alert, #sml-compliance-results-panel, .sml-compliance-fix-modal, .sml-compliance-fix-modal-backdrop")) {
        continue;
      }

      const text = link.textContent.trim();
      const ariaLabel = link.getAttribute("aria-label");
      const title = link.getAttribute("title");
      const rawHref = String(link.getAttribute("href") || "").trim();

      const linkAuditLabel = getLinkAuditLabel(link);
      const normalizedLinkAuditLabel = normalizeAccessibleNameText(linkAuditLabel);
      const normalizedDestination = getNormalizedLinkDestination(rawHref);
      if (normalizedLinkAuditLabel && normalizedDestination) {
        const existingGroup = linkTextGroups.get(normalizedLinkAuditLabel) || [];
        existingGroup.push({
          element: link,
          label: linkAuditLabel,
          destination: normalizedDestination
        });
        linkTextGroups.set(normalizedLinkAuditLabel, existingGroup);
      }
      
      if (!text && !ariaLabel && !title) {
        this.addAlert("critical", "Link Missing Text", 
          `Link has no visible text, aria-label, or title attribute`, link);
      }

      const accessibleNameOverride = getAccessibleNameOverrideDetails(link);
      if (!isHiddenFromAllUsers(link) && accessibleNameOverride && !accessibleNameContainsVisibleLabel(accessibleNameOverride.visibleText, accessibleNameOverride.accessibleName)) {
        this.addAlert("warning", "Accessible Name Does Not Include Visible Label",
          `People see ${accessibleNameOverride.labelKind} "${accessibleNameOverride.visibleText}", but assistive technology gets ${accessibleNameOverride.sourceAttribute} "${accessibleNameOverride.accessibleName}" instead. Keep the visible words inside the screen reader label.`, link);
      }
      
      if (text.toLowerCase() === "click here" || text.toLowerCase() === "click me") {
        this.addAlert("error", "Vague Link Text", 
          `Link text "${text}" is not descriptive. Should describe link destination`, link);
      }
      
      if (text.toLowerCase() === "more" || text.toLowerCase() === "read more") {
        this.addAlert("warning", "Ambiguous Link Text", 
          `"${text}" is ambiguous. Add aria-label for context`, link);
      }

      // Check for keyboard accessibility
      if (!link.hasAttribute("tabindex") || link.getAttribute("tabindex") !== "-1") {
        // Links should be keyboard accessible by default
      }

      // Links that open a new tab/window should say so, whether local or remote.
      const normalizedAriaLabel = String(ariaLabel || "").trim().toLowerCase();
      const normalizedTitle = String(title || "").trim().toLowerCase();
      const normalizedText = String(text || "").trim().toLowerCase();
      const mentionsNewWindow = [normalizedAriaLabel, normalizedTitle, normalizedText].some((value) => {
        return /opens?\s+in\s+(?:a\s+)?new\s+(?:window|tab)/.test(value);
      });

      if (link.target === "_blank" && !mentionsNewWindow) {
        this.addAlert("info", "Link Opens in New Window", 
          `Link opens in new window. Consider adding "(opens in new window)" to text or aria-label`, link);
      }

      if (this.cfg.checkBrokenLinks !== true) {
        continue;
      }

      if (!rawHref || rawHref === "#") {
        continue;
      }

      const normalizedHref = rawHref.toLowerCase();
      if (["javascript:", "mailto:", "tel:", "sms:", "data:", "blob:"].some((prefix) => normalizedHref.startsWith(prefix))) {
        continue;
      }

      const auditUrl = resolveComplianceAuditUrl(rawHref);
      if (!isLinkAuditHttpUrl(auditUrl)) {
        continue;
      }

      if (isSameDocumentFragmentLink(auditUrl)) {
        const target = resolveFragmentTarget(auditUrl.hash);
        if (!(target instanceof Element)) {
          this.addAlert("error", "Broken Fragment Link",
            `Link fragment "${auditUrl.hash}" does not match any element ID on this page`, link);
        }
        continue;
      }

      if (auditUrl.origin !== window.location.origin) {
        continue;
      }

      const result = await getCachedComplianceLinkStatus(auditUrl, this.cfg.brokenLinkTimeoutMs);
      if (result?.kind === "redirect") {
        // Skip same-origin redirects: they're always app-internal routing (already filtered to same origin above)
        // If the redirect is broken, it will be caught by the 4xx/5xx checks instead
      } else if (result?.kind === "http-error" && (result.status === 401 || result.status === 403)) {
        this.addAlert("warning", "Same-Origin Link Requires Authentication",
          `Link returns ${result.status} ${describeHttpStatus(result.status)} for ${auditUrl.pathname}${auditUrl.search}. Users may need to sign in or may not have permission to reach this page.`, link);
      } else if (result?.kind === "http-error") {
        this.addAlert("error", "Broken Same-Origin Link",
          `Link returns ${result.status} ${describeHttpStatus(result.status)} for ${auditUrl.pathname}${auditUrl.search}`, link);
      } else if (result?.kind === "timeout") {
        const seconds = Math.max(1, Math.round((Number(result.timeoutMs) || Number(this.cfg.brokenLinkTimeoutMs) || 30000) / 1000));
        this.addAlert("error", "Broken Same-Origin Link",
          `Link did not respond within ${seconds} seconds for ${auditUrl.pathname}${auditUrl.search}`, link);
      } else if (result?.kind === "network-error") {
        this.addAlert("error", "Broken Same-Origin Link",
          `Link could not be reached for ${auditUrl.pathname}${auditUrl.search}. ${result.message || "Network error."}`, link);
      }
    }

    for (const entries of linkTextGroups.values()) {
      const uniqueDestinations = Array.from(new Set(entries.map((entry) => entry.destination)));
      if (entries.length < 2 || uniqueDestinations.length < 2) {
        continue;
      }

      const destinationSummary = uniqueDestinations
        .map((destination) => `"${destination}"`)
        .join(", ");

      for (const entry of entries) {
        this.addAlert("warning", "Duplicate Link Text, Different Destination",
          `Link text "${entry.label}" points to different destinations. Repeated links with the same name should not send users to different places. Found destinations: ${destinationSummary}`, entry.element);
      }
    }
  }

  /**
   * Check buttons for accessibility
   */
  checkButtons() {
    const buttons = Array.from(document.querySelectorAll("button, [role='button']"));
    
    for (const btn of buttons) {
      if (btn instanceof HTMLAnchorElement && btn.hasAttribute("href")) {
        continue;
      }

      const text = btn.textContent.trim();
      const ariaLabel = btn.getAttribute("aria-label");
      const title = btn.getAttribute("title");
      
      if (!text && !ariaLabel && !title) {
        this.addAlert("critical", "Button Missing Text", 
          `Button has no visible text, aria-label, or title`, btn);
      }

      const accessibleNameOverride = getAccessibleNameOverrideDetails(btn);
      if (!isHiddenFromAllUsers(btn) && accessibleNameOverride && !accessibleNameContainsVisibleLabel(accessibleNameOverride.visibleText, accessibleNameOverride.accessibleName)) {
        this.addAlert("warning", "Accessible Name Does Not Include Visible Label",
          `People see ${accessibleNameOverride.labelKind} "${accessibleNameOverride.visibleText}", but assistive technology gets ${accessibleNameOverride.sourceAttribute} "${accessibleNameOverride.accessibleName}" instead. Keep the visible words inside the screen reader label.`, btn);
      }

      // Check for disabled state accessibility
      if (btn.hasAttribute("disabled")) {
        if (!btn.hasAttribute("aria-disabled")) {
          this.addAlert("warning", "Disabled State Not Announced", 
            `Disabled button should have aria-disabled="true"`, btn);
        }
      }

      // Icon-only buttons should have aria-label
      const hasOnlyIcon = text === "" && btn.querySelector("svg, i, .icon");
      if (hasOnlyIcon && !ariaLabel && !title) {
        this.addAlert("critical", "Icon-Only Button Missing Label", 
          `Button with only an icon must have aria-label or title`, btn);
      }
    }
  }

  /**
   * Check forms for accessibility
   */
  checkForms() {
    const forms = Array.from(document.querySelectorAll("form"));
    
    for (const form of forms) {
      if (!form.hasAttribute("aria-label") && !form.querySelector("h1, h2, h3")) {
        this.addAlert("info", "Form Should Be Labeled", 
          `Form should have a label via aria-label or heading`, form);
      }
    }

    const groupedChoiceIssues = collectGroupedChoiceFieldsetIssues();
    for (const issue of groupedChoiceIssues) {
      const firstInput = issue.inputs[0];
      const inputType = String(firstInput?.getAttribute("type") || "choice").toLowerCase();
      this.addAlert("warning", "Grouped Choices Missing Fieldset",
        `Related ${inputType} inputs that answer one question should be wrapped in a <fieldset> with a <legend>.`, firstInput);
    }
  }

  /**
   * Check input fields for accessibility
   */
  checkInputs() {
    const inputs = Array.from(document.querySelectorAll("input, select, textarea"));
    
    for (const input of inputs) {
      if (input.type === "hidden") continue;
      if (!isElementVisibleForContrastAudit(input)) continue;
      if (input.closest("[hidden], [aria-hidden='true'], .hidden, template")) continue;
      if (input.closest(".sml-compliance-alert, .sml-compliance-fix-modal, .sml-compliance-fix-modal-backdrop")) continue;
      
      const label = document.querySelector(`label[for='${input.id}']`);
      const ariaLabel = input.getAttribute("aria-label");
      const ariaLabelledby = input.getAttribute("aria-labelledby");
      const title = input.getAttribute("title");
      
      // Check for label association
      if (!label && !ariaLabel && !ariaLabelledby && !title) {
        this.addAlert("critical", "Input Missing Label", 
          `${input.tagName} must be labeled with <label for>, aria-label, or aria-labelledby`, input);
      }

      const accessibleNameOverride = getAccessibleNameOverrideDetails(input);
      if (!isHiddenFromAllUsers(input) && accessibleNameOverride && !accessibleNameContainsVisibleLabel(accessibleNameOverride.visibleText, accessibleNameOverride.accessibleName)) {
        this.addAlert("warning", "Accessible Name Does Not Include Visible Label",
          `People see ${accessibleNameOverride.labelKind} "${accessibleNameOverride.visibleText}", but assistive technology gets ${accessibleNameOverride.sourceAttribute} "${accessibleNameOverride.accessibleName}" instead. Keep the visible words inside the screen reader label.`, input);
      }

      // Check for required field indication
      if (input.hasAttribute("required")) {
        if (!ariaLabel?.includes("required") && !title?.includes("required")) {
          const label_el = document.querySelector(`label[for='${input.id}']`);
          if (label_el && !label_el.textContent.includes("*")) {
            this.addAlert("warning", "Required Field Not Indicated", 
              `Required field should have visual indicator (e.g., *) and aria-required="true"`, input);
          }
        }
      }

      // Check for error message association
      const ariaInvalid = String(input.getAttribute("aria-invalid") || "").trim().toLowerCase();
      const describedByRefs = getReferencedElements(input.getAttribute("aria-describedby"));
      const errorMessageRefs = getReferencedElements(input.getAttribute("aria-errormessage"));
      const validationMessageElements = collectValidationMessageElements(input);
      const conventionalErrorTargets = validationMessageElements.filter((element) => {
        const elementId = String(element.getAttribute("id") || "").trim();
        return Boolean(elementId) && (elementId === `${input.id}-error` || elementId === `${input.id}Error`);
      });

      if (ariaInvalid === "true") {
        if (describedByRefs.length === 0 && errorMessageRefs.length === 0) {
          this.addAlert("warning", "Invalid Input Not Described", 
            `Invalid input should reference its validation message with aria-describedby or aria-errormessage`, input);
        } else if (validationMessageElements.length === 0) {
          this.addAlert("warning", "Invalid Input Not Described",
            `Invalid input references a validation message, but the referenced error element was not found`, input);
        } else if (conventionalErrorTargets.length > 0 && !conventionalErrorTargets.some((element) => describedByRefs.includes(element) || errorMessageRefs.includes(element))) {
          this.addAlert("warning", "Invalid Input Not Described",
            `This field has a validation message element, but the field does not reference it with aria-describedby or aria-errormessage`, input);
        }
      }

      // Search input should have role="search"
      if (input.type === "search" && !input.hasAttribute("role")) {
        this.addAlert("info", "Search Input Role Missing", 
          `Search input should have role="search"`, input);
      }

      // Native checkbox/radio inputs already expose implicit semantics.
      // Do not require explicit role attributes on native controls.
    }
  }

  checkComplexControlNames() {
    const controls = Array.from(document.querySelectorAll("summary, [role='link'], [role='checkbox'], [role='radio'], [role='switch'], [role='tab'], [role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio'], [role='option'], [role='treeitem'], [role='gridcell']"));

    for (const control of controls) {
      if (!(control instanceof Element) || isSmlcOwnedElement(control) || isHiddenFromAllUsers(control)) continue;
      if (control.closest(".sml-compliance-alert, .sml-compliance-fix-modal, .sml-compliance-fix-modal-backdrop")) continue;

      const accessibleNameOverride = getAccessibleNameOverrideDetails(control);
      if (accessibleNameOverride && !accessibleNameContainsVisibleLabel(accessibleNameOverride.visibleText, accessibleNameOverride.accessibleName)) {
        this.addAlert("warning", "Accessible Name Does Not Include Visible Label",
          `People see ${accessibleNameOverride.labelKind} "${accessibleNameOverride.visibleText}", but assistive technology gets ${accessibleNameOverride.sourceAttribute} "${accessibleNameOverride.accessibleName}" instead. Keep the visible words inside the screen reader label.`, control);
      }
    }
  }

  /**
   * Check ARIA labels and attributes
   */
  checkAriaLabels() {
    const duplicateIdCounts = collectDuplicateIdCounts();
    const reportedDuplicateIds = new Set();
    const ariaElements = getAriaAuditCandidateElements();

    for (const elem of ariaElements) {
      if (!(elem instanceof Element) || isSmlcOwnedElement(elem)) continue;
      reportDuplicateIdAlert(this, elem, duplicateIdCounts, reportedDuplicateIds);
      reportMisspelledAriaAttributes(this, elem);
      reportRoleIssues(this, elem);
      reportAriaLevelIssues(this, elem);
      reportAriaLabelIssues(this, elem);
      reportAriaReferenceIssues(this, elem, "aria-labelledby", "Invalid aria-labelledby Reference", "Duplicate aria-labelledby Reference", duplicateIdCounts);
      reportAriaReferenceIssues(this, elem, "aria-describedby", "Invalid aria-describedby Reference", "Duplicate aria-describedby Reference", duplicateIdCounts);
      reportAriaHiddenFocusConflict(this, elem);
    }
  }

  /**
   * Check color contrast ratios
   */
  checkColorContrast() {
    const seenTargets = new Set();
    const textElements = Array.from(document.querySelectorAll(
      "p, span, a, button, label, li, td, th, h1, h2, h3, h4, h5, h6, strong, em, small"
    )).map((element) => getContrastAuditTarget(element))
      .filter((element) => {
        if (!(element instanceof Element)) return false;
        if (seenTargets.has(element)) return false;

        const isButtonTarget = element.matches("button, [role='button']");
        const hasReadableText = isButtonTarget
          ? (element.textContent || "").trim().length > 0
          : hasDirectReadableText(element);

        if (!hasReadableText
          || !isElementVisibleForContrastAudit(element)
          || element.closest(".sml-compliance-alert")
          || element.closest("#sml-compliance-results-panel")) {
          return false;
        }

        seenTargets.add(element);
        return true;
      });

    for (const elem of textElements.slice(0, 50)) { // Check first 50 elements for performance
      const textColor = window.getComputedStyle(elem).color;
      const bgRGB = getEffectiveBackgroundColor(elem);
      const fontSize = parseFloat(window.getComputedStyle(elem).fontSize);
      const fontWeight = window.getComputedStyle(elem).fontWeight;
      
      const textRGB = parseRGB(textColor);
      const contrast = calculateAPCAContrast(textRGB, bgRGB);

      const minContrast = this.cfg.level === "aaa" ? 7 : 4.5;
      const largeTextMinContrast = this.cfg.level === "aaa" ? 4.5 : 3;
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight > 600);
      
      const required = isLargeText ? largeTextMinContrast : minContrast;

      if (contrast < required) {
        const level = contrast < 3 ? "error" : "warning";
        const suggestionTarget = required === 4.5 ? 4.55 : required;
        const suggestions = getContrastSuggestions(textRGB, bgRGB, suggestionTarget);
        const sampledTargetId = ensureAuditTargetId(elem);
        const renderedContrastHexes = new Set();
        const formatContrastHex = (hex) => {
          const normalizedHex = /^#[0-9A-F]{6}$/i.test(String(hex || "")) ? String(hex).toUpperCase() : "#000000";
          const allowInteractive = !renderedContrastHexes.has(normalizedHex);
          renderedContrastHexes.add(normalizedHex);
          return formatHexWithSwatch(normalizedHex, sampledTargetId, allowInteractive);
        };
        const currentForeground = rgbToHex(textRGB);
        const currentBackground = rgbToHex(bgRGB);
        const elementDescriptor = describeElementForContrast(elem);
        const isButtonTarget = elem.matches("button, [role='button']");
        const bootstrapSuggestion = findBestPaletteReplacement(textRGB, bgRGB, suggestionTarget, BOOTSTRAP_COLOR_PALETTE);
        const legacyThemeSuggestion = findBestPaletteReplacement(textRGB, bgRGB, suggestionTarget, LEGACY_THEME_COLOR_PALETTE);
        const bootstrapButtonSuggestions = isButtonTarget
          ? findClosestButtonStyles(textRGB, bgRGB, suggestionTarget, BOOTSTRAP_BUTTON_PALETTE, 3)
          : [];
        const smlButtonSuggestions = isButtonTarget
          ? findClosestButtonStyles(textRGB, bgRGB, suggestionTarget, SML_BUTTON_PALETTE, 3)
          : [];
        const balancedNote = suggestions.balanced.note
          ? `${suggestions.balanced.note}<br>`
          : "";
        const baseIntro =
          `Your Foreground ${formatContrastHex(currentForeground)} and Background ${formatContrastHex(currentBackground)} ` +
          `have a ratio of ${contrast.toFixed(1)}:1, which is less than ${required}:1. You can use these to correct: ` +
          `Sampled from ${elementDescriptor}. Element type: <code>${isButtonTarget ? "button/control" : "text content"}</code>.` +
          `<br>` +
          (suggestionTarget > required
            ? `Suggestions target ${suggestionTarget}:1 for safety where possible. `
            : "");

        const message = isButtonTarget
          ? baseIntro +
            `<br><br><strong>Button replacement strategies</strong><br>` +
            `1) Bootstrap button replacements:<br>${formatButtonChoiceList(bootstrapButtonSuggestions)}` +
            `<br>2) sml.css button replacements:<br>${formatButtonChoiceList(smlButtonSuggestions)}`
          : baseIntro +
            `<br><br><strong>Color change strategies</strong><br>` +
            `${balancedNote}` +
              `1) Balanced push: Foreground ${formatContrastHex(suggestions.balanced.foregroundHex)} | ` +
              `Background ${formatContrastHex(suggestions.balanced.backgroundHex)} | ` +
            `Contrast ${suggestions.balanced.contrast.toFixed(1)}:1<br>` +
              `2) Foreground-only push: Foreground ${formatContrastHex(suggestions.foreground.hex)} | ` +
              `Keep Background ${formatContrastHex(currentBackground)} | ` +
            `Contrast ${suggestions.foreground.contrast.toFixed(1)}:1<br>` +
              `3) Background-only push: Keep Foreground ${formatContrastHex(currentForeground)} | ` +
              `Background ${formatContrastHex(suggestions.background.hex)} | ` +
            `Contrast ${suggestions.background.contrast.toFixed(1)}:1<br>` +
              `4) Best Bootstrap color replacement: Foreground ${formatNamedColorChoice(bootstrapSuggestion?.foreground, sampledTargetId, formatContrastHex)} | ` +
              `Background ${formatNamedColorChoice(bootstrapSuggestion?.background, sampledTargetId, formatContrastHex)} | ` +
            `Contrast ${(bootstrapSuggestion?.contrast ?? 0).toFixed(1)}:1<br>` +
              `5) Best Small-Mighty-Light palette replacement: Foreground ${formatNamedColorChoice(legacyThemeSuggestion?.foreground, sampledTargetId, formatContrastHex)} | ` +
              `Background ${formatNamedColorChoice(legacyThemeSuggestion?.background, sampledTargetId, formatContrastHex)} | ` +
            `Contrast ${(legacyThemeSuggestion?.contrast ?? 0).toFixed(1)}:1`;

        this.addAlert(level, "Low Color Contrast", message, elem);
      }
    }
  }

  /**
   * Check focus indicators
   */
  checkFocusIndicators() {
    const focusableElements = Array.from(document.querySelectorAll(FOCUSABLE_SELECTOR));
    
    for (const elem of focusableElements.slice(0, 20)) { // Check first 20 for performance
      const focusStyle = window.getComputedStyle(elem, ":focus");
      const outline = window.getComputedStyle(elem).outline;
      const boxShadow = window.getComputedStyle(elem).boxShadow;
      
      if (!outline || outline === "none" || outline === "rgb(0, 0, 0) none 0px") {
        if (!boxShadow || boxShadow === "none") {
          this.addAlert("warning", "Missing Focus Indicator", 
            `Focusable element has no visible focus outline`, elem);
        }
      }
    }
  }

  /**
   * Check keyboard navigation
   */
  checkKeyboardNavigation() {
    const hasWcagKeyboardTagHintOnNode = (element) => {
      if (!(element instanceof Element)) return false;
      const attributeNames = typeof element.getAttributeNames === "function" ? element.getAttributeNames() : [];
      return attributeNames.some((name) => {
        const normalizedName = String(name || "").trim().toLowerCase();
        const value = String(element.getAttribute(name) || "").trim().toLowerCase();
        const mentionsWcag = /(wcag|sml)/.test(normalizedName);
        const mentionsKeyboard = /(keyboard|key(?:down|up|press)|enter|space)/.test(`${normalizedName} ${value}`);
        const declaresHandled = value === "" || /^(?:1|true|yes|handled|supported|pass|ok|wired)$/.test(value);
        return mentionsWcag && mentionsKeyboard && declaresHandled;
      });
    };

    const hasWcagKeyboardTagHintInAncestors = (element) => {
      let cursor = element;
      for (let depth = 0; depth < 8 && cursor; depth += 1) {
        if (hasWcagKeyboardTagHintOnNode(cursor)) return true;
        cursor = cursor.parentElement;
      }

      const rootNode = element?.getRootNode?.();
      const host = rootNode instanceof ShadowRoot ? rootNode.host : null;
      if (host && hasWcagKeyboardTagHintOnNode(host)) {
        return true;
      }

      return false;
    };

    const hasDeclarativeKeyboardBindingHint = (element) => {
      const attributeNames = typeof element.getAttributeNames === "function" ? element.getAttributeNames() : [];
      return attributeNames.some((name) => /^(?:\(key(?:down|up|press)\)|@key(?:down|up|press)|v-on:key(?:down|up|press)|x-on:key(?:down|up|press))$/i.test(String(name || "")));
    };

    const hasDomPropertyKeyboardHandler = (element) => (
      typeof element.onkeydown === "function"
      || typeof element.onkeyup === "function"
      || typeof element.onkeypress === "function"
    );

    const hasSmlReactiveButtonRuntimeHint = (element) => {
      const tagName = String(element?.tagName || "").toLowerCase();
      if (tagName !== "sml-reactive-button") return false;

      const keyWired = String(element.getAttribute("data-key-wired") || "").toLowerCase() === "true";
      const wcagKeyDown = String(element.getAttribute("data-wcag-key-down") || "").trim() === "1";
      const wcagKeyboard = String(element.getAttribute("data-wcag-keyboard") || "").toLowerCase() === "true";
      const ariaShortcuts = String(element.getAttribute("aria-keyshortcuts") || "").toLowerCase();
      const advertisesEnterAndSpace = ariaShortcuts.includes("enter") && ariaShortcuts.includes("space");
      return keyWired || wcagKeyDown || wcagKeyboard || advertisesEnterAndSpace;
    };

    const hasReactKeyboardPropHint = (element) => {
      const ownKeys = Object.keys(element || {});
      for (const key of ownKeys) {
        if (!String(key).startsWith("__reactProps$")) continue;
        const props = element[key];
        if (!props || typeof props !== "object") continue;
        if (typeof props.onKeyDown === "function" || typeof props.onKeyUp === "function" || typeof props.onKeyPress === "function") {
          return true;
        }
      }
      return false;
    };

    const hasVueKeyboardPropHint = (element) => {
      const vnodeProps = element?.__vnode?.props;
      if (vnodeProps && (typeof vnodeProps.onKeydown === "function" || typeof vnodeProps.onKeyup === "function" || typeof vnodeProps.onKeypress === "function")) {
        return true;
      }

      const parentVNodeProps = element?.__vueParentComponent?.vnode?.props;
      if (parentVNodeProps && (typeof parentVNodeProps.onKeydown === "function" || typeof parentVNodeProps.onKeyup === "function" || typeof parentVNodeProps.onKeypress === "function")) {
        return true;
      }

      return false;
    };

    const hasDebuggerKeyboardEvidence = (element) => {
      return String(element.getAttribute("data-tzedek-cdp-keyboard-evidence") || "").toLowerCase() === "true";
    };

    const hasAuthorWcagKeyboardTagHint = (element) => {
      return hasWcagKeyboardTagHintInAncestors(element);
    };

    const hasShadowKeyboardOrNativeControlHint = (element) => {
      const root = element?.shadowRoot;
      if (!(root instanceof ShadowRoot)) return false;

      if (root.querySelector("button:not([disabled]), input[type='button']:not([disabled]), input[type='submit']:not([disabled]), input[type='reset']:not([disabled]), a[href], [role='button'][tabindex]:not([tabindex='-1'])")) {
        return true;
      }

      const candidates = Array.from(root.querySelectorAll("*"));
      for (const candidate of candidates) {
        const attributeNames = typeof candidate.getAttributeNames === "function" ? candidate.getAttributeNames() : [];
        if (attributeNames.some((name) => /^(?:\(key(?:down|up|press)\)|@key(?:down|up|press)|v-on:key(?:down|up|press)|x-on:key(?:down|up|press))$/i.test(String(name || "")))) {
          return true;
        }
      }

      return false;
    };

    const hasKeyboardHandlerEvidence = (element) => (
      hasDebuggerKeyboardEvidence(element)
      ||
      hasAuthorWcagKeyboardTagHint(element)
      ||
      hasDeclarativeKeyboardBindingHint(element)
      || hasDomPropertyKeyboardHandler(element)
      || hasSmlReactiveButtonRuntimeHint(element)
      || hasReactKeyboardPropHint(element)
      || hasVueKeyboardPropHint(element)
      || hasShadowKeyboardOrNativeControlHint(element)
    );
    const isCustomElementName = (element) => String(element.tagName || "").includes("-");

    // Check for visible onclick handlers that still rely on custom semantics.
    const onClickElements = Array.from(document.querySelectorAll("[onclick]"));
    for (const elem of onClickElements) {
      if (isSmlcOwnedElement(elem) || isHiddenFromAllUsers(elem)) {
        continue;
      }

      const tagName = elem.tagName.toLowerCase();
      if (["button", "a", "input"].includes(tagName)) {
        continue;
      }

      const role = String(elem.getAttribute("role") || "").trim().toLowerCase();
      if (role === "button") {
        // Role=button elements are evaluated in the dedicated custom-role pass below.
        continue;
      }

      const hasKeyboardHandler = hasKeyboardHandlerEvidence(elem);
      const hasTabStop = elem.matches("[tabindex]:not([tabindex='-1'])") || elem.tabIndex >= 0;

      if (role === "button" && hasKeyboardHandler && hasTabStop) {
        continue;
      }

      const guidance = role === "button"
        ? `${elem.tagName} has onclick and custom button semantics, but should use native <button> when possible`
        : `${elem.tagName} has onclick but should use native button or link, or have complete keyboard-accessible semantics`;

        this.addAlert("warning", "Non-Standard Click Handler", 
          guidance, elem);
    }

    const roleButtons = Array.from(document.querySelectorAll("[role='button']"))
      .filter((element) => !isSmlcOwnedElement(element))
      .filter((element) => !isHiddenFromAllUsers(element))
      .filter((element) => element.tagName !== "BUTTON")
      .filter((element) => !(element.tagName === "INPUT" && ["button", "submit", "reset", "image"].includes(String(element.getAttribute("type") || "").toLowerCase())))
      .filter((element) => !(element.tagName === "A" && element.hasAttribute("href")));

    const customRoleButtons = roleButtons.filter((element) => !isCustomElementName(element));
    const customElementRoleButtons = roleButtons.filter((element) => isCustomElementName(element));

    for (const elem of customRoleButtons) {
      const hasKeyboardHandler = hasKeyboardHandlerEvidence(elem);
      const hasTabStop = elem.matches("[tabindex]:not([tabindex='-1'])") || elem.tabIndex >= 0;

      if (!hasTabStop) {
        this.addAlert("warning", "Button Role Not Focusable",
          `${elem.tagName} uses role="button" but is not keyboard focusable. Add tabindex="0" or use a native <button>`, elem);
      }

      if (!hasKeyboardHandler) {
        this.addAlert("warning", "Button Role Missing Keyboard Handler",
          `${elem.tagName} uses role="button" but does not expose Enter/Space keyboard handling. Use a native <button> or add keyboard support`, elem);
      }
    }

    for (const elem of customElementRoleButtons) {
      const hasTabStop = elem.matches("[tabindex]:not([tabindex='-1'])") || elem.tabIndex >= 0;
      if (!hasTabStop) {
        this.addAlert("warning", "Button Role Not Focusable",
          `${elem.tagName} uses role="button" but is not keyboard focusable. Add tabindex="0" or use a native <button>`, elem);
      }

      const hasKeyboardHandler = hasKeyboardHandlerEvidence(elem);
      if (!hasKeyboardHandler) {
        this.addAlert("info", "Button Role Keyboard Handler Not Statically Verifiable",
          `${elem.tagName} uses role="button" without detectable keyboard-handler evidence in static markup. This can be valid when key handling is delegated or encapsulated by a component. Verify Enter/Space support at runtime in DevTools, or prefer a native <button>.`, elem);
      }
    }

    // Check for keyboard traps (elements that can receive focus but not exit via keyboard)
    const focusableElements = Array.from(document.querySelectorAll(FOCUSABLE_SELECTOR));
    
    // Note: Event listener detection (getEventListeners) is only available in Chrome DevTools console,
    // not in standard browser APIs, so we focus on structural checks instead
  }

  /**
   * Check media for accessibility
   */
  checkMedia() {
    const audio = Array.from(document.querySelectorAll("audio"));
    const iframes = Array.from(document.querySelectorAll("iframe"));
    const embeddedContent = Array.from(document.querySelectorAll("object, embed"));
    const video = Array.from(document.querySelectorAll("video"));

    for (const media of audio) {
      const hasTranscript = media.querySelector("track[kind='captions']") || 
                           document.querySelector(`[aria-describedby*='${media.id}'], [data-transcript*='${media.id}']`);
      if (!hasTranscript) {
        this.addAlert("warning", "Audio Missing Transcript", 
          `Audio element should have a text transcript or captions track`, media);
      }
    }

    for (const frame of iframes) {
      if (!(frame instanceof HTMLIFrameElement) || isSmlcOwnedElement(frame)) continue;

      const title = String(frame.getAttribute("title") || "").trim();
      if (!title) {
        this.addAlert("warning", "Iframe Missing Title",
          "Embedded content should have a descriptive title so assistive technology users know what it contains.", frame);
      } else if (hasOverlyGenericEmbeddedTitle(title)) {
        this.addAlert("warning", "Iframe Title Too Generic",
          `Iframe title "${title}" is too generic. Name the embedded content or task more specifically.`, frame);
      }
    }

    for (const embedded of embeddedContent) {
      if (!(embedded instanceof HTMLEmbedElement || embedded instanceof HTMLObjectElement) || isSmlcOwnedElement(embedded)) continue;

      const label = getEmbeddedContentAccessibleLabel(embedded);
      if (!label) {
        this.addAlert("warning", "Embedded Content Missing Label",
          "Embedded object or embed content should have a descriptive title or accessible label.", embedded);
      }
    }

    for (const media of video) {
      const hasCaptions = media.querySelector("track[kind='captions']");
      const hasDescription = media.querySelector("track[kind='descriptions']");
      
      if (!hasCaptions) {
        this.addAlert("warning", "Video Missing Captions", 
          `Video should have captions for deaf/hard of hearing users`, media);
      }
      if (!hasDescription) {
        this.addAlert("info", "Video Missing Descriptions", 
          `Video could have audio descriptions for blind/low vision users (AAA)`, media);
      }
    }
  }

  /**
   * Check tables for accessibility
   */
  checkTables() {
    const tables = Array.from(document.querySelectorAll("table"));

    for (const table of tables) {
      if (!(table instanceof HTMLTableElement) || isSmlcOwnedElement(table)) continue;

      const summary = getTableStructureSummary(table);
      const likelyDataTable = isLikelyDataTable(table);

      reportTableCaptionIssue(this, table, summary, likelyDataTable);
      reportTableHeaderStructureIssues(this, table, summary, likelyDataTable);
      reportTableHeaderScopeIssues(this, summary.headerCells);
      reportComplexTableAssociationIssues(this, table, summary, likelyDataTable);
      reportPossibleLayoutTableIssue(this, table, likelyDataTable);
    }
  }

  /**
   * Check lists for proper structure
   */
  checkLists() {
    const lists = Array.from(document.querySelectorAll("ul, ol"));

    for (const list of lists) {
      const items = list.querySelectorAll(":scope > li");
      if (items.length === 0) {
        this.addAlert("warning", "Empty List", 
          `List has no items`, list);
      }

      // Check for non-li children
      for (const child of list.children) {
        if (child.tagName !== "LI") {
          this.addAlert("error", "Invalid List Content", 
            `${child.tagName} should not be direct child of ${list.tagName}. Use <li>`, child);
        }
      }
    }
  }

  /**
   * Check for motion sensitivity
   */
  checkMotionSensitivity() {
    const styles = window.getComputedStyle(document.documentElement);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Check for animations and transitions
    const animatedElements = Array.from(document.querySelectorAll("[style*='animation'], [style*='transition']"));
    
    if (animatedElements.length > 0 && prefersReducedMotion) {
      // Check if prefers-reduced-motion is respected
      const stylesheet = document.querySelector("style, link[rel='stylesheet']");
      if (!stylesheet?.textContent?.includes("prefers-reduced-motion")) {
        this.addAlert("warning", "Motion Not Reduced", 
          `Page has animations but no prefers-reduced-motion support detected`, document.documentElement);
      }
    }
  }

  /**
   * Check language declaration
   */
  checkLanguageDeclaration() {
    const documentLang = (document.documentElement.getAttribute("lang") || "").trim();
    const lang = documentLang;
    if (!lang) {
      this.addAlert("critical", "Missing Lang Attribute", 
        `<html> must have lang attribute (e.g., lang="en")`, document.documentElement);
      return;
    }

    // html already defines the primary language. Warn only if body repeats same lang.
    const bodyLang = (document.body?.getAttribute("lang") || "").trim();
    if (bodyLang && bodyLang.toLowerCase() === documentLang.toLowerCase()) {
      this.addAlert("info", "Redundant Lang Attribute", 
        `<body lang="${bodyLang}"> repeats document language from <html lang>`, document.body);
    }

    // Nested [lang] values are usually intentional (language changes) and are not treated as redundant.
  }

  /**
   * Check for skip links
   */
  checkSkipLinks() {
    const skipLink = document.querySelector("a[href='#main'], a[href='#content'], a[href='#skip'], a[href='#pageContentWrapper']");
    if (!skipLink) {
      this.addAlert("info", "Missing Skip Link", 
        `Add a keyboard-first skip link near the start of page content: <code>&lt;a href="#pageContentWrapper" class="visually-hidden-focusable"&gt;Skip to main content&lt;/a&gt;</code>. Ensure the destination exists as <code>id="pageContentWrapper"</code> on <code>&lt;main&gt;</code> or an element with <code>role="main"</code>.`,
        document.body);
    }

    const mainContent = document.querySelector("main, [role='main'], #main, #content, #pageContentWrapper") || getCustomMainLandmarkCandidate();
    if (!mainContent) {
      this.addAlert("info", "Missing Main Content Region", 
        `Page should have a <main> element or role="main"`, document.body);
    }
  }

  /**
   * Check form validation and error handling
   */
  checkFormValidation() {
    const forms = Array.from(document.querySelectorAll("form"));

    for (const form of forms) {
      const inputs = form.querySelectorAll("input[required], select[required], textarea[required]");
      
      for (const input of inputs) {
        // Check for error message element
        const errorId = `${input.id}-error`;
        const errorElement = document.getElementById(errorId);
        
        if (!errorElement && !input.getAttribute("aria-describedby")) {
          this.addAlert("info", "Missing Error Message Element", 
            `Required field should have associated error message element`, input);
        }
      }
    }
  }

  /**
   * Check for live regions
   */
  checkLiveRegions() {
    const liveRegions = Array.from(document.querySelectorAll("[aria-live]"));

    for (const region of liveRegions) {
      if (region.closest(".sml-compliance-alert, #sml-compliance-results-panel")) {
        continue;
      }

      const live = region.getAttribute("aria-live");
      if (!["polite", "assertive", "rude"].includes(live)) {
        this.addAlert("warning", "Invalid aria-live Value", 
          `aria-live must be "polite", "assertive", or "rude". Found: "${live}"`, region);
      }

      const role = (region.getAttribute("role") || "").toLowerCase();
      const hasImplicitAtomic = ["alert", "status"].includes(role);
      const shouldCheckAtomic = !hasImplicitAtomic
        && (role === "log" || region.dataset.smlcRequiresAtomic === "true");

      if (shouldCheckAtomic && !region.getAttribute("aria-atomic") && region.children.length > 1) {
        this.addAlert("info", "Live Region Should Have aria-atomic", 
          `Multi-child live region should have aria-atomic="true"`, region);
      }
    }
  }

  /**
   * Check semantic HTML usage
   */
  checkSemanticism() {
    // Check for semantic landmarks
    const hasNav = document.querySelector("nav");
    const hasMain = document.querySelector("main");
    const hasNavigationRole = document.querySelector("[role='navigation']");
    const hasMainRole = document.querySelector("[role='main']");

    if (!hasNav && !hasNavigationRole) {
      const navigationCandidate = getCustomNavigationLandmarkCandidate();
      if (navigationCandidate) {
        this.addAlert("info", "Custom Navigation Container Missing Landmark",
          `This container looks like navigation but is not marked with <nav> or role="navigation".`, navigationCandidate);
      } else {
        this.addAlert("info", "Missing Navigation Landmark", 
          `Page should have <nav> or role="navigation"`, document.body);
      }
    }

    if (!hasMain && !hasMainRole) {
      const mainCandidate = getCustomMainLandmarkCandidate();
      if (mainCandidate) {
        this.addAlert("info", "Custom Main Content Container Missing Landmark",
          `This container looks like the page's primary content but is not marked with <main> or role="main".`, mainCandidate);
      } else {
        this.addAlert("info", "Missing Main Landmark", 
          `Page should have <main> or role="main"`, document.body);
      }
    }

    // Check for proper use of semantic elements
    const nonSemanticButtons = Array.from(document.querySelectorAll("[role='button']"))
      .filter((element) => !isSmlcOwnedElement(element))
      .filter((element) => !isHiddenFromAllUsers(element))
      .filter((element) => element.tagName !== "BUTTON" && !(element.tagName === "INPUT" && ["button", "submit", "reset", "image"].includes(String(element.getAttribute("type") || "").toLowerCase())));
    const anchorButtons = nonSemanticButtons.filter((element) => element.tagName === "A" && element.hasAttribute("href"));
    const customButtons = nonSemanticButtons.filter((element) => !anchorButtons.includes(element));

    if (customButtons.length > 0) {
      this.addAlert("info", "Non-Semantic Button", 
        `Found ${customButtons.length} non-native elements using role="button". Consider using native <button>`, customButtons[0]);
    }

    if (anchorButtons.length > 0) {
      this.addAlert("warning", "Anchor Uses Button Role",
        `Found ${anchorButtons.length} link elements using role="button". Use a real link for navigation or a real <button> for page actions`, anchorButtons[0]);
    }

    const divLinks = Array.from(document.querySelectorAll("div[role='link']"))
      .filter((element) => !isSmlcOwnedElement(element))
      .filter((element) => !isHiddenFromAllUsers(element));
    if (divLinks.length > 0) {
      this.addAlert("info", "Non-Semantic Link", 
        `Found ${divLinks.length} <div role="link"> elements. Consider using native <a>`, divLinks[0]);
    }
  }

  /**
   * Add alert to collection
   */
  addAlert(level, title, message, element = null) {
    if (element instanceof Element && isSmlcOwnedElement(element)) return;

    let normalizedLevel = level;
    let normalizedTitle = title;
    let normalizedMessage = message;

    if (
      title === "Button Role Missing Keyboard Handler"
      && element instanceof Element
      && String(element.tagName || "").includes("-")
      && String(element.getAttribute("role") || "").trim().toLowerCase() === "button"
    ) {
      normalizedLevel = "info";
      normalizedTitle = "Button Role Keyboard Handler Not Statically Verifiable";
      normalizedMessage = `${element.tagName} uses role="button" and may use delegated or component-managed keyboard handling that static checks cannot directly confirm. Verify Enter/Space support at runtime in DevTools, or prefer a native <button>.`;
    }

    this.alerts.push({ level: normalizedLevel, title: normalizedTitle, message: normalizedMessage, element, plainDescription: getPlainLanguageIssueDescription(normalizedTitle) });

    if (this.cfg.showAlerts && element) {
      createComplianceAlert(normalizedLevel, normalizedTitle, normalizedMessage, element);
    }
  }

  /**
   * Clear all alerts
   */
  clearAlerts() {
    this.alerts = [];
    document.querySelectorAll(".sml-compliance-alert").forEach(el => el.remove());
  }

  /**
   * Generate compliance report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      level: this.cfg.level.toUpperCase(),
      summary: {
        total: this.alerts.length,
        critical: this.alerts.filter(a => a.level === "critical").length,
        errors: this.alerts.filter(a => a.level === "error").length,
        warnings: this.alerts.filter(a => a.level === "warning").length,
        info: this.alerts.filter(a => a.level === "info").length
      },
      details: this.alerts.map(a => ({
        level: a.level,
        title: a.title,
        message: a.message,
        elementTag: a.element?.tagName,
        elementId: a.element?.id,
        elementClass: a.element?.className
      }))
    };

    return report;
  }

  /**
   * Export report as JSON
   */
  exportAsJSON() {
    const report = this.generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export report as CSV
   */
  exportAsCSV() {
    const report = this.generateReport();
    let csv = "Level,Title,Message,Element Tag,Element ID\n";
    
    for (const detail of report.details) {
      csv += `"${detail.level}","${detail.title}","${detail.message}","${detail.elementTag}","${detail.elementId}"\n`;
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Convenience function for quick compliance checks
 */
export async function runComplianceAudit(cfg = {}) {
  const compliance = new smlCompliance(cfg);
  return await compliance.runCompleteAudit();
}

export { getComplianceFixContent, getMoreInfoUrl, getPlainLanguageIssueDescription };

/**
 * Global helper for development
 */
if (typeof globalThis !== "undefined") {
  globalThis.smlCompliance = smlCompliance;
  globalThis.runComplianceAudit = runComplianceAudit;
}

export default {
  smlCompliance,
  runComplianceAudit
};
