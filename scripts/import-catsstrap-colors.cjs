const fs = require("node:fs");
const path = require("node:path");

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Usage: node scripts/import-catsstrap-colors.cjs <catsStrap.css>");

const source = fs.readFileSync(sourcePath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const utilities = source.match(/^\.(?:bg|text)-[a-z]+\s*\{(?:background-color|color):[a-z#\d]+!important;?\}/gm) || [];
const buttons = source.match(/^\.(?:btn-|btn-outline-)[A-Z][A-Za-z]+\s*\{--bs-btn-[^{}]+\}/gm) || [];
if (!utilities.length || !buttons.length) throw new Error("Could not find catsStrap color rules");

const output = path.join(__dirname, "../src/runtime/assets/catsStrap.css");
fs.writeFileSync(output, ["/* Color utilities and named button variants from CATS catsStrap.css. */", ...utilities, ...buttons, ""].join("\n"));
