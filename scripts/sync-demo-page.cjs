const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const runtimeDir = path.join(repoRoot, "src", "runtime");
const runtimeAssetsDir = path.join(runtimeDir, "assets");
const bookmarkletDir = path.join(repoRoot, "bookmarklet");
const demoPageDir = path.join(repoRoot, "demo", "page");
const demoAssetsDir = path.join(demoPageDir, "assets");

const runtimeFilesToCopy = [
  "smlCompliance.js",
  "smlComplianceRunner.js"
];

const bookmarkletFilesToCopy = [
  "compliance-bookmarklet.html"
];

fs.mkdirSync(demoPageDir, { recursive: true });
fs.mkdirSync(demoAssetsDir, { recursive: true });

for (const fileName of runtimeFilesToCopy) {
  const sourcePath = path.join(runtimeDir, fileName);
  const targetPath = path.join(demoPageDir, fileName);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing runtime file: ${sourcePath}. Run npm run import:cats first.`);
  }

  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Synced ${fileName}`);
}

for (const fileName of bookmarkletFilesToCopy) {
  const sourcePath = path.join(bookmarkletDir, fileName);
  const targetPath = path.join(demoPageDir, fileName);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing bookmarklet file: ${sourcePath}.`);
  }

  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Synced ${fileName}`);
}

const runtimeAssetFiles = fs.readdirSync(runtimeAssetsDir, { withFileTypes: true })
  .filter(entry => entry.isFile())
  .map(entry => entry.name);

for (const assetFile of runtimeAssetFiles) {
  const sourceAssetPath = path.join(runtimeAssetsDir, assetFile);
  const targetAssetPath = path.join(demoAssetsDir, assetFile);
  fs.copyFileSync(sourceAssetPath, targetAssetPath);
  console.log(`Synced ${assetFile}`);
}