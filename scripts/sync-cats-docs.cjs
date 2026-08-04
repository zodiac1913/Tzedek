const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const runtimeDir = path.join(repoRoot, "src", "runtime");
const runtimeAssetsDir = path.join(runtimeDir, "assets");
const catsRoot = "/Users/rxjr/Desktop/Dev/cms-dotnet-cats-source";
const catsDocsDir = path.join(catsRoot, "wwwroot", "js", "global", "sml", "Docs");
const catsDocsAssetsDir = path.join(catsDocsDir, "assets");

const runtimeFiles = [
  "smlCompliance.js",
  "smlComplianceRunner.js"
];

fs.mkdirSync(catsDocsDir, { recursive: true });
fs.mkdirSync(catsDocsAssetsDir, { recursive: true });

for (const fileName of runtimeFiles) {
  const sourcePath = path.join(runtimeDir, fileName);
  const targetPath = path.join(catsDocsDir, fileName);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing runtime file: ${sourcePath}`);
  }

  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Published ${fileName}`);
}

const runtimeAssetFiles = fs.readdirSync(runtimeAssetsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name);

for (const assetFile of runtimeAssetFiles) {
  const sourceAssetPath = path.join(runtimeAssetsDir, assetFile);
  const targetAssetPath = path.join(catsDocsAssetsDir, assetFile);
  fs.copyFileSync(sourceAssetPath, targetAssetPath);
  console.log(`Published asset ${assetFile}`);
}