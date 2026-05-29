import fs from "fs";
import path from "path";

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (name === "route.ts") patch(p);
  }
}

function patch(file) {
  let c = fs.readFileSync(file, "utf8");
  if (!c.includes("isFirestoreConfigured")) return;

  if (!c.includes("getFirestoreConfigError")) {
    c = c.replace(
      /import \{([^}]+)\} from "@\/lib\/firestore"/,
      (m, inner) => {
        if (inner.includes("getFirestoreConfigError")) return m;
        return `import {${inner.trim().replace(/,\s*$/, "")}, getFirestoreConfigError } from "@/lib/firestore"`;
      },
    );
  }

  c = c.replace(
    /\{ error: "Firestore är inte konfigurerad\." \}/g,
    "{ error: getFirestoreConfigError() }",
  );

  fs.writeFileSync(file, c);
  console.log("patched", file);
}

walk("src/app/api");
