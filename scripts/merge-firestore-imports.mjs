import fs from "fs";
import path from "path";

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (name === "route.ts") merge(p);
  }
}

function merge(file) {
  let c = fs.readFileSync(file, "utf8");
  const imports = [...c.matchAll(/import \{([^}]+)\} from "@\/lib\/firestore";/g)];
  if (imports.length < 2) return;

  const names = new Set();
  for (const m of imports) {
    for (const part of m[1].split(",")) {
      const n = part.trim();
      if (n) names.add(n);
    }
  }

  const merged = `import { ${[...names].join(", ")} } from "@/lib/firestore";`;
  c = c.replace(/import \{[^}]+\} from "@\/lib\/firestore";\r?\n/g, "");
  const firstImport = c.search(/^import /m);
  c = c.slice(0, firstImport) + merged + "\n" + c.slice(firstImport);

  fs.writeFileSync(file, c);
  console.log("merged", file);
}

walk("src/app/api");
