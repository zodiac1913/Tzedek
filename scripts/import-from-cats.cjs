const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const catsRoot = "/Users/rxjr/Desktop/Dev/CatsDbGetSomeIpsum/cms-dotnet-cats-source";
const sourceDir = path.join(catsRoot, "wwwroot", "js", "global", "sml", "Docs");
const sourceAssetsDir = path.join(catsRoot, "wwwroot", "images");
const runtimeDir = path.join(repoRoot, "src", "runtime");
const runtimeAssetsDir = path.join(runtimeDir, "assets");
const extensionPageDir = path.join(repoRoot, "extension", "page");
const extensionAssetsDir = path.join(extensionPageDir, "assets");

const filesToCopy = [
  "smlCompliance.js",
  "smlComplianceRunner.js"
];

fs.mkdirSync(runtimeDir, { recursive: true });
fs.mkdirSync(runtimeAssetsDir, { recursive: true });
fs.mkdirSync(extensionPageDir, { recursive: true });
fs.mkdirSync(extensionAssetsDir, { recursive: true });

for (const fileName of filesToCopy) {
  const sourcePath = path.join(sourceDir, fileName);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing source file: ${sourcePath}`);
  }

  const runtimeTarget = path.join(runtimeDir, fileName);
  const extensionTarget = path.join(extensionPageDir, fileName);

  fs.copyFileSync(sourcePath, runtimeTarget);
  fs.copyFileSync(sourcePath, extensionTarget);

  console.log(`Imported ${fileName}`);
}

const smokeSourcePath = path.join(sourceAssetsDir, "smoke.png");
if (!fs.existsSync(smokeSourcePath)) {
  throw new Error(`Missing smoke asset: ${smokeSourcePath}`);
}

fs.copyFileSync(smokeSourcePath, path.join(runtimeAssetsDir, "smoke.png"));
fs.copyFileSync(smokeSourcePath, path.join(extensionAssetsDir, "smoke.png"));
console.log("Imported smoke.png");
