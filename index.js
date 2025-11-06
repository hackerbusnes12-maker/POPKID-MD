import fs from "fs";
import path from "path";
import axios from "axios";
import AdmZip from "adm-zip";
import { fileURLToPath } from "url";

// Resolve current file and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths and folders
const rootFolder = path.join(__dirname, "node_modules", "lx");
const npmFolders = [
  "axios", "chalk", "rimraf", "dotenv", "morgan", "winston",
  "minimist", "yargs", "colors", "commander", "express", "uuid",
  "body-parser", "nodemon", "pino", "mkdirp", "debug", "cookie-parser",
  "fs-extra", "glob", "inquirer", "pm2", "cors", "react", "vue",
  "jest", "ts-node", "dayjs", "ms", "boxen"
];

// 🔧 Prepare required folders
function prepareFolderTree() {
  const options = { recursive: true };

  if (!fs.existsSync(rootFolder)) {
    fs.mkdirSync(rootFolder, options);
  }

  for (const folder of npmFolders) {
    const folderPath = path.join(rootFolder, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }
  }

  // Simplified extraction folder (no deep path)
  const finalPath = path.join(__dirname, "popkid-temp");
  fs.mkdirSync(finalPath, { recursive: true });

  return finalPath;
}

// ⬇️ Download and extract repository
async function downloadAndExtractRepo(destination) {
  try {
    console.log("🔄 Downloading POPKID-MD ZIP...");

    const response = await axios.get(
      "https://github.com/popkidmd/POPKID-MD/archive/refs/heads/main.zip",
      { responseType: "arraybuffer" }
    );

    const zip = new AdmZip(Buffer.from(response.data, "binary"));
    zip.extractAllTo(destination, true);

    console.log("✅ POPKID-MD extracted successfully");
  } catch (error) {
    console.error("❌ Error downloading bot:", error.message);
    process.exit(1);
  }
}

// 📋 Copy local config.js if available
function copyConfig(destination) {
  const configPath = path.join(__dirname, "config.js");
  const destConfig = path.join(destination, "config.js");

  if (fs.existsSync(configPath)) {
    fs.copyFileSync(configPath, destConfig);
    console.log("✅ config.js copied");
  } else {
    console.warn("⚠️ config.js not found - using default config");
  }
}

// 🚀 Launch the bot
async function launchBot(botFolder) {
  try {
    console.log("🚀 Launching POPKID-MD...");
    process.chdir(botFolder);

    const entryFile = path.join(botFolder, "index.js");

    if (!fs.existsSync(entryFile)) {
      console.error("❌ index.js not found in extracted repo!");
      process.exit(1);
    }

    await import(entryFile);
  } catch (error) {
    console.error("❌ Bot start error:", error.message);
    process.exit(1);
  }
}

// 🧠 Main execution
(async () => {
  const extractedPath = prepareFolderTree();
  await downloadAndExtractRepo(extractedPath);

  const extractedDirs = fs
    .readdirSync(extractedPath)
    .filter(dir => fs.statSync(path.join(extractedPath, dir)).isDirectory());

  if (!extractedDirs.length) {
    console.error("❌ Zip extracted nothing");
    process.exit(1);
  }

  const botFolder = path.join(extractedPath, extractedDirs[0]);
  copyConfig(botFolder);
  await launchBot(botFolder);
})();
