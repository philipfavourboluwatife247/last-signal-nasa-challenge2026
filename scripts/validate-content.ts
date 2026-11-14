import fs from "node:fs";
import path from "node:path";
import { DossierSchema } from "../lib/schema";

// Usage: validate-content.ts            -> checks content/machines, exits 1 on any error
//        validate-content.ts --expect-fail <dir> -> passes only if every file in <dir> is REJECTED
const args = process.argv.slice(2);
const expectFail = args.includes("--expect-fail");
const dir = path.join(process.cwd(), args.find((a) => !a.startsWith("--")) ?? "content/machines");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
let bad = 0, drafts = 0;

for (const f of files) {
  const r = DossierSchema.safeParse(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  if (expectFail) {
    if (r.success) { console.error(`FAIL: ${f} should have been rejected but passed`); bad++; }
    else console.log(`ok: ${f} correctly rejected (${r.error.issues[0].message})`);
    continue;
  }
  if (!r.success) {
    bad++;
    console.error(`INVALID ${f}`);
    r.error.issues.forEach((i) => console.error(`  - ${i.path.join(".") || "(root)"}: ${i.message}`));
  } else if (r.data.review.status === "draft") {
    drafts++;
    const noUrl = r.data.sources.filter((x) => !x.url).map((x) => x.id);
    console.warn(`draft: ${f} still needs fact-check sign-off` + (noUrl.length ? ` (source link missing: ${noUrl.join(", ")})` : ""));
  } else console.log(`ok: ${f}`);
}
console.log(`\n${files.length} file(s) checked, ${bad} problem(s)` + (expectFail ? "" : `, ${drafts} draft(s) awaiting verification`));
process.exit(bad ? 1 : 0);
