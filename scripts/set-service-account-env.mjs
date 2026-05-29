import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const saPath = path.join(__dirname, "service-account.json");
const envPath = path.join(__dirname, "..", ".env");

if (!fs.existsSync(saPath)) {
  console.error("Missing scripts/service-account.json");
  process.exit(1);
}

const sa = JSON.parse(fs.readFileSync(saPath, "utf8"));
let env = fs.readFileSync(envPath, "utf8");
env = env.replace(/^FIREBASE_SERVICE_ACCOUNT_JSON=.*\r?\n/gm, "");
env = env.replace(
  /# Server-API.*\r?\n(?:# FIREBASE.*\r?\n)?/,
  "# Server-API (service account)\n",
);
const line = `FIREBASE_SERVICE_ACCOUNT_JSON=${JSON.stringify(sa)}`;
if (env.includes("ADMIN_PASSWORD=")) {
  env = env.replace(
    /(ADMIN_PASSWORD=.*\r?\n)/,
    `$1\n${line}\n`,
  );
} else {
  env += `\n${line}\n`;
}
fs.writeFileSync(envPath, env);
console.log("Updated .env with FIREBASE_SERVICE_ACCOUNT_JSON");
